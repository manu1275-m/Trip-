from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.agents.mobility_agent import MobilityAgent
from app.agents.monitoring_agent import MonitoringAgent
from app.agents.planner_agent import PlannerAgent
from app.agents.return_agent import ReturnJourneyAgent
from app.agents.safety_agent import SafetyAgent
from app.agents.state import TravelGraphState
from app.agents.stay_agent import StayAgent
from app.agents.transport_agent import TransportAgent
from app.database.repository import repo
from app.models.schemas import TripInitRequest, TripPlanResponse
from app.services.geo_service import validate_indian_destination


class TravelOrchestrator:
    def __init__(self) -> None:
        self.monitoring_agent = MonitoringAgent()
        self.planner_agent = PlannerAgent()
        self.stay_agent = StayAgent()
        self.transport_agent = TransportAgent()
        self.mobility_agent = MobilityAgent()
        self.safety_agent = SafetyAgent()
        self.return_agent = ReturnJourneyAgent()
        self.graph = self._compile_langgraph()

    def _compile_langgraph(self) -> Any | None:
        try:
            from langgraph.graph import END, StateGraph
        except Exception:
            return None

        workflow = StateGraph(TravelGraphState)
        workflow.add_node("destination_validation", self._destination_validation)
        workflow.add_node("source_classification", self._source_classification)
        workflow.add_node("monitoring", self._monitoring)
        workflow.add_node("planner", self._planner)
        workflow.add_node("stay", self._stay)
        workflow.add_node("transport", self._transport)
        workflow.add_node("mobility", self._mobility)
        workflow.add_node("safety", self._safety)
        workflow.add_node("return_journey", self._return_journey)
        workflow.add_node("booking_readiness", self._booking_readiness)

        workflow.set_entry_point("destination_validation")
        workflow.add_edge("destination_validation", "source_classification")
        workflow.add_edge("source_classification", "monitoring")
        workflow.add_edge("monitoring", "planner")
        workflow.add_edge("planner", "stay")
        workflow.add_edge("stay", "transport")
        workflow.add_edge("transport", "mobility")
        workflow.add_edge("mobility", "safety")
        workflow.add_edge("safety", "return_journey")
        workflow.add_edge("return_journey", "booking_readiness")
        workflow.add_edge("booking_readiness", END)
        return workflow.compile()

    async def _destination_validation(self, state: TravelGraphState) -> TravelGraphState:
        request = state["request"]
        validation = await validate_indian_destination(request.destination)
        if not validation["valid"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=validation["message"])
        return {"destination_validation": validation}

    async def _source_classification(self, state: TravelGraphState) -> TravelGraphState:
        request = state["request"]
        return {"source_outside_india": await self.transport_agent.source_outside_india(request.current_location)}

    async def _monitoring(self, state: TravelGraphState) -> TravelGraphState:
        request = state["request"]
        return {"monitoring": await self.monitoring_agent.snapshot(request.destination, request.travel_date)}

    async def _planner(self, state: TravelGraphState) -> TravelGraphState:
        request = state["request"]
        monitoring = state["monitoring"]
        itinerary = await self.planner_agent.generate(
            request,
            traffic_delay_minutes=monitoring.traffic.get("delay_minutes", 10),
            weather_replan=monitoring.replan_required,
        )
        return {"itinerary": itinerary}

    async def _stay(self, state: TravelGraphState) -> TravelGraphState:
        return {"stays": await self.stay_agent.recommend(state["request"], state["traveler_count"])}

    async def _transport(self, state: TravelGraphState) -> TravelGraphState:
        return {
            "intercity_transport": await self.transport_agent.recommend(
                state["request"],
                state["traveler_count"],
                state["source_outside_india"],
            )
        }

    async def _mobility(self, state: TravelGraphState) -> TravelGraphState:
        request = state["request"]
        monitoring = state["monitoring"]
        first_drop = request.destination
        if state.get("itinerary") and state["itinerary"][0].places:
            first_drop = state["itinerary"][0].places[0].name
        return {
            "local_mobility": self.mobility_agent.recommend(
                pickup=f"Recommended stay in {request.destination}",
                dropoff=first_drop,
                traveler_count=state["traveler_count"],
                raining=monitoring.weather.get("rain_probability", 0) >= 0.55,
                traffic_delay=monitoring.traffic.get("delay_minutes", 10),
            )
        }

    async def _safety(self, state: TravelGraphState) -> TravelGraphState:
        return {
            "safety": await self.safety_agent.safety_pack(
                state["user_email"],
                state["request"].destination,
                state["monitoring"].safety_alerts,
            )
        }

    async def _return_journey(self, state: TravelGraphState) -> TravelGraphState:
        return {
            "return_journey": await self.return_agent.plan(
                state["request"],
                state["traveler_count"],
                state["source_outside_india"],
                state["monitoring"].traffic.get("delay_minutes", 10),
            )
        }

    async def _booking_readiness(self, state: TravelGraphState) -> TravelGraphState:
        stays = state.get("stays", [])
        transport = state.get("intercity_transport", [])
        blocked = []
        if not any(item.availability.available for item in stays):
            blocked.append("No stay option is currently estimated as available.")
        if not any(item.availability.available for item in transport):
            blocked.append("No intercity transport option is currently estimated as available.")
        return {
            "booking_readiness": {
                "ready": not blocked,
                "blocked_reasons": blocked,
                "mode": "semi_automated_redirect",
                "note": "Traveler data is prepared by the backend; payment is completed on the provider page.",
            }
        }

    async def _run_sequential(self, state: TravelGraphState) -> TravelGraphState:
        for node in [
            self._destination_validation,
            self._source_classification,
            self._monitoring,
            self._planner,
            self._stay,
            self._transport,
            self._mobility,
            self._safety,
            self._return_journey,
            self._booking_readiness,
        ]:
            update = await node(state)
            state.update(update)
        return state

    async def plan_trip(self, user_email: str, request: TripInitRequest) -> TripPlanResponse:
        saved_travelers = await repo.get_travelers_by_ids(user_email, request.saved_traveler_ids)
        traveler_count = max(1, len(request.travelers) + len(saved_travelers))
        state: TravelGraphState = {
            "user_email": user_email,
            "request": request,
            "traveler_count": traveler_count,
        }
        if self.graph is not None:
            result = await self.graph.ainvoke(state)
        else:
            result = await self._run_sequential(state)

        response = TripPlanResponse(
            trip_id=f"trip_{uuid4().hex[:18]}",
            user_email=user_email,
            destination_validation=result["destination_validation"],
            itinerary=result["itinerary"],
            stays=result["stays"],
            intercity_transport=result["intercity_transport"],
            local_mobility=result["local_mobility"],
            monitoring=result["monitoring"],
            safety=result["safety"],
            return_journey=result["return_journey"],
            booking_readiness=result["booking_readiness"],
            created_at=datetime.now(timezone.utc),
        )
        trip_doc = response.model_dump(mode="json")
        trip_doc["traveler_count"] = traveler_count
        await repo.save_trip(user_email, trip_doc)
        return response


orchestrator = TravelOrchestrator()

