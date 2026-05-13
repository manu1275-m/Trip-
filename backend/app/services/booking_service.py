from __future__ import annotations

from typing import Any

from app.database.repository import repo
from app.models.schemas import BookingInitiationRequest, BookingInitiationResponse


async def initiate_booking(email: str, request: BookingInitiationRequest) -> BookingInitiationResponse:
    if request.provider == "rapidapi":
        import os
        import uuid
        import requests
        from fastapi import HTTPException
        
        from dotenv import load_dotenv
        load_dotenv()
        
        rapid_key = os.getenv("RAPIDAPI_KEY")
        if not rapid_key:
            raise HTTPException(status_code=400, detail="RAPIDAPI_KEY not configured in backend.")
            
        import datetime
        status = "ready_for_payment"
        payload = {}
        
        if request.booking_type == "transport":
            url = "https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights"
            headers = {
                "X-RapidAPI-Key": rapid_key,
                "X-RapidAPI-Host": "sky-scrapper.p.rapidapi.com"
            }
            # Using generic airports (LHR -> JFK) just to prove the real API works, since we don't have dynamic SkyIds
            future_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
            querystring = {"originSkyId":"LHR","destinationSkyId":"JFK","originEntityId":"27544008","destinationEntityId":"27537542","date":future_date,"cabinClass":"economy","adults":"1","sortBy":"best","currency":"USD"}
            try:
                resp = requests.get(url, headers=headers, params=querystring, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                itineraries = data.get("data", {}).get("itineraries", [])
                if itineraries:
                    price = itineraries[0].get("price", {}).get("formatted", "$0")
                    payload = {"live_price_found": price, "message": "Real Sky-Scrapper API call successful!"}
                else:
                    payload = {"message": "Real Sky-Scrapper API call successful, but no flights found."}
            except Exception as e:
                status = "partner_required"
                payload = {"error": f"RapidAPI Error (Sky-Scrapper): {str(e)}", "help": "Ensure you are subscribed to Sky-Scrapper on RapidAPI."}
                
        elif request.booking_type == "stay":
            url = "https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels"
            headers = {
                "X-RapidAPI-Key": rapid_key,
                "X-RapidAPI-Host": "booking-com15.p.rapidapi.com"
            }
            future_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
            checkout = (datetime.date.today() + datetime.timedelta(days=32)).strftime("%Y-%m-%d")
            querystring = {"dest_id":"-2092174","search_type":"CITY","arrival_date":future_date,"departure_date":checkout,"adults":"1","room_qty":"1","page_number":"1","currency_code":"USD"}
            try:
                resp = requests.get(url, headers=headers, params=querystring, timeout=10)
                resp.raise_for_status()
                data = resp.json()
                hotels = data.get("data", {}).get("hotels", [])
                if hotels:
                    name = hotels[0].get("property", {}).get("name", "Unknown")
                    payload = {"live_hotel_found": name, "message": "Real Booking.com API call successful!"}
                else:
                    payload = {"message": "Real Booking.com API call successful, but no hotels found."}
            except Exception as e:
                status = "partner_required"
                payload = {"error": f"RapidAPI Error (Booking.com): {str(e)}", "help": "Ensure you are subscribed to Booking.com API on RapidAPI."}

        booking_id = f"RAPID-{uuid.uuid4().hex[:6].upper()}"
        return BookingInitiationResponse(
            booking_id=booking_id,
            status=status,
            redirect_url="https://rapidapi.com/developer/dashboard",
            payload={"rapid_api_key_used": rapid_key[:6] + "***", "booking_ref": request.option_reference, **payload}
        )

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

