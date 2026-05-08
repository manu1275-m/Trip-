from __future__ import annotations

from collections import defaultdict
from typing import Any

from app.core.config import settings


class Database:
    def __init__(self) -> None:
        self.client: Any | None = None
        self.db: Any | None = None
        self.memory: dict[str, dict[str, Any]] = defaultdict(dict)
        self.mode = "memory"

    async def connect(self) -> None:
        if not settings.mongo_configured:
            self.mode = "memory"
            return
        try:
            from motor.motor_asyncio import AsyncIOMotorClient

            self.client = AsyncIOMotorClient(settings.effective_mongodb_uri, serverSelectionTimeoutMS=2500)
            self.db = self.client[settings.mongodb_database]
            await self.client.admin.command("ping")
            self.mode = "mongo"
        except Exception:
            self.client = None
            self.db = None
            self.mode = "memory"

    async def close(self) -> None:
        if self.client is not None:
            self.client.close()


database = Database()
