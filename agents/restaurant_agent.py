import ollama

def restaurant_agent(destination: str):

    prompt = f"""
    Suggest 3 popular restaurants in {destination}.
    Return only restaurant names separated by commas.
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    restaurants = response["message"]["content"].split(",")

    result = []

    for r in restaurants:
        name = r.strip()

        result.append({
            "name": name,
            "location": f"https://www.google.com/maps/search/?api=1&query={name}+{destination}"
        })

    return result