from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agents.monitoring_agent import MonitoringAgent
from app.agents.orchestrator import orchestrator
from app.database.repository import repo
from app.core.security import decode_token, encrypt_sensitive, get_current_user_email
from app.models.schemas import MonitoringSnapshot, ReturnJourneyPlan, TripInitRequest, TripPlanResponse


router = APIRouter(prefix="/trips", tags=["trips"])
monitoring_agent = MonitoringAgent()


def _stored_request(payload: TripInitRequest) -> dict:
    data = payload.model_dump(mode="json")
    for traveler in data.get("travelers", []):
        government_id = traveler.get("government_id") or {}
        if government_id.get("id_number"):
            government_id["id_number"] = encrypt_sensitive(government_id["id_number"])
    return data


@router.post("/plan", response_model=TripPlanResponse)
async def plan_trip(payload: TripInitRequest, email: str = Depends(get_current_user_email)) -> TripPlanResponse:
    response = await orchestrator.plan_trip(email, payload)
    trip = await repo.get_trip(email, response.trip_id)
    if trip is not None:
        trip["request"] = _stored_request(payload)
        await repo.save_trip(email, trip)
    return response


@router.get("/history")
async def trip_history(email: str = Depends(get_current_user_email)) -> list[dict]:
    return await repo.list_trips(email)


@router.get("/{trip_id}")
async def get_trip(trip_id: str, email: str = Depends(get_current_user_email)) -> dict:
    trip = await repo.get_trip(email, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    return trip


@router.post("/{trip_id}/monitor", response_model=MonitoringSnapshot)
async def monitor_trip(trip_id: str, email: str = Depends(get_current_user_email)) -> MonitoringSnapshot:
    trip = await repo.get_trip(email, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    destination = trip.get("request", {}).get("destination") or trip.get("destination_validation", {}).get("location", {}).get("display_name")
    travel_date = trip.get("request", {}).get("travel_date")
    if not destination or not travel_date:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Saved trip is missing monitorable metadata.")
    request = TripInitRequest.model_validate(trip["request"])
    snapshot = await monitoring_agent.snapshot(destination, request.travel_date)
    await repo.append_travel_log(email, trip_id, {"type": "monitoring_snapshot", "snapshot": snapshot.model_dump(mode="json")})
    return snapshot


def _email_from_stream_token(token: str) -> str:
    payload = decode_token(token)
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")
    return str(email)


@router.get("/{trip_id}/live")
async def live_trip_stream(trip_id: str, token: str) -> StreamingResponse:
    email = _email_from_stream_token(token)
    trip = await repo.get_trip(email, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if not trip.get("request"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Saved trip is missing monitorable metadata.")

    request = TripInitRequest.model_validate(trip["request"])

    async def events():
        sequence = 0
        yield f"event: connected\ndata: {json.dumps({'trip_id': trip_id, 'status': 'connected'})}\n\n"
        while True:
            current_trip = await repo.get_trip(email, trip_id)
            if not current_trip:
                yield f"event: error\ndata: {json.dumps({'detail': 'Trip not found.'})}\n\n"
                break

            snapshot = await monitoring_agent.snapshot(request.destination, request.travel_date)
            snapshot_payload = snapshot.model_dump(mode="json")
            current_trip["monitoring"] = snapshot_payload
            await repo.save_trip(email, current_trip)
            await repo.append_travel_log(
                email,
                trip_id,
                {
                    "type": "live_monitoring_snapshot",
                    "sequence": sequence,
                    "snapshot": snapshot_payload,
                },
            )
            yield f"event: monitoring\ndata: {json.dumps({'sequence': sequence, 'snapshot': snapshot_payload})}\n\n"
            sequence += 1
            await asyncio.sleep(12)

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{trip_id}/return-plan", response_model=ReturnJourneyPlan)
async def return_plan(trip_id: str, email: str = Depends(get_current_user_email)) -> ReturnJourneyPlan:
    trip = await repo.get_trip(email, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    return ReturnJourneyPlan.model_validate(trip["return_journey"])
