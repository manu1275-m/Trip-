# API Spec

Base URL: `http://127.0.0.1:8000/api`

## Authentication

`POST /auth/request-otp`

```json
{ "email": "traveler@example.com" }
```

`POST /auth/verify-otp`

```json
{ "email": "traveler@example.com", "otp": "123456" }
```

Returns a bearer JWT. Send it as `Authorization: Bearer <token>`.

## User Setup

`PUT /profile` saves encrypted ID data.

`POST /emergency-contacts` and `GET /emergency-contacts`.

`POST /travelers` and `GET /travelers`.

## Trip Planning

`POST /trips/plan`

```json
{
  "current_location": "Bangalore",
  "destination": "Coorg",
  "travel_date": "2026-05-09",
  "number_of_days": 3,
  "travelers": [],
  "saved_traveler_ids": [],
  "preferences": {
    "budget": "standard",
    "pace": "balanced",
    "interests": ["culture", "food", "nature"],
    "accessibility_needs": []
  }
}
```

Returns the full itinerary, stays, intercity transport, mobility, monitoring snapshot, safety pack, return journey, and booking readiness.

## Live Operations

- `GET /trips/history`
- `GET /trips/{trip_id}`
- `POST /trips/{trip_id}/monitor`
- `GET /trips/{trip_id}/return-plan`
- `POST /transport/recommend`
- `POST /mobility/options`
- `GET /safety/emergency?destination=Coorg`
- `POST /bookings/initiate`

