import requests

API_KEY = "f09509a07df551d721544e42b55f6335"

def get_weather(city: str):
    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    try:
        res = requests.get(url)
        data = res.json()

        if res.status_code != 200:
            return {
                "city": city,
                "temperature": "N/A",
                "condition": "Not found"
            }

        return {
            "city": city,
            "temperature": f"{data['main']['temp']}°C",
            "condition": data['weather'][0]['description']
        }

    except:
        return {
            "city": city,
            "temperature": "N/A",
            "condition": "Error fetching weather"
        }