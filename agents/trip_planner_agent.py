import ollama

def trip_planner_agent(destination, days, interests):

    prompt = f"""
    You are a travel planner that ONLY suggests places within India.

    If the destination is outside India, reply exactly with:
    "Currently our travel planner supports destinations within India only."

    If the destination is in India:
    - Suggest tourist places for a {days}-day trip
    - Return only place names
    - Separate places with commas
    - No explanations

    Destination: {destination}
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    result = response["message"]["content"]

    if "supports destinations within India only" in result:
        return result

    places = result.split(",")

    return [p.strip() for p in places]