from app.integrations.maps_api import get_map_link
from app.integrations.weather_api import get_weather
from app.integrations.ride_api import get_ride_options
from app.integrations.wiki_api import get_place_info

def generate_trip_plan(source: str, destination: str, days: int):

    plan = {}

    for i in range(1, days + 1):
        places = [
            f"{destination} tourist place {i}",
            f"{destination} attraction {i}"
        ]

        detailed_places = []

        for place in places:
            detailed_places.append({
                "name": place,
                "map": get_map_link(place),
                "info": get_place_info(place)
            })

        plan[f"Day {i}"] = {
            "places": detailed_places,
            "stay": f"Hotel near {destination}",
            "weather": get_weather(destination),
            "ride": get_ride_options(source, destination),
            "time": {
                "start": "9:00 AM",
                "end": "7:00 PM"
            }
        }

    return {
        "source": source,
        "destination": destination,
        "days": days,
        "plan": plan
    }