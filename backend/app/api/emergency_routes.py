from fastapi import APIRouter

router = APIRouter()

@router.get("/emergency")
def emergency(location: str):

    return {
        "location": location,
        "hospital": f"Nearest hospital in {location}",
        "police": f"Nearest police station in {location}",
        "numbers": {
            "ambulance": "102",
            "police": "100"
        }
    }