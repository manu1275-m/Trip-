import requests
from app.integrations.maps_api import get_coordinates

def get_best_ride(source: str, destination: str):
    """
    Get real distance & time using OSRM (OpenStreetMap Routing)
    """

    try:
        # Get coordinates
        src = get_coordinates(source)
        dest = get_coordinates(destination)

        if not src or not dest:
            return {
                "type": "Cab",
                "distance": "N/A",
                "estimated_time": "N/A",
                "estimated_price": "N/A"
            }

        # OSRM API (free routing)
        url = f"http://router.project-osrm.org/route/v1/driving/{src['lon']},{src['lat']};{dest['lon']},{dest['lat']}?overview=false"

        res = requests.get(url)
        data = res.json()

        if data["code"] != "Ok":
            raise Exception()

        route = data["routes"][0]

        distance_km = route["distance"] / 1000
        duration_min = route["duration"] / 60

        # Simple real-world estimation
        price = distance_km * 12  # ₹12 per km approx

        return {
            "type": "Cab",
            "distance": f"{round(distance_km, 2)} km",
            "estimated_time": f"{round(duration_min)} mins",
            "estimated_price": f"₹{round(price)}"
        }

    except:
        return {
            "type": "Cab",
            "distance": "N/A",
            "estimated_time": "N/A",
            "estimated_price": "N/A"
        }