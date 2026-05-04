from app.integrations.ride_api import get_ride_options

def get_transport_options(source: str, destination: str):
    return get_ride_options(source, destination)