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
    api_key = settings.openweather_api_key or ""
    
    # Check if the user provided a Groq key instead of OpenWeather
    if api_key.startswith("gsk_"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                month = travel_month_label(travel_date or datetime.now(timezone.utc).date())
                prompt = f"Generate a highly realistic JSON weather forecast for {location} in {month}. Return strictly JSON with exactly these keys: 'condition' (string, e.g. 'Scattered Showers'), 'temperature_c' (integer), 'rain_probability' (float 0.0 to 1.0), 'severe' (boolean). No markdown, no other text."
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": "llama3-8b-8192",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "response_format": {"type": "json_object"}
                    }
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                import json
                data = json.loads(content)
                return {
                    "condition": data.get("condition", "Clear"),
                    "temperature_c": data.get("temperature_c", 28),
                    "rain_probability": data.get("rain_probability", 0.0),
                    "severe": data.get("severe", False),
                    "source": "groq_ai_agent",
                    "summary": f"AI estimated weather for {location}",
                    "checked_at": datetime.now(timezone.utc).isoformat(),
                }
        except Exception as e:
            print("Groq Weather Gen Error:", e)
            return _fallback_weather(location, travel_date)

    point = await geocode(location)
    if not point or not api_key or "garbage" in api_key.lower():
        return _fallback_weather(location, travel_date)

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/weather",
                params={
                    "lat": point["lat"],
                    "lon": point["lon"],
                    "appid": api_key,
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

