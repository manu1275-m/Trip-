from __future__ import annotations

from datetime import date

from app.models.schemas import MonitoringSnapshot
from app.services.traffic_service import traffic_context
from app.services.weather_service import weather_context


class MonitoringAgent:
    name = "Monitoring Agent"

    async def snapshot(self, destination: str, travel_date: date) -> MonitoringSnapshot:
        weather = await weather_context(destination, travel_date)
        traffic = await traffic_context(destination)
        alerts: list[str] = []
        if weather.get("severe"):
            alerts.append("Severe weather risk detected near the destination.")
        elif weather.get("rain_probability", 0) >= 0.6:
            alerts.append("Rain risk is high; prefer indoor attractions and cabs.")
        if traffic.get("congestion_level") == "high":
            alerts.append("High congestion detected; add a larger city-transfer buffer.")

        replan_required = bool(alerts)
        action = (
            "Reorder the itinerary toward indoor places and extend transfer buffers."
            if replan_required
            else "Continue with the generated schedule and monitor again before departure."
        )
        return MonitoringSnapshot(
            weather=weather,
            traffic=traffic,
            safety_alerts=alerts,
            replan_required=replan_required,
            recommended_action=action,
        )

