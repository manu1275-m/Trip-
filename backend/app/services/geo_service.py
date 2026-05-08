from __future__ import annotations

from datetime import date
from math import asin, cos, radians, sin, sqrt
from typing import Any
from urllib.parse import quote_plus

import httpx

from app.core.config import settings


INDIA_HINTS = {
    "agra",
    "ahmedabad",
    "amritsar",
    "andaman",
    "bangalore",
    "bengaluru",
    "bhopal",
    "bhubaneswar",
    "chandigarh",
    "chennai",
    "coimbatore",
    "coorg",
    "delhi",
    "gangtok",
    "goa",
    "gurugram",
    "guwahati",
    "hyderabad",
    "jaipur",
    "jodhpur",
    "kochi",
    "kolkata",
    "leh",
    "lucknow",
    "madurai",
    "manali",
    "mangalore",
    "mumbai",
    "mysore",
    "ooty",
    "pune",
    "rishikesh",
    "shimla",
    "srinagar",
    "udaipur",
    "varanasi",
    "visakhapatnam",
}

FOREIGN_HINTS = {
    "bali",
    "bangkok",
    "dubai",
    "london",
    "maldives",
    "new york",
    "paris",
    "singapore",
    "sri lanka",
    "thailand",
    "tokyo",
}

CURATED_COORDS: dict[str, tuple[float, float]] = {
    "bangalore": (12.9716, 77.5946),
    "bengaluru": (12.9716, 77.5946),
    "mysore": (12.2958, 76.6394),
    "coorg": (12.3375, 75.8069),
    "delhi": (28.6139, 77.2090),
    "mumbai": (19.0760, 72.8777),
    "goa": (15.2993, 74.1240),
    "jaipur": (26.9124, 75.7873),
    "kochi": (9.9312, 76.2673),
    "hyderabad": (17.3850, 78.4867),
    "chennai": (13.0827, 80.2707),
    "kolkata": (22.5726, 88.3639),
    "pune": (18.5204, 73.8567),
    "varanasi": (25.3176, 82.9739),
    "udaipur": (24.5854, 73.7125),
    "rishikesh": (30.0869, 78.2676),
    "manali": (32.2432, 77.1892),
    "shimla": (31.1048, 77.1734),
}

CURATED_ATTRACTIONS: dict[str, list[dict[str, Any]]] = {
    "bangalore": [
        {"name": "Lalbagh Botanical Garden", "category": "nature", "lat": 12.9507, "lon": 77.5848},
        {"name": "Bangalore Palace", "category": "heritage", "lat": 12.9985, "lon": 77.5920},
        {"name": "Cubbon Park", "category": "nature", "lat": 12.9763, "lon": 77.5929},
        {"name": "Visvesvaraya Industrial and Technological Museum", "category": "museum", "lat": 12.9752, "lon": 77.5963},
        {"name": "ISKCON Temple Bengaluru", "category": "spiritual", "lat": 13.0098, "lon": 77.5511},
    ],
    "mysore": [
        {"name": "Mysore Palace", "category": "heritage", "lat": 12.3052, "lon": 76.6552},
        {"name": "Chamundi Hills", "category": "spiritual", "lat": 12.2726, "lon": 76.6702},
        {"name": "St Philomena's Cathedral", "category": "heritage", "lat": 12.3211, "lon": 76.6583},
        {"name": "Brindavan Gardens", "category": "garden", "lat": 12.4217, "lon": 76.5728},
    ],
    "coorg": [
        {"name": "Abbey Falls", "category": "nature", "lat": 12.4587, "lon": 75.7228},
        {"name": "Raja's Seat", "category": "viewpoint", "lat": 12.4244, "lon": 75.7382},
        {"name": "Dubare Elephant Camp", "category": "nature", "lat": 12.3703, "lon": 75.8980},
        {"name": "Namdroling Monastery", "category": "spiritual", "lat": 12.4304, "lon": 75.9655},
    ],
    "delhi": [
        {"name": "Qutub Minar", "category": "heritage", "lat": 28.5245, "lon": 77.1855},
        {"name": "India Gate", "category": "landmark", "lat": 28.6129, "lon": 77.2295},
        {"name": "Red Fort", "category": "heritage", "lat": 28.6562, "lon": 77.2410},
        {"name": "Humayun's Tomb", "category": "heritage", "lat": 28.5933, "lon": 77.2507},
    ],
    "mumbai": [
        {"name": "Gateway of India", "category": "landmark", "lat": 18.9220, "lon": 72.8347},
        {"name": "Chhatrapati Shivaji Maharaj Terminus", "category": "heritage", "lat": 18.9402, "lon": 72.8356},
        {"name": "Marine Drive", "category": "promenade", "lat": 18.9432, "lon": 72.8230},
        {"name": "Elephanta Caves", "category": "heritage", "lat": 18.9633, "lon": 72.9315},
    ],
    "goa": [
        {"name": "Basilica of Bom Jesus", "category": "heritage", "lat": 15.5009, "lon": 73.9116},
        {"name": "Fort Aguada", "category": "heritage", "lat": 15.4920, "lon": 73.7732},
        {"name": "Baga Beach", "category": "beach", "lat": 15.5553, "lon": 73.7517},
        {"name": "Fontainhas", "category": "culture", "lat": 15.4945, "lon": 73.8282},
    ],
    "jaipur": [
        {"name": "Amber Fort", "category": "heritage", "lat": 26.9855, "lon": 75.8513},
        {"name": "City Palace Jaipur", "category": "heritage", "lat": 26.9258, "lon": 75.8237},
        {"name": "Hawa Mahal", "category": "landmark", "lat": 26.9239, "lon": 75.8267},
        {"name": "Jantar Mantar Jaipur", "category": "heritage", "lat": 26.9248, "lon": 75.8246},
    ],
    "kochi": [
        {"name": "Fort Kochi", "category": "culture", "lat": 9.9658, "lon": 76.2421},
        {"name": "Chinese Fishing Nets", "category": "landmark", "lat": 9.9686, "lon": 76.2430},
        {"name": "Mattancherry Palace", "category": "heritage", "lat": 9.9575, "lon": 76.2595},
        {"name": "Jew Town", "category": "culture", "lat": 9.9570, "lon": 76.2590},
    ],
    "manali": [
        {"name": "Hadimba Devi Temple", "category": "spiritual", "lat": 32.2480, "lon": 77.1806},
        {"name": "Manu Temple", "category": "spiritual", "lat": 32.2576, "lon": 77.1734},
        {"name": "Vashisht Hot Water Springs", "category": "wellness", "lat": 32.2638, "lon": 77.1887},
        {"name": "Old Manali", "category": "culture", "lat": 32.2539, "lon": 77.1756},
        {"name": "Mall Road Manali", "category": "market", "lat": 32.2396, "lon": 77.1887},
        {"name": "Van Vihar National Park", "category": "nature", "lat": 32.2385, "lon": 77.1882},
        {"name": "Museum of Himachal Culture and Folk Art", "category": "museum", "lat": 32.2474, "lon": 77.1810},
        {"name": "Jogini Falls", "category": "nature", "lat": 32.2791, "lon": 77.1822},
        {"name": "Solang Valley", "category": "adventure", "lat": 32.3160, "lon": 77.1579},
    ],
    "shimla": [
        {"name": "The Ridge Shimla", "category": "landmark", "lat": 31.1044, "lon": 77.1734},
        {"name": "Jakhu Temple", "category": "spiritual", "lat": 31.1008, "lon": 77.1838},
        {"name": "Christ Church Shimla", "category": "heritage", "lat": 31.1048, "lon": 77.1739},
        {"name": "Viceregal Lodge", "category": "heritage", "lat": 31.0986, "lon": 77.1419},
        {"name": "Mall Road Shimla", "category": "market", "lat": 31.1042, "lon": 77.1709},
    ],
}


def canonical_city(value: str) -> str:
    lowered = value.strip().lower()
    for hint in CURATED_COORDS:
        if hint in lowered:
            return hint
    return lowered.split(",")[0].strip()


def map_url(place: str) -> str:
    return f"https://www.openstreetmap.org/search?query={quote_plus(place)}"


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    radius = 6371.0
    d_lat = radians(b_lat - a_lat)
    d_lon = radians(b_lon - a_lon)
    lat_1 = radians(a_lat)
    lat_2 = radians(b_lat)
    value = sin(d_lat / 2) ** 2 + cos(lat_1) * cos(lat_2) * sin(d_lon / 2) ** 2
    return 2 * radius * asin(sqrt(value))


async def geocode(query: str) -> dict[str, Any] | None:
    city = canonical_city(query)
    if city in CURATED_COORDS:
        lat, lon = CURATED_COORDS[city]
        return {
            "display_name": f"{query}, India",
            "lat": lat,
            "lon": lon,
            "country_code": "in",
            "source": "curated",
        }

    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "addressdetails": 1, "limit": 1},
                headers={"User-Agent": settings.osm_user_agent},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        payload = []

    if not payload:
        return None

    result = payload[0]
    address = result.get("address", {})
    return {
        "display_name": result.get("display_name", query),
        "lat": float(result["lat"]),
        "lon": float(result["lon"]),
        "country_code": (address.get("country_code") or "").lower(),
        "source": "osm",
    }


async def validate_indian_destination(destination: str) -> dict[str, Any]:
    geocoded = await geocode(destination)
    if geocoded and geocoded.get("country_code") == "in":
        return {
            "valid": True,
            "message": "Destination is inside India.",
            "location": geocoded,
            "source": geocoded["source"],
        }

    lowered = destination.strip().lower()
    if any(hint in lowered for hint in FOREIGN_HINTS):
        return {
            "valid": False,
            "message": "Currently this travel assistant supports destinations within India only.",
            "location": geocoded,
            "source": "fallback_guardrail",
        }

    if geocoded and geocoded.get("country_code") and geocoded.get("country_code") != "in":
        return {
            "valid": False,
            "message": "Currently this travel assistant supports destinations within India only.",
            "location": geocoded,
            "source": "osm",
        }

    if any(hint in lowered for hint in INDIA_HINTS):
        city = canonical_city(destination)
        lat, lon = CURATED_COORDS.get(city, (20.5937, 78.9629))
        return {
            "valid": True,
            "message": "Destination accepted using the India fallback validator.",
            "location": {
                "display_name": f"{destination}, India",
                "lat": lat,
                "lon": lon,
                "country_code": "in",
                "source": "fallback",
            },
            "source": "fallback",
        }

    return {
        "valid": True,
        "message": "Destination could not be live-verified, so it is accepted pending booking checks.",
        "location": {
            "display_name": f"{destination}, India",
            "lat": 20.5937,
            "lon": 78.9629,
            "country_code": "in",
            "source": "fallback_pending",
        },
        "source": "fallback_pending",
    }


async def is_location_outside_india(location: str) -> bool:
    lowered = location.strip().lower()
    if any(hint in lowered for hint in FOREIGN_HINTS):
        return True
    geocoded = await geocode(location)
    if geocoded and geocoded.get("country_code"):
        return geocoded["country_code"] != "in"
    return False


async def attractions_for(destination: str, days: int) -> list[dict[str, Any]]:
    city = canonical_city(destination)
    curated = CURATED_ATTRACTIONS.get(city)
    if curated:
        return curated

    geocoded = await geocode(destination)
    if geocoded:
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                response = await client.get(
                    "https://overpass-api.de/api/interpreter",
                    params={
                        "data": f"""
                        [out:json][timeout:10];
                        (
                          node(around:12000,{geocoded["lat"]},{geocoded["lon"]})["tourism"];
                          node(around:12000,{geocoded["lat"]},{geocoded["lon"]})["historic"];
                          node(around:12000,{geocoded["lat"]},{geocoded["lon"]})["leisure"~"park|garden"];
                          node(around:12000,{geocoded["lat"]},{geocoded["lon"]})["amenity"~"place_of_worship|museum"];
                        );
                        out center tags {min(20, max(days * 5, 10))};
                        """
                    },
                    headers={"User-Agent": settings.osm_user_agent},
                )
                response.raise_for_status()
                elements = response.json().get("elements", [])
        except Exception:
            elements = []

        places = []
        seen = set()
        for item in elements:
            tags = item.get("tags", {})
            name = tags.get("name")
            if not name or name.lower() in seen:
                continue
            seen.add(name.lower())
            category = tags.get("tourism") or tags.get("historic") or tags.get("leisure") or tags.get("amenity") or "attraction"
            places.append(
                {
                    "name": name,
                    "category": category,
                    "lat": float(item.get("lat") or item.get("center", {}).get("lat")),
                    "lon": float(item.get("lon") or item.get("center", {}).get("lon")),
                }
            )

        if places:
            return places

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": f"tourist attractions in {destination}, India",
                    "format": "json",
                    "limit": min(12, max(days * 3, 5)),
                },
                headers={"User-Agent": settings.osm_user_agent},
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        payload = []

    places = []
    for item in payload:
        places.append(
            {
                "name": item.get("display_name", destination).split(",")[0],
                "category": item.get("type", "attraction"),
                "lat": float(item["lat"]),
                "lon": float(item["lon"]),
            }
        )

    if places:
        return places

    return [
        {"name": f"{destination} Heritage Walk", "category": "culture", "lat": None, "lon": None},
        {"name": f"{destination} Local Market", "category": "food", "lat": None, "lon": None},
        {"name": f"{destination} Museum District", "category": "museum", "lat": None, "lon": None},
        {"name": f"{destination} Viewpoint", "category": "nature", "lat": None, "lon": None},
        {"name": f"{destination} Evening Promenade", "category": "leisure", "lat": None, "lon": None},
    ]


async def route_between(origin: dict[str, Any] | None, destination: dict[str, Any] | None) -> dict[str, Any]:
    if not origin or not destination:
        return {"distance_km": 0, "duration_minutes": 30, "source": "fallback"}

    a_lat, a_lon = origin.get("lat"), origin.get("lon")
    b_lat, b_lon = destination.get("lat"), destination.get("lon")
    if a_lat is None or a_lon is None or b_lat is None or b_lon is None:
        return {"distance_km": 0, "duration_minutes": 30, "source": "fallback"}

    if settings.openrouteservice_api_key and "garbage" not in settings.openrouteservice_api_key.lower():
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    "https://api.openrouteservice.org/v2/directions/driving-car",
                    headers={"Authorization": settings.openrouteservice_api_key},
                    json={"coordinates": [[a_lon, a_lat], [b_lon, b_lat]]},
                )
                response.raise_for_status()
                summary = response.json()["routes"][0]["summary"]
                return {
                    "distance_km": round(summary["distance"] / 1000, 1),
                    "duration_minutes": int(summary["duration"] / 60),
                    "source": "openrouteservice",
                }
        except Exception:
            pass

    distance = haversine_km(float(a_lat), float(a_lon), float(b_lat), float(b_lon))
    return {
        "distance_km": round(distance, 1),
        "duration_minutes": max(20, int(distance / 28 * 60)),
        "source": "haversine_fallback",
    }


def travel_month_label(travel_date: date) -> str:
    return travel_date.strftime("%B")
