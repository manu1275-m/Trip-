from __future__ import annotations

from datetime import date, datetime, time, timedelta

from app.models.schemas import DayPlan, Place, ScheduleBlock


class SchedulerAgent:
    name = "Scheduler Agent"

    def _minutes_for_place(self, category: str, pace: str) -> int:
        base = 105
        if category in {"museum", "heritage", "spiritual"}:
            base = 120
        if category in {"market", "food", "promenade", "viewpoint"}:
            base = 90
        if pace == "relaxed":
            return base + 25
        if pace == "packed":
            return max(70, base - 20)
        return base

    def _clock(self, value: datetime) -> str:
        return value.strftime("%I:%M %p")

    def build_day(
        self,
        day_number: int,
        travel_date: date,
        zone: str,
        places: list[Place],
        traffic_delay_minutes: int,
        pace: str,
        weather_replan: bool,
    ) -> DayPlan:
        start = datetime.combine(travel_date, time(8, 10)) + timedelta(minutes=min(35, traffic_delay_minutes))
        pointer = start
        schedule: list[ScheduleBlock] = [
            ScheduleBlock(
                start=self._clock(pointer),
                end=self._clock(pointer + timedelta(minutes=35 + traffic_delay_minutes)),
                title="Hotel to first stop",
                type="travel",
                location=zone,
                notes="Traffic buffer included.",
            )
        ]
        pointer += timedelta(minutes=35 + traffic_delay_minutes)

        for index, place in enumerate(places):
            visit_minutes = self._minutes_for_place(place.category, pace)
            place.estimated_visit_minutes = visit_minutes
            schedule.append(
                ScheduleBlock(
                    start=self._clock(pointer),
                    end=self._clock(pointer + timedelta(minutes=visit_minutes)),
                    title=place.name,
                    type="sightseeing",
                    location=place.address or zone,
                    notes=place.notes,
                )
            )
            pointer += timedelta(minutes=visit_minutes)

            if index == 1:
                schedule.append(
                    ScheduleBlock(
                        start=self._clock(pointer),
                        end=self._clock(pointer + timedelta(minutes=55)),
                        title="Lunch buffer",
                        type="meal",
                        location=zone,
                        notes="Placed near the active sightseeing cluster.",
                    )
                )
                pointer += timedelta(minutes=55)

            if index != len(places) - 1:
                hop = 25 + min(25, traffic_delay_minutes)
                schedule.append(
                    ScheduleBlock(
                        start=self._clock(pointer),
                        end=self._clock(pointer + timedelta(minutes=hop)),
                        title="Transfer",
                        type="travel",
                        location=zone,
                        notes="Nearby places are grouped to reduce commute time.",
                    )
                )
                pointer += timedelta(minutes=hop)

        schedule.append(
            ScheduleBlock(
                start=self._clock(pointer),
                end=self._clock(pointer + timedelta(minutes=45 + traffic_delay_minutes)),
                title="Return to stay",
                type="travel",
                location=zone,
                notes="Evening traffic buffer included.",
            )
        )
        end = pointer + timedelta(minutes=45 + traffic_delay_minutes)

        route_summary = f"{len(places)} stops clustered around {zone}; transfer buffers reflect current traffic."
        note = "Weather-aware replanning keeps indoor or covered places earlier in the day." if weather_replan else None
        return DayPlan(
            day=day_number,
            date=travel_date,
            zone=zone,
            departure_time=self._clock(start),
            expected_return_time=self._clock(end),
            route_summary=route_summary,
            places=places,
            schedule=schedule,
            replanning_note=note,
        )

