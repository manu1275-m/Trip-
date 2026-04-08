from fastapi import FastAPI
from api.trip_routes import router

app = FastAPI()

app.include_router(router)