from __future__ import annotations

from app.core.security import create_access_token as _create_access_token


def create_access_token(payload: dict[str, str]) -> str:
    email = payload["email"].lower()
    return _create_access_token(email, {"scope": "traveler"})
