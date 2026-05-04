from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class TripRequest(BaseModel):
    source: str
    destination: str
    days: int

@router.post("/generate-plan")
def generate_plan(request: TripRequest):

    # Dummy itinerary (Step 1 only)
    plan = {}

    for i in range(1, request.days + 1):
        plan[f"Day {i}"] = [
            f"{request.destination} Place {i}A",
            f"{request.destination} Place {i}B"
        ]

    return {
        "source": request.source,
        "destination": request.destination,
        "days": request.days,
        "plan": plan
    }