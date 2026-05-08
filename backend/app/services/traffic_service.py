from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.services.geo_service import geocode


def _fallback_traffic(location: str) -> dict[str, Any]:
    hour = datetime.now().hour
    rush = hour in {8, 9, 10, 17, 18, 19, 20}
    metro_penalty = any(city in location.lower() for city in {"bangalore", "bengaluru", "mumbai", "delhi", "hyderabad"})
    congestion = "high" if rush and metro_penalty else ("moderate" if rush else "normal")
    delay = 35 if congestion == "high" else (18 if congestion == "moderate" else 8)
    return {
        "congestion_level": congestion,
        "delay_minutes": delay,
        "average_speed_kmph": 18 if congestion == "high" else 28,
        "source": "time_of_day_fallback",
        "summary": f"{congestion.title()} traffic expected around {location}.",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


async def traffic_context(location: str) -> dict[str, Any]:
    point = await geocode(location)
    if not point or not settings.tomtom_api_key or "garbage" in settings.tomtom_api_key.lower():
        return _fallback_traffic(location)

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json",
                params={"point": f"{point['lat']},{point['lon']}", "key": settings.tomtom_api_key},
            )
            response.raise_for_status()
            flow = response.json().get("flowSegmentData", {})
    except Exception:
        return _fallback_traffic(location)

    current = flow.get("currentSpeed") or 1
    free_flow = flow.get("freeFlowSpeed") or current
    ratio = current / max(free_flow, 1)
    if ratio < 0.45:
        level, delay = "high", 35
    elif ratio < 0.75:
        level, delay = "moderate", 18
    else:
        level, delay = "normal", 8
    return {
        "congestion_level": level,
        "delay_minutes": delay,
        "average_speed_kmph": current,
        "source": "tomtom",
        "summary": f"Traffic speed is {current} km/h versus free-flow {free_flow} km/h.",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }

