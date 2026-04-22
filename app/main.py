from fastapi import FastAPI
from app.api.trip_routes import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def home():
    return {"message": "Travel AI Running"}