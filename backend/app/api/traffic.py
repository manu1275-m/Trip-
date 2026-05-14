"""
Real-time traffic info via Google Maps Distance Matrix API.
Falls back to mock data if the API key / quota is not available.
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from fastapi import APIRouter, Query

router = APIRouter()

GMAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")


def _congestion_label(ratio: float) -> str:
    """Convert duration_in_traffic / duration ratio to a congestion label."""
    if ratio < 1.15:
        return "low"
    elif ratio < 1.45:
        return "moderate"
    elif ratio < 1.75:
        return "high"
    else:
        return "very_high"


def _congestion_color(label: str) -> str:
    return {
        "low": "green",
        "moderate": "yellow",
        "high": "orange",
        "very_high": "red",
    }.get(label, "gray")


@router.get("/traffic")
async def get_traffic(
    origin: str = Query(..., description="Origin city/location"),
    destination: str = Query(..., description="Destination city/location"),
) -> dict[str, Any]:
    """
    Returns live traffic info between origin and destination.
    Uses Google Maps Distance Matrix API with departure_time=now.
    """

    if not GMAPS_KEY:
        return _mock_traffic(origin, destination)

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin}, India",
        "destinations": f"{destination}, India",
        "departure_time": "now",
        "traffic_model": "best_guess",
        "units": "metric",
        "key": GMAPS_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        if data.get("status") != "OK":
            return _mock_traffic(origin, destination, error=data.get("status"))

        row = data["rows"][0]["elements"][0]
        if row.get("status") != "OK":
            return _mock_traffic(origin, destination, error=row.get("status"))

        normal_secs = row["duration"]["value"]
        traffic_secs = row.get("duration_in_traffic", {}).get("value", normal_secs)
        distance_m = row["distance"]["value"]

        ratio = traffic_secs / normal_secs if normal_secs else 1.0
        congestion = _congestion_label(ratio)
        delay_min = max(0, round((traffic_secs - normal_secs) / 60))

        return {
            "source": "google_maps",
            "origin": origin,
            "destination": destination,
            "distance_km": round(distance_m / 1000, 1),
            "normal_duration": row["duration"]["text"],
            "traffic_duration": row.get("duration_in_traffic", {}).get("text", row["duration"]["text"]),
            "delay_minutes": delay_min,
            "congestion_level": congestion,
            "congestion_color": _congestion_color(congestion),
            "ratio": round(ratio, 2),
            "fetched_at": time.strftime("%H:%M:%S"),
        }

    except Exception as exc:
        return _mock_traffic(origin, destination, error=str(exc))


def _mock_traffic(origin: str, destination: str, error: str | None = None) -> dict[str, Any]:
    """Fallback mock when API is unavailable."""
    import hashlib

    seed = int(hashlib.md5(f"{origin}{destination}".encode()).hexdigest()[:8], 16)
    delay = (seed % 45)  # 0–44 minutes
    km = 300 + (seed % 1200)  # 300–1500 km
    normal_h = round(km / 60, 1)

    levels = ["low", "moderate", "high"]
    congestion = levels[delay % 3]

    return {
        "source": "mock",
        "origin": origin,
        "destination": destination,
        "distance_km": km,
        "normal_duration": f"{int(normal_h)}h {int((normal_h % 1) * 60)}m",
        "traffic_duration": f"{int(normal_h) + delay // 60}h {(int((normal_h % 1) * 60) + delay) % 60}m",
        "delay_minutes": delay,
        "congestion_level": congestion,
        "congestion_color": _congestion_color(congestion),
        "ratio": round(1 + delay / 120, 2),
        "fetched_at": time.strftime("%H:%M:%S"),
        "error": error,
    }
