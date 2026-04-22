import requests


def is_in_india(destination):
    url = "https://nominatim.openstreetmap.org/search"

    try:
        response = requests.get(
            url,
            params={"q": destination, "format": "json", "limit": 1},
            headers={"User-Agent": "travel-ai-app"},
            timeout=10
        )

        data = response.json()

        if not data:
            return False

        return "india" in data[0].get("display_name", "").lower()

    except:
        return False


def get_location(place_name, destination=None):

    url = "https://nominatim.openstreetmap.org/search"

    def fetch(q):
        try:
            response = requests.get(
                url,
                params={"q": q, "format": "json", "limit": 1},
                headers={"User-Agent": "travel-ai-app"},
                timeout=10
            )
            return response.json()
        except:
            return []

    try:
        queries = [
            f"{place_name} {destination} India",
            f"{place_name} in {destination}",
            f"{place_name}, {destination}",
            f"{place_name} tourist place in {destination}",
            place_name
        ]

        final_query = place_name
        data = []

        for q in queries:
            data = fetch(q)
            if data:
                final_query = q
                break

        return {
            "name": place_name,
            "map_link": f"https://www.google.com/maps/search/?api=1&query={final_query.replace(' ', '+')}"
        }

    except:
        return {
            "name": place_name,
            "map_link": f"https://www.google.com/maps/search/?api=1&query={place_name.replace(' ', '+')}"
        }   