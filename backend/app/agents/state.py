from __future__ import annotations

from typing import Any, TypedDict

from app.models.schemas import TripInitRequest


class TravelGraphState(TypedDict, total=False):
    user_email: str
    request: TripInitRequest
    traveler_count: int
    source_outside_india: bool
    destination_validation: dict[str, Any]
    monitoring: Any
    itinerary: Any
    stays: Any
    intercity_transport: Any
    local_mobility: Any
    safety: Any
    return_journey: Any
    booking_readiness: dict[str, Any]

