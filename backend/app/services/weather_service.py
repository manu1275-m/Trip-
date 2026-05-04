from app.integrations.weather_api import get_weather

def fetch_weather(city: str):
    return get_weather(city)