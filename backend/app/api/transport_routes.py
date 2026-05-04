from fastapi import APIRouter
from pydantic import BaseModel
from app.integrations.ride_api import get_best_ride

router = APIRouter()

class TransportRequest(BaseModel):
    source: str
    destination: str

@router.post("/transport")
def get_transport(request: TransportRequest):

    ride = get_best_ride(request.source, request.destination)

    return {
        "source": request.source,
        "destination": request.destination,
        "ride": ride
    }