import requests

UNSPLASH_ACCESS_KEY = "mauLOw_SOLnXXtx8qUNYjIIjXBelsgc5df4TJAkXDVs"


def get_place_image(place_name):

    url = "https://api.unsplash.com/search/photos"

    try:
        response = requests.get(
            url,
            params={
                "query": place_name,
                "client_id": UNSPLASH_ACCESS_KEY,
                "per_page": 1
            },
            timeout=10
        )

        data = response.json()

        if data["results"]:
            return data["results"][0]["urls"]["regular"]

        return None

    except:
        return None