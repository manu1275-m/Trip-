from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import decrypt_sensitive, encrypt_sensitive, get_current_user_email
from app.database.repository import repo
from app.models.schemas import (
    EmergencyContactInput,
    EmergencyContactPublic,
    TravelerInput,
    TravelerPublic,
    UserProfileInput,
    UserProfilePublic,
)


router = APIRouter(tags=["users"])


def _mask(value: str | None) -> str | None:
    if not value:
        return value
    return f"{'*' * max(0, len(value) - 4)}{value[-4:]}"


def _public_government_id(raw: dict | None) -> dict[str, str | None] | None:
    if not raw:
        return None
    decrypted = decrypt_sensitive(raw.get("id_number"))
    return {
        "id_type": raw.get("id_type"),
        "id_number": _mask(decrypted),
        "issuing_country": raw.get("issuing_country"),
    }


def _profile_public(user: dict) -> UserProfilePublic:
    return UserProfilePublic(
        email=user["email"],
        name=user.get("name"),
        phone=user.get("phone"),
        gender=user.get("gender"),
        age=user.get("age"),
        government_id=_public_government_id(user.get("government_id")),
        created_at=user.get("created_at"),
        updated_at=user.get("updated_at"),
    )


def _traveler_public(traveler: dict) -> TravelerPublic:
    return TravelerPublic(
        id=traveler["id"],
        name=traveler["name"],
        email=traveler.get("email"),
        phone=traveler["phone"],
        gender=traveler["gender"],
        age=traveler["age"],
        government_id=_public_government_id(traveler.get("government_id")) or {},
    )


def _encrypted_government_id(government_id: dict) -> dict:
    return {
        "id_type": government_id["id_type"],
        "id_number": encrypt_sensitive(government_id["id_number"]),
        "issuing_country": government_id.get("issuing_country", "India"),
    }


@router.get("/profile", response_model=UserProfilePublic)
async def get_profile(email: str = Depends(get_current_user_email)) -> UserProfilePublic:
    user = await repo.ensure_user(email)
    return _profile_public(user)


@router.put("/profile", response_model=UserProfilePublic)
async def update_profile(payload: UserProfileInput, email: str = Depends(get_current_user_email)) -> UserProfilePublic:
    data = payload.model_dump()
    data["government_id"] = _encrypted_government_id(data["government_id"])
    user = await repo.update_user_profile(email, data)
    return _profile_public(user)


@router.post("/emergency-contacts", response_model=EmergencyContactPublic)
async def add_emergency_contact(
    payload: EmergencyContactInput,
    email: str = Depends(get_current_user_email),
) -> EmergencyContactPublic:
    contact = await repo.add_emergency_contact(email, payload.model_dump())
    return EmergencyContactPublic(id=contact["id"], name=contact["name"], relation=contact["relation"], phone=contact["phone"])


@router.get("/emergency-contacts", response_model=list[EmergencyContactPublic])
async def list_emergency_contacts(email: str = Depends(get_current_user_email)) -> list[EmergencyContactPublic]:
    contacts = await repo.list_emergency_contacts(email)
    return [
        EmergencyContactPublic(id=item["id"], name=item["name"], relation=item["relation"], phone=item["phone"])
        for item in contacts
    ]


@router.post("/travelers", response_model=TravelerPublic)
async def add_traveler(payload: TravelerInput, email: str = Depends(get_current_user_email)) -> TravelerPublic:
    data = payload.model_dump()
    data["government_id"] = _encrypted_government_id(data["government_id"])
    traveler = await repo.add_traveler(email, data)
    return _traveler_public(traveler)


@router.get("/travelers", response_model=list[TravelerPublic])
async def list_travelers(email: str = Depends(get_current_user_email)) -> list[TravelerPublic]:
    travelers = await repo.list_travelers(email)
    return [_traveler_public(item) for item in travelers]

