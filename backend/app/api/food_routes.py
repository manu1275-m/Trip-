from fastapi import APIRouter

router = APIRouter()

@router.get("/food")
def get_food(location: str):

    return {
        "location": location,
        "restaurants": [
            {
                "name": f"Top Restaurant in {location}",
                "zomato": f"https://www.zomato.com/search?q={location}",
                "swiggy": f"https://www.swiggy.com/search?query={location}"
            }
        ]
    }