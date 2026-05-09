from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.database.mongo import database


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _doc_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:18]}"


class TravelRepository:
    async def _find_one(self, collection: str, query: dict[str, Any]) -> dict[str, Any] | None:
        if database.mode == "mongo" and database.db is not None:
            return await database.db[collection].find_one(query, {"_id": False})

        for doc in database.memory[collection].values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc.copy()
        return None

    async def _find_many(self, collection: str, query: dict[str, Any]) -> list[dict[str, Any]]:
        if database.mode == "mongo" and database.db is not None:
            cursor = database.db[collection].find(query, {"_id": False})
            return [doc async for doc in cursor]

        docs = []
        for doc in database.memory[collection].values():
            if all(doc.get(k) == v for k, v in query.items()):
                docs.append(doc.copy())
        return docs

    async def _upsert_by_id(self, collection: str, doc_id: str, document: dict[str, Any]) -> dict[str, Any]:
        payload = {**document, "id": doc_id}
        if database.mode == "mongo" and database.db is not None:
            await database.db[collection].update_one({"id": doc_id}, {"$set": payload}, upsert=True)
        else:
            database.memory[collection][doc_id] = payload
        return payload.copy()

    async def _insert(self, collection: str, document: dict[str, Any], prefix: str) -> dict[str, Any]:
        doc_id = document.get("id") or _doc_id(prefix)
        payload = {**document, "id": doc_id}
        if database.mode == "mongo" and database.db is not None:
            await database.db[collection].insert_one(payload)
        else:
            database.memory[collection][doc_id] = payload
        return payload.copy()

    async def get_user(self, email: str) -> dict[str, Any] | None:
        return await self._find_one("users", {"email": email.lower()})

    async def ensure_user(self, email: str) -> dict[str, Any]:
        email = email.lower()
        existing = await self.get_user(email)
        if existing:
            return existing
        timestamp = now_utc()
        return await self._upsert_by_id(
            "users",
            email,
            {"email": email, "created_at": timestamp, "updated_at": timestamp},
        )

    async def update_user_profile(self, email: str, profile: dict[str, Any]) -> dict[str, Any]:
        user = await self.ensure_user(email)
        timestamp = now_utc()
        merged = {**user, **profile, "email": email.lower(), "updated_at": timestamp}
        return await self._upsert_by_id("users", email.lower(), merged)

    async def set_user_password(self, email: str, password_hash: str, password_salt: str) -> dict[str, Any]:
        user = await self.ensure_user(email)
        timestamp = now_utc()
        merged = {
            **user,
            "email": email.lower(),
            "password_hash": password_hash,
            "password_salt": password_salt,
            "registered_at": user.get("registered_at") or timestamp,
            "updated_at": timestamp,
        }
        return await self._upsert_by_id("users", email.lower(), merged)

    async def store_otp(self, email: str, otp_hash: str, salt: str, expires_at: datetime) -> dict[str, Any]:
        return await self._insert(
            "otp_codes",
            {
                "email": email.lower(),
                "otp_hash": otp_hash,
                "salt": salt,
                "expires_at": expires_at,
                "used": False,
                "created_at": now_utc(),
            },
            "otp",
        )

    async def latest_otp(self, email: str) -> dict[str, Any] | None:
        records = await self._find_many("otp_codes", {"email": email.lower()})
        records.sort(key=lambda item: item.get("created_at", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
        return records[0] if records else None

    async def mark_otp_used(self, otp_id: str) -> None:
        record = None
        if database.mode == "mongo" and database.db is not None:
            await database.db["otp_codes"].update_one({"id": otp_id}, {"$set": {"used": True}})
            return
        record = database.memory["otp_codes"].get(otp_id)
        if record:
            record["used"] = True

    async def add_emergency_contact(self, email: str, contact: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "emergency_contacts",
            {**contact, "user_email": email.lower(), "created_at": now_utc()},
            "contact",
        )

    async def list_emergency_contacts(self, email: str) -> list[dict[str, Any]]:
        return await self._find_many("emergency_contacts", {"user_email": email.lower()})

    async def add_traveler(self, email: str, traveler: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "travelers",
            {**traveler, "user_email": email.lower(), "created_at": now_utc()},
            "traveler",
        )

    async def list_travelers(self, email: str) -> list[dict[str, Any]]:
        return await self._find_many("travelers", {"user_email": email.lower()})

    async def get_travelers_by_ids(self, email: str, traveler_ids: list[str]) -> list[dict[str, Any]]:
        travelers = await self.list_travelers(email)
        lookup = set(traveler_ids)
        return [traveler for traveler in travelers if traveler.get("id") in lookup]

    async def save_trip(self, email: str, trip: dict[str, Any]) -> dict[str, Any]:
        trip_id = trip.get("trip_id") or _doc_id("trip")
        payload = {
            **trip,
            "trip_id": trip_id,
            "id": trip_id,
            "user_email": email.lower(),
            "created_at": trip.get("created_at") or now_utc(),
        }
        await self._upsert_by_id("trips", trip_id, payload)
        return payload.copy()

    async def get_trip(self, email: str, trip_id: str) -> dict[str, Any] | None:
        return await self._find_one("trips", {"user_email": email.lower(), "trip_id": trip_id})

    async def list_trips(self, email: str) -> list[dict[str, Any]]:
        trips = await self._find_many("trips", {"user_email": email.lower()})
        trips.sort(key=lambda item: item.get("created_at", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
        return trips

    async def save_booking(self, email: str, booking: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "bookings",
            {**booking, "user_email": email.lower(), "created_at": now_utc()},
            "booking",
        )

    async def append_travel_log(self, email: str, trip_id: str, event: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "travel_logs",
            {
                "user_email": email.lower(),
                "trip_id": trip_id,
                "event": event,
                "created_at": now_utc(),
            },
            "log",
        )


repo = TravelRepository()
