from __future__ import annotations

from collections import defaultdict
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    def __init__(self) -> None:
        self.client: Any | None = None
        self.db: Any | None = None
        self.memory: dict[str, dict[str, Any]] = defaultdict(dict)
        self.mode = "memory"

    async def connect(self) -> None:
        if not settings.mongo_configured:
            self.mode = "memory"
            logger.warning("MongoDB is not configured; using in-memory development storage.")
            return
        try:
            from motor.motor_asyncio import AsyncIOMotorClient

            self.client = AsyncIOMotorClient(settings.effective_mongodb_uri, serverSelectionTimeoutMS=10000)
            self.db = self.client[settings.mongodb_database]
            await self.client.admin.command("ping")
            self.mode = "mongo"
            logger.info("Connected to MongoDB database '%s'.", settings.mongodb_database)
        except Exception:
            self.client = None
            self.db = None
            self.mode = "memory"
            logger.exception("MongoDB is configured but the connection failed.")
            raise

    async def close(self) -> None:
        if self.client is not None:
            self.client.close()


database = Database()
