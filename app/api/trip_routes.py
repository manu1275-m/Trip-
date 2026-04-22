from fastapi import APIRouter
from app.models.request_model import TripRequest
from app.services.llm_service import generate_itinerary
from app.integrations.maps_api import is_in_india, get_location
from app.integrations.image_api import get_place_image
import json

router = APIRouter()


@router.post("/generate-plan")
def generate_plan(request: TripRequest):

    destination = request.destination
    days = request.days
    people = request.people
    interest = request.interest
    interest_type = request.interest_type

    # ✅ VALIDATION
    if not is_in_india(destination):
        return {"error": "Only India locations allowed"}

    if days <= 0:
        return {"error": "Days must be greater than 0"}

    if people > 4:
        return {"error": "Maximum 4 people allowed"}

    # ✅ INTEREST FLOW
    if interest is None:
        return {
            "message": "Do you have any interests?",
            "options": ["Yes", "No"]
        }

    if interest == "yes" and not interest_type:
        return {
            "message": "Please provide interest_type (e.g., trekking)"
        }

    # ✅ LLM CALL
    llm_response = generate_itinerary(
        destination,
        days,
        interest_type if interest == "yes" else None
    )

    # ✅ SAFE JSON PARSE
    try:
        plan = json.loads(llm_response)
    except:
        return {
            "error": "Invalid LLM response",
            "raw_output": llm_response
        }

    # ✅ PROCESS PLAN
    for day in plan.values():

        updated_places = []

        # 🔥 Places → add map + image
        for place in day.get("places", []):
            loc = get_location(place, destination)

            image = get_place_image(f"{place} {destination}")

            loc["image"] = image

            updated_places.append(loc)

        day["places"] = updated_places

        # 🔥 Stay → ONLY map (no image)
        stay_value = day.get("stay", "")

        if isinstance(stay_value, dict):
            stay_name = stay_value.get("name", "")
        else:
            stay_name = stay_value

        day["stay"] = get_location(
            f"{stay_name} hotel in {destination}",
            destination
        )

    # ✅ FINAL RESPONSE
    return {
        "destination": destination,
        "days": days,
        "people": people,
        "plan": plan
    }