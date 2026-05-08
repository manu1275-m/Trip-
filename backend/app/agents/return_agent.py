from __future__ import annotations

from datetime import timedelta

from app.models.schemas import ReturnJourneyPlan, TransportOption, TripInitRequest
from app.services.availability_service import intercity_transport_options


class ReturnJourneyAgent:
    name = "Return Journey Agent"

    async def plan(
        self,
        request: TripInitRequest,
        traveler_count: int,
        source_outside_india: bool,
        traffic_delay: int,
    ) -> ReturnJourneyPlan:
        return_date = request.travel_date + timedelta(days=request.number_of_days)
        options = await intercity_transport_options(
            request.destination,
            request.current_location,
            return_date,
            traveler_count,
            source_outside_india,
        )
        recommended: TransportOption = options[0]
        buffer_minutes = max(60, 45 + traffic_delay)
        return ReturnJourneyPlan(
            checkout_time="11:00 AM",
            leave_for_terminal_time="02:30 PM",
            terminal_eta="03:30 PM",
            traffic_buffer_minutes=buffer_minutes,
            recommended_transport=recommended,
            alternates=options[1:],
        )

