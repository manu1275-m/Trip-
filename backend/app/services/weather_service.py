from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.services.geo_service import geocode, travel_month_label


MONSOON_STATES = {"goa", "kochi", "mumbai", "coorg", "chennai", "kolkata"}


def _fallback_weather(location: str, travel_date: date | None = None) -> dict[str, Any]:
    month = (travel_date or datetime.now(timezone.utc).date()).month
    lowered = location.lower()
    monsoon_risk = month in {6, 7, 8, 9} or any(city in lowered for city in MONSOON_STATES)
    return {
        "condition": "Rain possible" if monsoon_risk else "Clear to partly cloudy",
        "temperature_c": 27 if monsoon_risk else 30,
        "rain_probability": 0.68 if monsoon_risk else 0.22,
        "severe": monsoon_risk and month in {7, 8},
        "source": "seasonal_fallback",
        "summary": f"{travel_month_label(travel_date or datetime.now(timezone.utc).date())} seasonal estimate for {location}.",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


async def weather_context(location: str, travel_date: date | None = None) -> dict[str, Any]:
    point = await geocode(location)
    if not point or not settings.openweather_api_key or "garbage" in settings.openweather_api_key.lower():
        return _fallback_weather(location, travel_date)

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": point["lat"],
                    "lon": point["lon"],
                    "appid": settings.openweather_api_key,
                    "units": "metric",
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return _fallback_weather(location, travel_date)

    weather = payload.get("weather", [{}])[0]
    rain = payload.get("rain", {})
    condition = weather.get("main", "Weather unavailable")
    rain_probability = 0.8 if rain else (0.55 if condition.lower() in {"rain", "thunderstorm"} else 0.2)
    return {
        "condition": condition,
        "temperature_c": round(payload.get("main", {}).get("temp", 0)),
        "rain_probability": rain_probability,
        "severe": condition.lower() in {"thunderstorm", "extreme"},
        "source": "openweathermap",
        "summary": weather.get("description", condition).title(),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }

