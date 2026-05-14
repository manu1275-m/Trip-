from __future__ import annotations

import json
from datetime import date, datetime, timezone
from typing import Any
from uuid import uuid4
import logging

from app.database.fluxbase import fluxbase_client

logger = logging.getLogger(__name__)

COLLECTIONS = [
    "app_users", "app_otp_codes", "app_emergency_contacts", 
    "app_travelers", "agentic_trips", "app_bookings", "app_travel_logs"
]

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def _doc_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:18]}"

def custom_serializer(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

class TravelRepository:
    def __init__(self):
        self.initialized = False

    async def initialize_schema(self):
        if self.initialized:
            return
        
        for collection in COLLECTIONS:
            # Create a simple generic JSON schema for every collection (MySQL format)
            sql = f"""
            CREATE TABLE IF NOT EXISTS {collection} (
                id VARCHAR(255) PRIMARY KEY,
                data JSON NOT NULL
            );
            """
            await fluxbase_client.execute_sql(sql)
        self.initialized = True

    async def _find_one(self, collection: str, query: dict[str, Any]) -> dict[str, Any] | None:
        await self.initialize_schema()
        
        if "id" in query:
            sql = f"SELECT data FROM {collection} WHERE id = ?"
            rows = await fluxbase_client.execute_sql(sql, [query["id"]])
        else:
            sql = f"SELECT data FROM {collection}"
            rows = await fluxbase_client.execute_sql(sql)
            
        for row in rows:
            data = json.loads(row.get("data")) if isinstance(row.get("data"), str) else row.get("data")
            if data:
                match = True
                for k, v in query.items():
                    if data.get(k) != v:
                        match = False
                        break
                if match:
                    return data
        return None

    async def _find_many(self, collection: str, query: dict[str, Any]) -> list[dict[str, Any]]:
        await self.initialize_schema()
        sql = f"SELECT data FROM {collection}"
        rows = await fluxbase_client.execute_sql(sql)
        results = []
        for row in rows:
            data = json.loads(row.get("data")) if isinstance(row.get("data"), str) else row.get("data")
            if data:
                match = True
                for k, v in query.items():
                    if data.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(data)
        return results

    async def _upsert_by_id(self, collection: str, doc_id: str, document: dict[str, Any]) -> dict[str, Any]:
        await self.initialize_schema()
        payload = {**document, "id": doc_id}
        payload_json = json.dumps(payload, default=custom_serializer)
        
        # MySQL upsert using ON DUPLICATE KEY UPDATE
        sql = f"""
        INSERT INTO {collection} (id, data) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE data = ?
        """
        await fluxbase_client.execute_sql(sql, [doc_id, payload_json, payload_json])
        return payload.copy()

    async def _insert(self, collection: str, document: dict[str, Any], prefix: str) -> dict[str, Any]:
        await self.initialize_schema()
        doc_id = document.get("id") or _doc_id(prefix)
        payload = {**document, "id": doc_id}
        payload_json = json.dumps(payload, default=custom_serializer)
        
        sql = f"INSERT INTO {collection} (id, data) VALUES (?, ?)"
        await fluxbase_client.execute_sql(sql, [doc_id, payload_json])
        return payload.copy()

    async def get_user(self, email: str) -> dict[str, Any] | None:
        return await self._find_one("app_users", {"email": email.lower()})

    async def ensure_user(self, email: str) -> dict[str, Any]:
        email = email.lower()
        existing = await self.get_user(email)
        if existing:
            return existing
        timestamp = now_utc()
        return await self._upsert_by_id(
            "app_users",
            email,
            {"email": email, "created_at": timestamp, "updated_at": timestamp},
        )

    async def update_user_profile(self, email: str, profile: dict[str, Any]) -> dict[str, Any]:
        user = await self.ensure_user(email)
        timestamp = now_utc()
        merged = {**user, **profile, "email": email.lower(), "updated_at": timestamp}
        return await self._upsert_by_id("app_users", email.lower(), merged)

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
        return await self._upsert_by_id("app_users", email.lower(), merged)

    async def store_otp(self, email: str, otp_hash: str, salt: str, expires_at: datetime) -> dict[str, Any]:
        return await self._insert(
            "app_otp_codes",
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
        records = await self._find_many("app_otp_codes", {"email": email.lower()})
        
        def safe_date(item):
            val = item.get("created_at")
            if not val:
                return datetime.min.replace(tzinfo=timezone.utc)
            if isinstance(val, str):
                try:
                    if val.endswith('Z'):
                        val = val[:-1] + '+00:00'
                    return datetime.fromisoformat(val)
                except ValueError:
                    return datetime.min.replace(tzinfo=timezone.utc)
            return val

        records.sort(key=safe_date, reverse=True)
        return records[0] if records else None

    async def mark_otp_used(self, otp_id: str) -> None:
        await self.initialize_schema()
        # Fetch the record first
        sql = "SELECT data FROM app_otp_codes WHERE id = ?"
        rows = await fluxbase_client.execute_sql(sql, [otp_id])
        if rows:
            row = rows[0]
            data = json.loads(row.get("data")) if isinstance(row.get("data"), str) else row.get("data")
            if data:
                data["used"] = True
                await self._upsert_by_id("app_otp_codes", otp_id, data)

    async def add_emergency_contact(self, email: str, contact: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "app_emergency_contacts",
            {**contact, "user_email": email.lower(), "created_at": now_utc()},
            "contact",
        )

    async def list_emergency_contacts(self, email: str) -> list[dict[str, Any]]:
        return await self._find_many("app_emergency_contacts", {"user_email": email.lower()})

    async def add_traveler(self, email: str, traveler: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "app_travelers",
            {**traveler, "user_email": email.lower(), "created_at": now_utc()},
            "traveler",
        )

    async def list_travelers(self, email: str) -> list[dict[str, Any]]:
        return await self._find_many("app_travelers", {"user_email": email.lower()})

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
        await self._upsert_by_id("agentic_trips", trip_id, payload)
        return payload.copy()

    async def get_trip(self, email: str, trip_id: str) -> dict[str, Any] | None:
        return await self._find_one("agentic_trips", {"user_email": email.lower(), "id": trip_id})

    async def list_trips(self, email: str) -> list[dict[str, Any]]:
        trips = await self._find_many("agentic_trips", {"user_email": email.lower()})
        
        def safe_date(item):
            val = item.get("created_at")
            if not val:
                return datetime.min.replace(tzinfo=timezone.utc)
            if isinstance(val, str):
                try:
                    # Handle python 3.10 'Z' suffix issue just in case
                    if val.endswith('Z'):
                        val = val[:-1] + '+00:00'
                    return datetime.fromisoformat(val)
                except ValueError:
                    return datetime.min.replace(tzinfo=timezone.utc)
            return val
            
        trips.sort(key=safe_date, reverse=True)
        return trips

    async def save_booking(self, email: str, booking: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "app_bookings",
            {**booking, "user_email": email.lower(), "created_at": now_utc()},
            "booking",
        )

    async def append_travel_log(self, email: str, trip_id: str, event: dict[str, Any]) -> dict[str, Any]:
        return await self._insert(
            "app_travel_logs",
            {
                "user_email": email.lower(),
                "trip_id": trip_id,
                "event": event,
                "created_at": now_utc(),
            },
            "log",
        )

repo = TravelRepository()
