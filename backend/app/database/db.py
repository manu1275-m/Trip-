from __future__ import annotations

from typing import Any

from app.database.repository import repo


class _UsersCollection:
    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        email = str(query.get("email", "")).lower()
        if not email:
            return None
        return await repo.get_user(email)

    async def insert_one(self, document: dict[str, Any]) -> dict[str, Any]:
        user = await repo.ensure_user(str(document["email"]).lower())
        return {"inserted_id": user["email"]}


class _Database:
    users = _UsersCollection()


db = _Database()
