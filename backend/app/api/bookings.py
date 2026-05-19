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
    icon = "✈️"
    if payload.booking_type.lower() in ["flight", "transport"]:
        icon = "✈️ Flight"
        date_html = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Departure Date</strong><br>{future_date}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Departure Time</strong><br>10:30 AM</td>
        </tr>
        """
    elif payload.booking_type.lower() == "train":
        icon = "🚆 Train"
        date_html = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Departure Date</strong><br>{future_date}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Departure Time</strong><br>10:30 AM</td>
        </tr>
        """
    elif payload.booking_type.lower() == "hotel" or payload.booking_type.lower() == "stay":
        icon = "🏨 Hotel"
        checkout_date = (datetime.date.today() + datetime.timedelta(days=17)).strftime("%B %d, %Y")
        date_html = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Check-in</strong><br>{future_date} (2:00 PM)</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;"><strong>Check-out</strong><br>{checkout_date} (11:00 AM)</td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <!-- Header -->
            <tr>
                <td style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 40px 30px; text-align: center; color: #ffffff;">
                    <div style="font-size: 48px; margin-bottom: 10px;">{icon.split(' ')[0]}</div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Booking Confirmed</h1>
                    <p style="margin: 10px 0 0 0; font-size: 15px; opacity: 0.9; font-weight: 500;">Roamio AI Travel Planner</p>
                </td>
            </tr>
            
            <!-- Body -->
            <tr>
                <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 25px 0; font-size: 16px; color: #334155; line-height: 1.6;">
                        Hello!<br><br>
                        Your <strong>{payload.booking_type}</strong> reservation for <strong>{payload.item_name}</strong> has been successfully secured.
                    </p>

                    <!-- Ticket Card -->
                    <div style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 25px; background-color: #f8fafc; margin-bottom: 30px;">
                        <h2 style="margin: 0 0 20px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">E-Ticket Voucher</h2>
                        
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 15px; color: #0f172a;">
                            <tr>
                                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                                    <strong style="color: #64748b; font-size: 13px; text-transform: uppercase;">Booking Reference (PNR)</strong><br>
                                    <span style="font-size: 20px; font-weight: 700; font-family: monospace; color: #2563eb;">{pnr}</span>
                                </td>
                            </tr>
                            {date_html}
                            <tr>
                                <td colspan="2" style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                                    <strong style="color: #64748b; font-size: 13px; text-transform: uppercase;">Payment Details</strong><br>
                                    <strong>Amount Paid:</strong> Rs {payload.total_price:,.2f}<br>
                                    <span style="font-size: 13px; color: #16a34a;">✓ Paid securely via Razorpay</span>
                                </td>
                            </tr>
                        </table>

                        <h3 style="margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b;">Travelers</h3>
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 14px; color: #334155;">
                            {''.join([f'<tr><td style="padding: 8px 10px; background: #ffffff; border-radius: 6px; margin-bottom: 4px; display: block; border: 1px solid #e2e8f0;"><strong>{t.name}</strong> • Age {t.age} • {t.gender}</td></tr>' for t in payload.travelers])}
                        </table>
                    </div>
                    
                    <!-- Footer Info -->
                    <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 25px;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data={pnr}" alt="QR Code" style="width: 100px; height: 100px; margin-bottom: 15px; opacity: 0.8;" />
                        <p style="margin: 0; font-size: 13px; color: #64748b;">
                            Please present this digital e-ticket at the counter along with a valid Government ID.<br>
                            Need help? Reply to this email.
                        </p>
                    </div>
                </td>
            </tr>
            <!-- Bottom Accent -->
            <tr><td style="height: 8px; background: #2563eb;"></td></tr>
        </table>
    </body>
    </html>
    """
    
    try:
        from app.database.repository import repo
        trip = await repo.get_trip(email, payload.trip_id)
        if trip:
            print(f"DEBUG: Found trip {payload.trip_id} for booking {payload.item_name}")
            if "bookings" not in trip:
                trip["bookings"] = {}
            # Try to match payload.item_name against hotels in the plan for better key mapping
            booking_key = payload.item_name
            try:
                if payload.booking_type == "Hotel" and "raw_plan" in trip:
                    import json, re
                    plan = trip["raw_plan"]
                    if isinstance(plan, str):
                        match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', plan)
                        plan = json.loads(match.group(1)) if match else json.loads(plan)
                    
                    # Extract all stays from plan
                    stays = []
                    for day in plan.values():
                        if isinstance(day, dict) and day.get("stay"):
                            stays.append(day["stay"])
                    
                    # Find best match
                    for s in stays:
                        if payload.item_name.lower().strip() in s.lower().strip() or s.lower().strip() in payload.item_name.lower().strip():
                            booking_key = s
                            print(f"DEBUG: Matched {payload.item_name} to plan stay: {s}")
                            break
            except Exception as e:
                print(f"DEBUG: Match logic error: {e}")

            trip["bookings"][booking_key] = {
                "pnr": pnr,
                "type": payload.booking_type,
                "item_name": payload.item_name,
                "price": payload.total_price,
                "status": "confirmed",
                "confirmed_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
            
            # Save travelers and booking email to the trip request so they are persistent
            if "request" not in trip:
                trip["request"] = {}
            
            if not trip["request"].get("travelers") or len(trip["request"]["travelers"]) == 0:
                trip["request"]["travelers"] = [t.model_dump() for t in payload.travelers]
            
            # Always persist the booking email
            trip["request"]["booking_email"] = payload.email

            print(f"DEBUG: Bookings before save: {list(trip['bookings'].keys())}")

            # Explicitly save to app_bookings table for separate indexing
            await repo.save_booking(email, {
                "trip_id": payload.trip_id,
                "pnr": pnr,
                "type": payload.booking_type,
                "item_name": payload.item_name,
                "booking_key": booking_key,
                "total_price": payload.total_price,
                "travelers": [t.model_dump() for t in payload.travelers],
                "status": "confirmed",
                "booking_email": payload.email
            })

            await repo.save_trip(email, trip)
            print(f"DEBUG: Saved booking '{booking_key}' (pnr={pnr}) for trip {payload.trip_id}")
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


from app.core.security import generate_otp, make_otp_hash, new_salt, now_utc, otp_matches
from datetime import timedelta
from fastapi import HTTPException

class EmailOTPRequest(BaseModel):
    email: str

class EmailOTPVerify(BaseModel):
    email: str
    otp: str

@router.post("/send-email-otp")
async def send_email_otp(data: EmailOTPRequest):
    from app.services.email_service import send_otp_email
    otp = generate_otp()
    
    email_status = await send_otp_email(data.email, otp)
    if email_status.get("status") != "sent":
        raise HTTPException(status_code=502, detail="Failed to send OTP email")
        
    salt = new_salt()
    from app.database.repository import repo
    await repo.store_otp(data.email, make_otp_hash(otp, salt), salt, now_utc() + timedelta(minutes=10))
    return {"message": "OTP sent via Email"}

@router.post("/verify-email-otp")
async def verify_email_otp(data: EmailOTPVerify):
    from app.database.repository import repo
    stored_otp = await repo.latest_otp(data.email)
    if not stored_otp:
        raise HTTPException(status_code=400, detail="OTP record not found")
    if stored_otp.get("used"):
        raise HTTPException(status_code=400, detail="OTP already used")
    
    from datetime import datetime, timezone
    expires_at = stored_otp.get("expires_at")
    if isinstance(expires_at, str):
        try:
            if expires_at.endswith('Z'):
                expires_at = expires_at[:-1] + '+00:00'
            expires_at = datetime.fromisoformat(expires_at)
        except ValueError:
            pass
    if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if not expires_at or (isinstance(expires_at, datetime) and expires_at < now_utc()):
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if not otp_matches(data.otp, stored_otp["salt"], stored_otp["otp_hash"]):
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    await repo.mark_otp_used(stored_otp["id"])
    return {"message": "Email verified successfully"}
