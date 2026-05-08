from __future__ import annotations

from typing import Any

from app.database.repository import repo
from app.models.schemas import BookingInitiationRequest, BookingInitiationResponse


async def initiate_booking(email: str, request: BookingInitiationRequest) -> BookingInitiationResponse:
    trip = await repo.get_trip(email, request.trip_id)
    if not trip:
        redirect_url = "https://www.google.com/travel/"
        payload: dict[str, Any] = {"reason": "Trip was not found; manual booking review required."}
        status = "manual_review"
    else:
        redirect_url = "https://www.google.com/travel/"
        collections = {
            "stay": "stays",
            "transport": "intercity_transport",
            "return_transport": "return_journey",
            "mobility": "local_mobility",
        }
        selected: Any = None
        if request.booking_type == "return_transport":
            selected = trip.get("return_journey", {}).get("recommended_transport")
        else:
            options = trip.get(collections.get(request.booking_type, ""), [])
            selected = next((item for item in options if item.get("provider") == request.provider or item.get("name") == request.provider), None)
        if selected:
            redirect_url = selected.get("booking_url", redirect_url)
            status = "ready_for_payment"
            payload = {"selected": selected, "traveler_count": len(trip.get("travelers", []))}
        else:
            status = "partner_required"
            payload = {"reason": "Provider option was not found in the saved trip snapshot."}

    booking = await repo.save_booking(
        email,
        {
            "trip_id": request.trip_id,
            "booking_type": request.booking_type,
            "provider": request.provider,
            "status": status,
            "redirect_url": redirect_url,
            "payload": payload,
        },
    )
    return BookingInitiationResponse(
        booking_id=booking["id"],
        status=status,  # type: ignore[arg-type]
        redirect_url=redirect_url,
        payload=payload,
    )

