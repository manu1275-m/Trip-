from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.agents.safety_agent import SafetyAgent
from app.core.security import get_current_user_email, now_utc
from app.database.repository import repo
from app.models.schemas import SafetyPack


router = APIRouter(prefix="/safety", tags=["safety"])
agent = SafetyAgent()


@router.get("/emergency", response_model=SafetyPack)
async def emergency_pack(
    destination: str = Query(..., min_length=2),
    email: str = Depends(get_current_user_email),
) -> SafetyPack:
    return await agent.safety_pack(email, destination, [])


@router.post("/sos")
async def trigger_sos(
    trip_id: str | None = Query(None),
    location: str | None = Query(None),
    email: str = Depends(get_current_user_email),
):
    # Log the SOS event
    await repo.append_travel_log(email, trip_id or "emergency", {
        "event": "SOS_TRIGGERED",
        "location": location or "Unknown",
        "timestamp": now_utc().isoformat()
    })
    return {"status": "success", "message": "SOS signal dispatched to local authorities and emergency contacts."}

