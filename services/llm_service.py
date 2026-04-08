import ollama

def generate_places(city: str):

    prompt = f"""
    Give ONLY 3 tourist places in {city}.
    Do not give explanations.
    Return only the place names separated by commas.

    Example:
    Place1, Place2, Place3
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    places = response["message"]["content"].split(",")

    return [p.strip() for p in places]