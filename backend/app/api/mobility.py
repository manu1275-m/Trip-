from __future__ import annotations

from fastapi import APIRouter, Depends

from app.agents.mobility_agent import MobilityAgent
from app.core.security import get_current_user_email
from app.models.schemas import MobilityOption, MobilityRequest


router = APIRouter(prefix="/mobility", tags=["mobility"])
agent = MobilityAgent()


@router.post("/options", response_model=list[MobilityOption])
async def mobility_options(
    payload: MobilityRequest,
    _: str = Depends(get_current_user_email),
) -> list[MobilityOption]:
    return agent.recommend(
        payload.pickup,
        payload.dropoff,
        payload.travelers_count,
        payload.raining,
        traffic_delay=12,
    )

