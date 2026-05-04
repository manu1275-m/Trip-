import requests

def get_coordinates(place: str):
    """
    Get latitude & longitude using OpenStreetMap (Nominatim API)
    """
    url = "https://nominatim.openstreetmap.org/search"

    params = {
        "q": place,
        "format": "json",
        "limit": 1
    }

    try:
        res = requests.get(url, params=params, headers={"User-Agent": "travel-app"})
        data = res.json()

        if len(data) == 0:
            return None

        return {
            "lat": data[0]["lat"],
            "lon": data[0]["lon"]
        }

    except:
        return None


def get_map_link(place: str):
    """
    Generate OpenStreetMap link
    """
    coords = get_coordinates(place)

    if not coords:
        return f"https://www.openstreetmap.org/search?query={place.replace(' ', '+')}"

    return f"https://www.openstreetmap.org/?mlat={coords['lat']}&mlon={coords['lon']}#map=12/{coords['lat']}/{coords['lon']}"