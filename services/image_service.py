import requests

UNSPLASH_ACCESS_KEY = "mauLOw_SOLnXXtx8qUNYjIIjXBelsgc5df4TJAkXDVs"

def get_place_image(place):

    url = "https://api.unsplash.com/search/photos"

    params = {
        "query": place,
        "per_page": 1,
        "client_id": UNSPLASH_ACCESS_KEY
    }

    try:
        response = requests.get(url, params=params)
        data = response.json()

        if data["results"]:
            return data["results"][0]["urls"]["regular"]

    except:
        pass

    # fallback image if API fails
    return f"https://source.unsplash.com/600x400/?{place}"