from __future__ import annotations

from app.models.schemas import StayRecommendation, TripInitRequest
from app.services.availability_service import stay_recommendations


class StayAgent:
    name = "Stay Agent"

    async def recommend(self, request: TripInitRequest, traveler_count: int) -> list[StayRecommendation]:
        return await stay_recommendations(
            request.destination,
            request.travel_date,
            request.number_of_days,
            traveler_count,
        )

