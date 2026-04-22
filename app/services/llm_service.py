import requests

def generate_itinerary(destination, days, interest_type=None):

    interest_text = f"Focus on {interest_type}." if interest_type else ""

    prompt = f"""
    Plan a {days}-day trip to {destination}, India.

    {interest_text}

    STRICT:
    - Return ONLY valid JSON
    - No explanation
    - Use real place names
    - Give 2-3 places per day

    FORMAT:
    {{
        "day_1": {{
            "places": ["place1", "place2"],
            "stay": "hotel name"
        }}
    }}
    """

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3:8b",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        return response.json()["response"]

    except:
        return '{"error": "LLM failed"}'