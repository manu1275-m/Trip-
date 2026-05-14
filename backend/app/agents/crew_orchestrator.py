import os
import requests
import json
from typing import Dict, Any

class TripOrchestrator:
    def __init__(self):
        self.model_name = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    def plan_trip(self, trip_request: Dict[str, Any]) -> str:
        destination = trip_request.get("destination", "India")
        # Support both key names: frontend sends 'number_of_days', some paths send 'days'
        days = int(trip_request.get("number_of_days") or trip_request.get("days") or 3)
        preferences = trip_request.get("preferences", "")

        interest_text = f"Focus on {preferences}." if preferences else ""

        # Dynamically build the example format for every day so the AI knows exactly what to produce
        day_format_lines = []
        for d in range(1, days + 1):
            day_format_lines.append(
                f'    "day_{d}": {{'
                f'"places": ['
                f'{{"name": "Real Attraction Name", "description": "4-6 sentence detailed description covering history, cultural significance, visitor experience, highlights, and interesting facts.", "restaurant_name": "Famous Restaurant Name nearby", "restaurant_map_link": "https://www.google.com/maps/search/?api=1&query=Famous+Restaurant+Name+nearby"}},'
                f'{{"name": "Real Attraction Name", "description": "4-6 sentence detailed description.", "restaurant_name": "Local Eatery Name", "restaurant_map_link": "https://www.google.com/maps/search/?api=1&query=Local+Eatery+Name"}}'
                f'], "stay": "Real hotel name in {destination}"}}'
            )
        format_example = "{\n" + ",\n".join(day_format_lines) + "\n}"

        prompt = f"""
        Plan a {days}-day trip to {destination}, India.

        {interest_text}

        STRICT RULES:
        - Return ONLY valid JSON — absolutely no text before or after the JSON
        - You MUST include ALL {days} days: day_1 through day_{days}. Do NOT stop early.
        - Each day MUST have exactly 3 different, real attraction names in "places"
        - Each place description MUST be 4 to 6 full sentences covering: history, cultural significance, what visitors see and experience, best time to visit, and one interesting fact
        - For EVERY place, you MUST suggest ONE best real restaurant nearby (under 1-1.5 km)
        - Provide the exact restaurant name and a working Google Maps search link (e.g. https://www.google.com/maps/search/?api=1&query=Restaurant+Name)
        - "stay" must be a real, well-known hotel name in {destination}
        - Never repeat the same attraction or restaurant across days

        REQUIRED FORMAT — generate all {days} days:
        {format_example}
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 12000}
                },
                timeout=600
            )
            response.raise_for_status()
            return response.json()["response"]
        except Exception as e:
            print(f"Ollama Error: {e}")
            return json.dumps({"error": f"LLM failed: {str(e)}"})
