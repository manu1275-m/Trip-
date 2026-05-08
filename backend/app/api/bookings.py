from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import get_current_user_email
from app.models.schemas import BookingInitiationRequest, BookingInitiationResponse
from app.services.booking_service import initiate_booking


router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/initiate", response_model=BookingInitiationResponse)
async def create_booking(
    payload: BookingInitiationRequest,
    email: str = Depends(get_current_user_email),
) -> BookingInitiationResponse:
    return await initiate_booking(email, payload)

