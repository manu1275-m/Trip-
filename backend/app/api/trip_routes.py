from fastapi import APIRouter
from pydantic import BaseModel

from app.integrations.maps_api import get_map_link
from app.integrations.weather_api import get_weather
from app.integrations.ride_api import get_best_ride
from app.integrations.wiki_api import get_place_info

router = APIRouter()

class TripRequest(BaseModel):
    source: str
    destination: str
    days: int

@router.post("/generate-plan")
def generate_plan(request: TripRequest):

    plan = {}

    for i in range(1, request.days + 1):
        places = [
            f"{request.destination} tourist place {i}",
            f"{request.destination} attraction {i}"
        ]

        detailed_places = []

        for p in places:
            detailed_places.append({
                "name": p,
                "map": get_map_link(p),
                "info": get_place_info(p)
            })

        plan[f"Day {i}"] = {
            "places": detailed_places,
            "stay": f"Hotel near {request.destination}",
            "weather": get_weather(request.destination),
            "ride": get_best_ride(request.source, request.destination),
            "time": {
                "start": "9:00 AM",
                "end": "7:00 PM"
            }
        }

    return {
        "source": request.source,
        "destination": request.destination,
        "days": request.days,
        "plan": plan
    }