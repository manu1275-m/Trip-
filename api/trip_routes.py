from fastapi import APIRouter
from services.trip_service import plan_trip
from models.travel_request import TravelRequest

router = APIRouter()

@router.post("/trip")
def get_trip(request: TravelRequest):

    result = plan_trip(
        request.destination,
        request.days,
        request.budget,
        request.interests
    )

    return result