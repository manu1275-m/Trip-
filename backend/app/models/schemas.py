from datetime import date, datetime, time
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


class APIMessage(BaseModel):
    message: str
    details: dict[str, Any] | None = None


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: EmailStr


class GovernmentID(BaseModel):
    id_type: Literal["aadhaar", "passport", "voter_id", "driving_license", "pan", "other"]
    id_number: str = Field(min_length=3)
    issuing_country: str = "India"


class UserProfileInput(BaseModel):
    name: str = Field(min_length=2)
    phone: str = Field(min_length=8)
    gender: str
    age: int = Field(ge=1, le=120)
    government_id: GovernmentID


class UserProfilePublic(BaseModel):
    email: EmailStr
    name: str | None = None
    phone: str | None = None
    gender: str | None = None
    age: int | None = None
    government_id: dict[str, str | None] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class EmergencyContactInput(BaseModel):
    name: str = Field(min_length=2)
    relation: str = Field(min_length=2)
    phone: str = Field(min_length=8)


class EmergencyContactPublic(EmergencyContactInput):
    id: str


class TravelerInput(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr | None = None
    phone: str = Field(min_length=8)
    gender: str
    age: int = Field(ge=1, le=120)
    government_id: GovernmentID


class TravelerPublic(BaseModel):
    id: str
    name: str
    email: EmailStr | None = None
    phone: str
    gender: str
    age: int
    government_id: dict[str, str | None]


class TripPreferences(BaseModel):
    budget: Literal["economy", "standard", "premium"] = "standard"
    pace: Literal["relaxed", "balanced", "packed"] = "balanced"
    interests: list[str] = Field(default_factory=lambda: ["culture", "food", "nature"])
    accessibility_needs: list[str] = Field(default_factory=list)


class TripInitRequest(BaseModel):
    current_location: str = Field(min_length=2)
    destination: str = Field(min_length=2)
    travel_date: date
    number_of_days: int = Field(ge=1, le=21)
    travelers: list[TravelerInput] = Field(default_factory=list)
    saved_traveler_ids: list[str] = Field(default_factory=list)
    preferences: TripPreferences = Field(default_factory=TripPreferences)


class Place(BaseModel):
    name: str
    category: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    map_url: str
    estimated_visit_minutes: int
    notes: str


class ScheduleBlock(BaseModel):
    start: str
    end: str
    title: str
    type: Literal["travel", "sightseeing", "meal", "buffer", "checkin", "checkout"]
    location: str | None = None
    notes: str | None = None


class DayPlan(BaseModel):
    day: int
    date: date
    zone: str
    departure_time: str
    expected_return_time: str
    route_summary: str
    places: list[Place]
    schedule: list[ScheduleBlock]
    replanning_note: str | None = None


class AvailabilityStatus(BaseModel):
    available: bool
    confidence: Literal["live", "partner_required", "estimated", "fallback"]
    message: str
    last_checked_at: datetime


class StayRecommendation(BaseModel):
    name: str
    zone: str
    address: str
    estimated_price_per_night: int
    group_size_supported: int
    availability: AvailabilityStatus
    booking_url: str
    distance_note: str


class TransportOption(BaseModel):
    mode: Literal["train", "bus", "flight", "cab", "metro", "auto", "bike"]
    provider: str
    departure_time: str
    arrival_time: str
    duration_minutes: int
    estimated_price: int
    comfort_score: int = Field(ge=1, le=10)
    practicality_score: int = Field(ge=1, le=10)
    availability: AvailabilityStatus
    booking_url: str
    notes: str


class MobilityOption(BaseModel):
    provider: Literal["Uber", "Ola", "Rapido", "Namma Yatri"]
    vehicle_type: Literal["bike", "auto", "cab", "xl_cab"]
    eta_minutes: int
    estimated_price: int
    suitability_score: int = Field(ge=1, le=10)
    booking_url: str
    notes: str


class MonitoringSnapshot(BaseModel):
    weather: dict[str, Any]
    traffic: dict[str, Any]
    safety_alerts: list[str]
    replan_required: bool
    recommended_action: str


class EmergencyPlace(BaseModel):
    name: str
    type: Literal["hospital", "police", "pharmacy", "embassy", "other"]
    address: str
    phone: str | None = None
    map_url: str


class SafetyPack(BaseModel):
    emergency_contacts: list[EmergencyContactPublic]
    nearby_help: list[EmergencyPlace]
    helplines: dict[str, str]
    safety_warnings: list[str]


class ReturnJourneyPlan(BaseModel):
    checkout_time: str
    leave_for_terminal_time: str
    terminal_eta: str
    traffic_buffer_minutes: int
    recommended_transport: TransportOption
    alternates: list[TransportOption]


class TripPlanResponse(BaseModel):
    trip_id: str
    user_email: EmailStr
    destination_validation: dict[str, Any]
    itinerary: list[DayPlan]
    stays: list[StayRecommendation]
    intercity_transport: list[TransportOption]
    local_mobility: list[MobilityOption]
    monitoring: MonitoringSnapshot
    safety: SafetyPack
    return_journey: ReturnJourneyPlan
    booking_readiness: dict[str, Any]
    created_at: datetime


class BookingInitiationRequest(BaseModel):
    trip_id: str
    booking_type: Literal["stay", "transport", "mobility", "return_transport"]
    provider: str
    option_reference: str | None = None


class BookingInitiationResponse(BaseModel):
    booking_id: str
    status: Literal["ready_for_payment", "partner_required", "manual_review"]
    redirect_url: str
    payload: dict[str, Any]


class MobilityRequest(BaseModel):
    pickup: str
    dropoff: str
    travelers_count: int = Field(ge=1, le=12)
    raining: bool = False


class MonitoringRequest(BaseModel):
    location: str
    destination: str
    scheduled_time: time | None = None
