from __future__ import annotations

from app.models.schemas import MobilityOption
from app.services.availability_service import local_mobility_options


class MobilityAgent:
    name = "Mobility Agent"

    def recommend(
        self,
        pickup: str,
        dropoff: str,
        traveler_count: int,
        raining: bool,
        traffic_delay: int,
    ) -> list[MobilityOption]:
        return local_mobility_options(pickup, dropoff, traveler_count, raining, traffic_delay)

