import httpx
from langchain_core.tools import tool

@tool("Search Places")
def search_places(query: str) -> str:
    """
    Searches for real-world places, tourist attractions, hotels, or restaurants using the OpenStreetMap Nominatim API.
    Provide a specific query like 'tourist attractions in Kerala' or 'hotels in Mumbai'.
    Returns a list of real, verified places.
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "limit": 5,
            "countrycodes": "in" # Limit to India to improve relevance
        }
        # Nominatim strictly requires a custom User-Agent
        headers = {"User-Agent": "AgenticTravelPlanner/1.0 (agent@example.com)"}
        
        with httpx.Client() as client:
            response = client.get(url, params=params, headers=headers, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
        if not data:
            return "No real places found for that query. Try broadening your search."
            
        results = []
        for item in data:
            name = item.get("name", "Unknown Location")
            display = item.get('display_name', '')
            category = item.get('type', 'place')
            results.append(f"- {name} ({category}): {display}")
            
        return "Verified Places Found:\n" + "\n".join(results)
    except Exception as e:
        return f"Error fetching places from Maps API: {str(e)}"
