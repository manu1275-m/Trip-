from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, bookings, mobility, safety, transport, trips, users
from app.core.config import settings
from app.database.mongo import database


@asynccontextmanager
async def lifespan(_: FastAPI):
    await database.connect()
    yield
    await database.close()


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Event-driven multi-agent AI travel companion for India trips.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(transport.router, prefix="/api")
app.include_router(mobility.router, prefix="/api")
app.include_router(safety.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} API is running", "database_mode": database.mode}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "database_mode": database.mode}

