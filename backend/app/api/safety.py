from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.agents.safety_agent import SafetyAgent
from app.core.security import get_current_user_email
from app.models.schemas import SafetyPack


router = APIRouter(prefix="/safety", tags=["safety"])
agent = SafetyAgent()


@router.get("/emergency", response_model=SafetyPack)
async def emergency_pack(
    destination: str = Query(..., min_length=2),
    email: str = Depends(get_current_user_email),
) -> SafetyPack:
    return await agent.safety_pack(email, destination, [])

