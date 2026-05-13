from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, bookings, mobility, safety, transport, trips, users, images
from app.core.config import settings
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Event-driven multi-agent AI travel companion for India trips.",
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
app.include_router(images.router, prefix="/api")


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": f"{settings.app_name} API is running", "database_mode": "fluxbase"}


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "database_mode": "fluxbase"}
    
@app.get("/api/db-test")
async def db_test() -> dict[str, Any]:
    from app.database.repository import repo
    
    results = {}
    try:
        user1 = await repo.get_user("manu74reddy@gmail.com")
        user2 = await repo.get_user("manu123reddy747@gmail.com")
        
        results["manu74reddy_exists"] = user1 is not None
        results["manu123reddy_exists"] = user2 is not None
        
        return results
    except Exception as e:
        return {"error": str(e)}
