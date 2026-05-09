from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.core.security import (
    generate_otp,
    hash_password,
    make_otp_hash,
    new_salt,
    now_utc,
    otp_matches,
    password_matches,
)
from app.database.repository import repo
from app.services.email_service import send_otp_email
from app.utils.jwt_handler import create_access_token


router = APIRouter(prefix="/auth", tags=["authentication"])


class EmailRequest(BaseModel):
    email: EmailStr


class VerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class RegisterRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


@router.post("/send-otp")
@router.post("/request-otp")
@router.post("/register/request-otp")
async def send_otp(data: EmailRequest):
    email = str(data.email).lower()
    existing_user = await repo.get_user(email)
    if existing_user and existing_user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email. Please login instead.",
        )

    otp = generate_otp()

    email_status = await send_otp_email(email, otp)
    if email_status.get("status") != "sent":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=email_status.get("reason", "OTP email could not be sent."),
        )

    salt = new_salt()
    await repo.store_otp(email, make_otp_hash(otp, salt), salt, now_utc() + timedelta(minutes=10))

    details: dict[str, Any] = {"delivery": email_status}

    return {
        "message": "OTP sent successfully",
        "details": details,
    }


async def _validate_otp(email: str, otp: str) -> dict[str, Any]:
    stored_otp = await repo.latest_otp(email)

    expires_at = stored_otp.get("expires_at") if stored_otp else None
    if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if not stored_otp or stored_otp.get("used") or not expires_at or expires_at < now_utc():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP is invalid or expired")

    if not otp_matches(otp, stored_otp["salt"], stored_otp["otp_hash"]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    return stored_otp


def _token_response(email: str, message: str) -> dict[str, str]:
    token = create_access_token({"email": email})
    return {
        "message": message,
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "email": email,
    }


@router.post("/verify-otp")
async def verify_otp(data: VerifyRequest):
    email = str(data.email).lower()
    stored_otp = await _validate_otp(email, data.otp)
    await repo.ensure_user(email)
    await repo.mark_otp_used(stored_otp["id"])
    return _token_response(email, "OTP verified successfully")


@router.post("/register/complete")
async def complete_registration(data: RegisterRequest):
    email = str(data.email).lower()
    stored_otp = await _validate_otp(email, data.otp)

    existing_user = await repo.get_user(email)
    if existing_user and existing_user.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account already exists for this email. Please login instead.",
        )

    password_hash, password_salt = hash_password(data.password)
    await repo.set_user_password(email, password_hash, password_salt)
    await repo.mark_otp_used(stored_otp["id"])
    return _token_response(email, "Account registered successfully")


@router.post("/login")
async def login(data: LoginRequest):
    email = str(data.email).lower()
    user = await repo.get_user(email)
    if not user or not user.get("password_hash") or not user.get("password_salt"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not password_matches(data.password, user["password_salt"], user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"email": email})
    return {
        "message": "Login successful",
        "token": token,
        "access_token": token,
        "token_type": "bearer",
        "email": email,
    }
