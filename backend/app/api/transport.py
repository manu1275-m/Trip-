from __future__ import annotations

from fastapi import APIRouter, Depends

from app.agents.transport_agent import TransportAgent
from app.core.security import get_current_user_email
from app.models.schemas import TransportOption, TripInitRequest


router = APIRouter(prefix="/transport", tags=["transport"])
agent = TransportAgent()


@router.post("/recommend", response_model=list[TransportOption])
async def recommend_transport(
    payload: TripInitRequest,
    _: str = Depends(get_current_user_email),
) -> list[TransportOption]:
    source_outside_india = await agent.source_outside_india(payload.current_location)
    traveler_count = max(1, len(payload.travelers) + len(payload.saved_traveler_ids))
    return await agent.recommend(payload, traveler_count, source_outside_india)

