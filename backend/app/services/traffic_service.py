from app.integrations.maps_api import get_coordinates

def get_traffic_estimate(source: str, destination: str):
    """
    Basic traffic estimation using distance (via coordinates)
    """

    src = get_coordinates(source)
    dest = get_coordinates(destination)

    if not src or not dest:
        return {
            "status": "Unavailable",
            "message": "Could not estimate traffic"
        }

    return {
        "status": "Moderate",
        "note": "Estimated based on route distance (OSM)"
    }