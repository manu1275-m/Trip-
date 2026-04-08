import ollama

def trip_planner_agent(destination, days, interests):

    prompt = f"""
    Create a {days}-day travel itinerary for {destination}.
    Interests: {interests}

    Rules:
    - Each day must have different places
    - Do not repeat places
    - Return only place names separated by commas
    - Total places should be {days * 2}

    Example:
    Place1, Place2, Place3
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    places = response["message"]["content"].split(",")

    return [p.strip() for p in places]