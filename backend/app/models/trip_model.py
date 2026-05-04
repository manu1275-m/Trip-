from pydantic import BaseModel
from typing import List, Dict

class Place(BaseModel):
    name: str
    map: str
    info: str

class RideOption(BaseModel):
    provider: str
    distance: str
    time: str
    price: str

class DayPlan(BaseModel):
    places: List[Place]
    stay: str
    weather: Dict
    ride: List[RideOption]
    time: Dict

class Trip(BaseModel):
    source: str
    destination: str
    days: int
    plan: Dict[str, DayPlan]