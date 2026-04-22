from pydantic import BaseModel
from typing import Optional
from enum import Enum

class InterestChoice(str, Enum):
    yes = "yes"
    no = "no"

class TripRequest(BaseModel):
    source: str
    destination: str
    days: int
    people: int
    interest: Optional[InterestChoice] = None
    interest_type: Optional[str] = None