from __future__ import annotations

from app.models.schemas import TransportOption, TripInitRequest
from app.services.availability_service import intercity_transport_options
from app.services.geo_service import is_location_outside_india


class TransportAgent:
    name = "Transport Agent"

    async def source_outside_india(self, source: str) -> bool:
        return await is_location_outside_india(source)

    async def recommend(
        self,
        request: TripInitRequest,
        traveler_count: int,
        source_outside_india: bool,
    ) -> list[TransportOption]:
        return await intercity_transport_options(
            request.current_location,
            request.destination,
            request.travel_date,
            traveler_count,
            source_outside_india,
        )

