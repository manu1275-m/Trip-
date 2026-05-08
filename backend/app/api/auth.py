from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from random import randint

from app.services.otp_store import otp_storage
from app.services.email_service import send_otp_email
from app.database.db import db
from app.utils.jwt_handler import create_access_token


router = APIRouter(prefix="/auth", tags=["authentication"])


class EmailRequest(BaseModel):
    email: EmailStr


class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


@router.post("/send-otp")
@router.post("/request-otp")
async def send_otp(data: EmailRequest):
    email = str(data.email).lower()
    otp = str(randint(100000, 999999))

    email_status = await send_otp_email(email, otp)
    if email_status.get("status") != "sent":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=email_status.get("reason", "OTP email could not be sent."),
        )

    otp_storage[email] = otp

    details: dict[str, Any] = {"delivery": email_status}

    return {
        "message": "OTP sent successfully",
        "details": details,
    }


@router.post("/verify-otp")
async def verify_otp(data: VerifyRequest):
    email = str(data.email).lower()
    stored_otp = otp_storage.get(email)

    if stored_otp != data.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    existing_user = await db.users.find_one({"email": email})

    if not existing_user:
        user_data = {"email": email}
        await db.users.insert_one(user_data)

    token = create_access_token({"email": email})
    otp_storage.pop(email, None)

    return {
        "message": "OTP verified successfully",
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "email": email,
    }
