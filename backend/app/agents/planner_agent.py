from __future__ import annotations

from datetime import timedelta
from math import ceil

from app.agents.scheduler_agent import SchedulerAgent
from app.models.schemas import DayPlan, Place, TripInitRequest
from app.services.geo_service import attractions_for, canonical_city, map_url


class PlannerAgent:
    name = "Planner Agent"

    def __init__(self) -> None:
        self.scheduler = SchedulerAgent()

    def _route_zones(self, source: str, destination: str, days: int) -> list[str]:
        src = canonical_city(source)
        dst = canonical_city(destination)
        if days >= 3 and "bangalore" in src and "coorg" in dst:
            return ["Bangalore", "Mysore", "Coorg"][:days]
        if days >= 3 and "bengaluru" in src and "coorg" in dst:
            return ["Bangalore", "Mysore", "Coorg"][:days]
        if days >= 3 and "delhi" in src and "jaipur" in dst:
            return ["Delhi", "Agra", "Jaipur"][:days]
        return [destination for _ in range(days)]

    def _place_from_raw(self, raw: dict, zone: str, weather_replan: bool) -> Place:
        name = raw["name"]
        category = raw.get("category", "attraction")
        indoor_categories = {"museum", "heritage", "spiritual", "culture"}
        note = (
            "Prioritized for weather resilience."
            if weather_replan and category in indoor_categories
            else "Grouped with nearby stops to avoid unnecessary backtracking."
        )
        return Place(
            name=name,
            category=category,
            address=f"{zone}, India",
            latitude=raw.get("lat"),
            longitude=raw.get("lon"),
            map_url=map_url(f"{name}, {zone}, India"),
            estimated_visit_minutes=105,
            notes=note,
        )

    async def generate(
        self,
        request: TripInitRequest,
        traffic_delay_minutes: int,
        weather_replan: bool,
    ) -> list[DayPlan]:
        zones = self._route_zones(request.current_location, request.destination, request.number_of_days)
        days: list[DayPlan] = []
        place_cache: dict[str, list[dict]] = {}
        used_by_zone: dict[str, int] = {}
        for day_index in range(request.number_of_days):
            zone = zones[day_index] if day_index < len(zones) else request.destination
            if zone not in place_cache:
                place_cache[zone] = await attractions_for(zone, request.number_of_days)

            raw_places = place_cache[zone]
            if weather_replan:
                raw_places.sort(key=lambda item: item.get("category") not in {"museum", "heritage", "spiritual", "culture"})

            max_places = 2 if request.preferences.pace == "relaxed" else 4 if request.preferences.pace == "packed" else 3
            zone_days_left = sum(1 for next_zone in zones[day_index:] if next_zone == zone)
            used_count = used_by_zone.get(zone, 0)
            remaining_places = raw_places[used_count:]

            if remaining_places:
                chunk_size = max(1, min(max_places, ceil(len(remaining_places) / max(1, zone_days_left))))
                selected = remaining_places[:chunk_size]
                used_by_zone[zone] = used_count + len(selected)
            else:
                start = day_index % len(raw_places)
                selected = raw_places[start : start + max_places] or raw_places[:max_places]

            places = [self._place_from_raw(item, zone, weather_replan) for item in selected]
            day_date = request.travel_date + timedelta(days=day_index)
            days.append(
                self.scheduler.build_day(
                    day_number=day_index + 1,
                    travel_date=day_date,
                    zone=zone,
                    places=places,
                    traffic_delay_minutes=traffic_delay_minutes,
                    pace=request.preferences.pace,
                    weather_replan=weather_replan,
                )
            )
        return days
