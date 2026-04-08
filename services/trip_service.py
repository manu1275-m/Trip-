from agents.trip_planner_agent import trip_planner_agent
from agents.restaurant_agent import restaurant_agent
from agents.stay_agent import stay_agent
from services.image_service import get_place_image


def plan_trip(destination, days, budget, interests):

    places = trip_planner_agent(destination, days, interests)
    restaurants = restaurant_agent(destination)
    stays = stay_agent(destination)

    place_result = []

    for place in places:
        image = get_place_image(place)

        place_result.append({
            "name": place,
            "image": image
        })

    return {
        "destination": destination,
        "days": days,
        "budget": budget,
        "places": place_result,
        "restaurants": restaurants,
        "stays": stays
    }