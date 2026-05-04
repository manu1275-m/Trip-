import requests

def get_place_info(place: str):
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{place}"

    try:
        res = requests.get(url)
        data = res.json()

        return {
            "title": data.get("title"),
            "description": data.get("extract"),
            "url": data.get("content_urls", {}).get("desktop", {}).get("page")
        }
    except:
        return {
            "title": place,
            "description": "No info available",
            "url": ""
        }