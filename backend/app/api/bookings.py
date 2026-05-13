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

from pydantic import BaseModel
class Traveler(BaseModel):
    name: str
    age: str
    gender: str

class MockBookingRequest(BaseModel):
    trip_id: str
    booking_type: str
    item_name: str
    travelers: list[Traveler]
    email: str
    total_price: float

@router.post("/confirm_mock")
async def confirm_mock_booking(payload: MockBookingRequest, email: str = Depends(get_current_user_email)):
    import os
    import uuid
    from dotenv import load_dotenv
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
    
    load_dotenv()
    
    conf = ConnectionConfig(
        MAIL_USERNAME=os.getenv("SMTP_USERNAME", ""),
        MAIL_PASSWORD=os.getenv("SMTP_PASSWORD", ""),
        MAIL_FROM=os.getenv("SMTP_FROM_EMAIL", "test@test.com"),
        MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
        MAIL_SERVER=os.getenv("SMTP_HOST", "smtp.gmail.com"),
        MAIL_FROM_NAME="Agentic AI Travel",
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True
    )
    
    pnr = f"RAZORPAY-{uuid.uuid4().hex[:8].upper()}"
    
    import datetime
    future_date = (datetime.date.today() + datetime.timedelta(days=14)).strftime("%B %d, %Y")
    
    date_html = ""
    if payload.booking_type.lower() in ["flight", "train", "transport"]:
        date_html = f"""
        <p style="margin: 5px 0; color: #475569;"><strong>Departure Date:</strong> {future_date}</p>
        <p style="margin: 5px 0; color: #475569;"><strong>Departure Time:</strong> 10:30 AM (Local Time)</p>
        """
    elif payload.booking_type.lower() == "hotel" or payload.booking_type.lower() == "stay":
        checkout_date = (datetime.date.today() + datetime.timedelta(days=17)).strftime("%B %d, %Y")
        date_html = f"""
        <p style="margin: 5px 0; color: #475569;"><strong>Check-in Date:</strong> {future_date}</p>
        <p style="margin: 5px 0; color: #475569;"><strong>Check-out Date:</strong> {checkout_date}</p>
        """
    
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎟️ Booking Confirmed!</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Powered by Razorpay & Agentic AI</p>
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 16px; color: #334155;">Hello,</p>
            <p style="font-size: 16px; color: #334155;">Your <strong>{payload.booking_type}</strong> booking for <strong>{payload.item_name}</strong> has been successfully confirmed. The payment of Rs {payload.total_price} via Razorpay was successful.</p>
            
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">Ticket Details</h2>
                <p style="margin: 5px 0; color: #475569;"><strong>Booking ID (PNR):</strong> {pnr}</p>
                {date_html}
                <p style="margin: 5px 0; color: #475569;"><strong>Total Amount Paid:</strong> Rs {payload.total_price}</p>
                
                <h3 style="margin: 15px 0 10px 0; font-size: 16px; color: #0f172a;">Travelers Details:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                    {''.join([f"<li>{t.name} (Age: {t.age}, {t.gender})</li>" for t in payload.travelers])}
                </ul>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">
                * This e-ticket serves as your valid confirmed digital ticket for travel/stay. Please present this at the counter.
            </p>
        </div>
    </div>
    """
    
    try:
        from app.database.repository import repo
        trip = await repo.get_trip(email, payload.trip_id)
        if trip:
            print(f"DEBUG: Found trip {payload.trip_id} for booking {payload.item_name}")
            if "bookings" not in trip:
                trip["bookings"] = {}
            # Use item_name or a normalized key to track booking
            trip["bookings"][payload.item_name] = {
                "pnr": pnr,
                "type": payload.booking_type,
                "price": payload.total_price,
                "status": "confirmed",
                "confirmed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            await repo.save_trip(email, trip)
            print(f"DEBUG: Successfully saved booking for {payload.item_name}")
        else:
            print(f"DEBUG: Trip {payload.trip_id} NOT found for user {email}")
    except Exception as e:
        print(f"Database update error: {e}")

    try:
        message = MessageSchema(
            subject=f"✅ Your {payload.booking_type} Ticket: {pnr}",
            recipients=[payload.email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
    except Exception as e:
        print(f"Mail error: {e}")
        
    return {"status": "success", "pnr": pnr, "message": "Booking confirmed and email sent"}

