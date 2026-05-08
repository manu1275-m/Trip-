from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any
from urllib.parse import quote_plus

from app.models.schemas import (
    AvailabilityStatus,
    MobilityOption,
    StayRecommendation,
    TransportOption,
)
from app.services.geo_service import geocode, route_between


def _availability(seed_text: str, group_size: int, travel_date: date) -> AvailabilityStatus:
    seed = sum(ord(char) for char in f"{seed_text}{group_size}{travel_date.isoformat()}")
    available = seed % 7 != 0 and group_size <= 8
    return AvailabilityStatus(
        available=available,
        confidence="estimated",
        message=(
            "Estimated inventory is available; final confirmation happens on the provider payment page."
            if available
            else "Estimated inventory is tight; keep this as an alternate and recheck provider inventory."
        ),
        last_checked_at=datetime.now(timezone.utc),
    )


def _time_add(base: time, minutes: int) -> str:
    today = datetime.combine(date.today(), base)
    return (today + timedelta(minutes=minutes)).strftime("%I:%M %p")


def _booking_url(mode: str, source: str, destination: str, travel_date: date) -> str:
    src = quote_plus(source)
    dst = quote_plus(destination)
    day = travel_date.isoformat()
    if mode == "train":
        return "https://www.irctc.co.in/nget/train-search"
    if mode == "bus":
        return f"https://www.redbus.in/search?fromCityName={src}&toCityName={dst}&onward={day}"
    if mode == "flight":
        return f"https://www.google.com/travel/flights?q=Flights%20from%20{src}%20to%20{dst}%20on%20{day}"
    return f"https://www.google.com/search?q={quote_plus(mode + ' booking ' + source + ' to ' + destination)}"


async def stay_recommendations(destination: str, travel_date: date, days: int, group_size: int) -> list[StayRecommendation]:
    base_price = 1900 + group_size * 450
    zones = [
        ("Transit-friendly Central Zone", "close to major sightseeing clusters"),
        ("Quiet Heritage Zone", "near cultural places and evening walks"),
        ("Station or Airport Access Zone", "best for early return departures"),
    ]
    names = ["Aster Residency", "Saffron Court", "Indigo Stay Hub"]
    stays = []
    for index, ((zone, distance_note), name) in enumerate(zip(zones, names)):
        stays.append(
            StayRecommendation(
                name=f"{name} {destination}",
                zone=zone,
                address=f"{zone}, {destination}, India",
                estimated_price_per_night=base_price + index * 850,
                group_size_supported=max(group_size, 2 + index * 2),
                availability=_availability(name + destination, group_size, travel_date),
                booking_url=f"https://www.google.com/travel/hotels/{quote_plus(destination)}",
                distance_note=distance_note,
            )
        )
    return stays


async def intercity_transport_options(
    source: str,
    destination: str,
    travel_date: date,
    group_size: int,
    source_outside_india: bool,
) -> list[TransportOption]:
    source_point = await geocode(source)
    destination_point = await geocode(destination)
    route = await route_between(source_point, destination_point)
    distance = max(route.get("distance_km", 250), 80)

    if source_outside_india:
        duration = max(120, int(distance / 700 * 60) + 120)
        return [
            TransportOption(
                mode="flight",
                provider="International flight partner",
                departure_time="09:30 AM",
                arrival_time=_time_add(time(9, 30), duration),
                duration_minutes=duration,
                estimated_price=max(6500, int(distance * 8.5)),
                comfort_score=8,
                practicality_score=9,
                availability=_availability("international-flight", group_size, travel_date),
                booking_url=_booking_url("flight", source, destination, travel_date),
                notes="International source detected, so flight is prioritized before Indian domestic logistics.",
            )
        ]

    train_duration = max(90, int(distance / 55 * 60))
    bus_duration = max(100, int(distance / 48 * 60))
    flight_duration = max(80, int(distance / 650 * 60) + 75)
    options = [
        TransportOption(
            mode="train",
            provider="IRCTC",
            departure_time="06:40 AM",
            arrival_time=_time_add(time(6, 40), train_duration),
            duration_minutes=train_duration,
            estimated_price=max(180, int(distance * 1.7)),
            comfort_score=7,
            practicality_score=9 if distance < 650 else 7,
            availability=_availability("train" + source + destination, group_size, travel_date),
            booking_url=_booking_url("train", source, destination, travel_date),
            notes="Best balance of timing, baggage comfort, and city-center arrival for most Indian routes.",
        ),
        TransportOption(
            mode="bus",
            provider="RedBus partner",
            departure_time="10:15 PM",
            arrival_time=_time_add(time(22, 15), bus_duration),
            duration_minutes=bus_duration,
            estimated_price=max(250, int(distance * 1.3)),
            comfort_score=6,
            practicality_score=8 if distance < 500 else 6,
            availability=_availability("bus" + source + destination, group_size, travel_date),
            booking_url=_booking_url("bus", source, destination, travel_date),
            notes="Good fallback when train inventory is tight or overnight travel saves a hotel night.",
        ),
        TransportOption(
            mode="flight",
            provider="Domestic flight partner",
            departure_time="12:20 PM",
            arrival_time=_time_add(time(12, 20), flight_duration),
            duration_minutes=flight_duration,
            estimated_price=max(3200, int(distance * 5.8)),
            comfort_score=8,
            practicality_score=9 if distance > 650 else 6,
            availability=_availability("flight" + source + destination, group_size, travel_date),
            booking_url=_booking_url("flight", source, destination, travel_date),
            notes="Fastest option for long routes; airport transfer time is included in practicality scoring.",
        ),
    ]
    return sorted(options, key=lambda item: (item.practicality_score + item.comfort_score, -item.estimated_price), reverse=True)


def local_mobility_options(pickup: str, dropoff: str, travelers_count: int, raining: bool, traffic_delay: int = 10) -> list[MobilityOption]:
    destination_q = quote_plus(dropoff)
    base = max(80, 45 + traffic_delay * 4)
    options = [
        MobilityOption(
            provider="Uber",
            vehicle_type="xl_cab" if travelers_count > 4 else "cab",
            eta_minutes=8 + traffic_delay // 5,
            estimated_price=base + travelers_count * 45,
            suitability_score=9 if raining else 8,
            booking_url=f"https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]={destination_q}",
            notes="Recommended when weather, luggage, or group size makes two-wheelers impractical.",
        ),
        MobilityOption(
            provider="Ola",
            vehicle_type="cab",
            eta_minutes=10 + traffic_delay // 5,
            estimated_price=base - 10 + travelers_count * 40,
            suitability_score=8 if raining else 7,
            booking_url="https://book.olacabs.com/",
            notes="Cab option with strong availability in most Indian metros and Tier-1 cities.",
        ),
        MobilityOption(
            provider="Namma Yatri",
            vehicle_type="auto",
            eta_minutes=6 + traffic_delay // 6,
            estimated_price=max(60, base - 45),
            suitability_score=6 if raining else 8,
            booking_url="https://nammayatri.in/",
            notes="Efficient for short city hops when roads are not waterlogged.",
        ),
        MobilityOption(
            provider="Rapido",
            vehicle_type="bike",
            eta_minutes=5 + traffic_delay // 8,
            estimated_price=max(45, base - 65),
            suitability_score=2 if raining or travelers_count > 1 else 8,
            booking_url="https://www.rapido.bike/",
            notes="Avoid during rain, with luggage, or when more than one traveler needs the ride.",
        ),
    ]
    return sorted(options, key=lambda item: (item.suitability_score, -item.eta_minutes), reverse=True)

