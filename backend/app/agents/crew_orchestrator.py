import os
import requests
from typing import Dict, Any

class TripOrchestrator:
    def __init__(self):
        self.model_name = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    def plan_trip(self, trip_request: Dict[str, Any]) -> str:
        destination = trip_request.get("destination", "India")
        days = trip_request.get("days", 3)
        preferences = trip_request.get("preferences", "")
        
        interest_text = f"Focus on {preferences}." if preferences else ""

        prompt = f"""
        Plan a {days}-day trip to {destination}, India.

        {interest_text}

        STRICT:
        - Return ONLY valid JSON
        - No explanation
        - Use real place names
        - You MUST provide exactly 3 different attractions/places per day

        FORMAT:
        {{
            "day_1": {{
                "places": [
                    {{"name": "Attraction 1", "description": "Short description"}},
                    {{"name": "Attraction 2", "description": "Short description"}},
                    {{"name": "Attraction 3", "description": "Short description"}}
                ],
                "stay": "Real hotel name in {destination}"
            }}
        }}
        """

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3}
                },
                timeout=300
            )
            response.raise_for_status()
            return response.json()["response"]
        except Exception as e:
            print(f"Ollama Error: {e}")
            import json
            return json.dumps({"error": f"LLM failed: {str(e)}"})
