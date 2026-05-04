from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.trip_routes import router as trip_router
from app.api.transport_routes import router as transport_router
from app.api.food_routes import router as food_router
from app.api.emergency_routes import router as emergency_router
from app.api.auth_routes import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trip_router)
app.include_router(transport_router)
app.include_router(food_router)
app.include_router(emergency_router)
app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "All APIs Running 🚀"}