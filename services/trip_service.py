from agents.trip_planner_agent import trip_planner_agent
from agents.restaurant_agent import restaurant_agent
from agents.stay_agent import stay_agent
from services.image_service import get_place_image

import urllib.parse


def plan_trip(destination, days, budget, interests):

    # Get places from AI agent
    places = trip_planner_agent(destination, days, interests)

    # If agent returns message (for non‑Indian places)
    if isinstance(places, str):
        return {
            "destination": destination,
            "message": places
        }

    # Get restaurants and stays
    restaurants = restaurant_agent(destination)
    stays = stay_agent(destination)

    place_result = []

    # distribute places across days
    places_per_day = max(1, len(places) // days)

    for index, place in enumerate(places):

        # clean text
        place = place.replace("\n", "").strip()

        # fetch image
        image = get_place_image(place)

        # calculate day
        day = (index // places_per_day) + 1
        if day > days:
            day = days

        place_result.append({
            "day": f"Day {day}",
            "name": place,
            "image": image,
            "location": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(place)}"
        })

    return {
        "destination": destination,
        "days": days,
        "budget": budget,
        "places": place_result,
        "restaurants": restaurants,
        "stays": stays
    }