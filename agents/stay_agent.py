import ollama

def stay_agent(destination: str):

    prompt = f"""
    Suggest 3 good hotels or stays in {destination}.
    Return only hotel names separated by commas.
    """

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    stays = response["message"]["content"].split(",")

    result = []

    for s in stays:
        name = s.strip()

        result.append({
            "name": name,
            "location": f"https://www.google.com/maps/search/?api=1&query={name}+{destination}"
        })

    return result