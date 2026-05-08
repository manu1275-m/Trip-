# Detailed Workflow

## Overview

The system is an event-driven multi-agent AI travel companion for India trips. It plans trips, checks availability, adapts to live conditions, manages travel logistics, assists during the journey, handles emergencies, coordinates return travel, and stores completed trip history.

## High-Level Flow

```text
User Login
  -> User and Traveler Setup
  -> Trip Initialization
  -> Destination Validation
  -> Itinerary Generation
  -> Availability Verification
  -> Stay Recommendation
  -> Transportation Recommendation
  -> Booking Initiation
  -> Real-Time Monitoring
  -> Dynamic Replanning
  -> Local Mobility Assistance
  -> Emergency Handling
  -> Return Journey Planning
  -> Return Booking
  -> Trip Completion and Storage
```

## 1. Authentication

Goal: securely identify users and persist travel history.

Flow:

1. User opens the app.
2. User enters an email address.
3. Backend generates a six-digit OTP.
4. OTP is sent through Gmail SMTP using an app password.
5. User enters the OTP.
6. Backend verifies the OTP.
7. Backend creates a JWT token.
8. User session is initialized in the frontend.

Implementation:

| Step | Implementation |
| --- | --- |
| Request OTP | `/api/auth/request-otp` |
| Verify OTP | `/api/auth/verify-otp` |
| OTP delivery | `send_otp_email` in `email_service.py` |
| Session token | JWT from `jwt_handler.py` |

## 2. User Profile Setup

Goal: create a reusable travel identity.

Collected details:

- Name
- Phone number
- Gender
- Age
- Government ID details

Security handling:

- Sensitive government ID fields are encrypted before storage.
- Profile data is stored in MongoDB when configured.

Implementation:

| Step | Implementation |
| --- | --- |
| Save profile | `/api/profile` |
| Storage | `TravelRepository` |
| Encryption | `security.py` |

## 3. Emergency Contact Setup

Goal: provide emergency support during travel.

Users can add family members, friends, or guardians with:

- Name
- Relation
- Phone number

Implementation:

| Step | Implementation |
| --- | --- |
| Add contact | `/api/emergency-contacts` |
| Use in emergency pack | `SafetyAgent` |

## 4. Traveler Management

Goal: support solo and group travel.

Flow:

1. User chooses solo travel or group travel.
2. For group travel, the user can add travelers manually or reuse saved traveler profiles.

Traveler details:

- Name
- Email
- Phone
- Gender
- Age
- Government ID details

Implementation:

| Step | Implementation |
| --- | --- |
| Add traveler | `/api/travelers` |
| Reuse travelers in trip | `saved_traveler_ids` in `/api/trips/plan` |

## 5. Trip Initialization

Goal: capture trip intent.

User inputs:

- Current location
- Destination
- Travel date
- Number of days
- Budget
- Pace
- Interests

Implementation:

| Step | Implementation |
| --- | --- |
| Create trip plan | `/api/trips/plan` |
| Request schema | `TripInitRequest` |

## 6. Destination Validation

Goal: restrict the assistant to India travel.

Flow:

1. System checks whether the destination is inside India.
2. If yes, planning continues.
3. If no, the app returns: `Currently this travel assistant supports destinations within India only.`

Implementation:

| Step | Implementation |
| --- | --- |
| Destination validation | `validate_indian_destination` in `geo_service.py` |
| Geocoding | OpenStreetMap/Nominatim plus curated fallback hints |

## 7. Multi-Agent Orchestration

Main agents:

- Planner Agent
- Transport Agent
- Mobility Agent
- Monitoring Agent
- Stay Agent
- Scheduler Agent
- Safety Agent
- Return Journey Agent

The orchestration layer uses LangGraph when installed. If LangGraph is unavailable, the same flow runs sequentially as a local fallback.

Implementation:

| Step | Implementation |
| --- | --- |
| Orchestration | `TravelOrchestrator` |
| Agent state | `AgentState` |
| Optional graph runtime | LangGraph `StateGraph` |

## 8. Itinerary Generation

Planner Agent goal: generate a realistic trip plan.

Data sources:

- Attractions
- Maps
- Distances
- Timings

External services:

- OpenStreetMap
- OpenRouteService

Planner logic:

- Fetch attractions.
- Group nearby places.
- Avoid impractical routes.
- Minimize commute.
- Distribute places across days instead of repeating the same stops.

Example:

Instead of:

```text
Bangalore -> Mysore -> Bangalore -> Coorg
```

The system creates:

```text
Day 1 -> Bangalore
Day 2 -> Mysore
Day 3 -> Coorg
```

Implementation:

| Step | Implementation |
| --- | --- |
| Attraction fetching | `attractions_for` |
| Day planning | `PlannerAgent` |
| Route zones | `_route_zones` |

## 9. Live Context Monitoring

Monitoring Agent goal: observe real-world conditions.

APIs:

- OpenWeatherMap for weather
- TomTom Traffic API for traffic

Monitored conditions:

- Rain
- Storms
- Traffic congestion
- Route delays

Implementation:

| Step | Implementation |
| --- | --- |
| Monitoring snapshot | `MonitoringAgent` |
| Weather | `weather_service.py` |
| Traffic | `traffic_service.py` |
| Refresh endpoint | `/api/trips/{trip_id}/monitor` |

## 10. Smart Scheduling Engine

Scheduler Agent goal: create a realistic timing plan.

The system calculates:

- Departure time
- ETA
- Sightseeing duration
- Meal breaks
- Traffic buffers
- Expected return time

Example:

```text
Leave hotel -> 8:10 AM
Reach destination -> 8:40 AM
Expected return -> 7:15 PM
```

Implementation:

| Step | Implementation |
| --- | --- |
| Scheduling | `SchedulerAgent` |
| Schedule blocks | `ScheduleBlock` |
| Day plans | `DayPlan` |

## 11. Stay Optimization

Stay Agent goal: reduce unnecessary travel.

The system:

- Identifies travel zones.
- Recommends nearby stays.
- Minimizes fatigue.

Availability verification:

- Room availability
- Date compatibility
- Group-size compatibility

Implementation:

| Step | Implementation |
| --- | --- |
| Stay recommendations | `StayAgent` |
| Availability status | `availability_service.py` |

## 12. Complete Trip Plan Presentation

The user sees:

- Day-wise itinerary
- Place names
- Visit timings
- Stay recommendations
- Departure timings
- Return timings
- Estimated travel durations
- Monitoring context
- Safety information
- Return journey plan

Implementation:

| Step | Implementation |
| --- | --- |
| Frontend dashboard | `frontend/app/page.tsx` |
| Trip response | `TripPlanResponse` |

## 13. Intercity Transport Planning

Transport Agent goal: recommend practical intercity movement.

Case A: user outside India.

- Search flights.
- Check availability.
- Check timings.

Case B: user inside India.

- Compare train, bus, flight, and cab options.

Availability checks:

- Seat availability
- Route availability
- Timing feasibility

Implementation:

| Step | Implementation |
| --- | --- |
| Transport planning | `TransportAgent` |
| Transport schema | `TransportOption` |

## 14. Transport Decision Engine

The agent evaluates:

- Comfort
- Timing
- Travel practicality
- Group size

It recommends:

- Best transport option
- Alternate options

Implementation:

| Step | Implementation |
| --- | --- |
| Transport ranking | `TransportAgent` |
| Decision fields | `comfort_score`, `practicality_score` |

## 15. Transport Booking Flow

The system:

- Retrieves traveler data.
- Prepares booking info.
- Redirects to booking or payment flow.

This is semi-automated booking. Public booking APIs for several providers require partner access, so current flows use prepared payloads and redirects.

Implementation:

| Step | Implementation |
| --- | --- |
| Booking initiation | `/api/bookings/initiate` |
| Booking service | `booking_service.py` |

## 16. Local Mobility Assistance

Mobility Agent goal: recommend local movement.

Supported platforms:

- Uber
- Ola
- Rapido
- Namma Yatri

The system compares:

- Price
- ETA
- Weather suitability
- Traffic suitability
- Group compatibility

Example:

```text
Rain detected.
Cab recommended instead of bike.
```

Implementation:

| Step | Implementation |
| --- | --- |
| Local mobility | `MobilityAgent` |
| Mobility endpoint | `/api/mobility/options` |

## 17. Dynamic Replanning

Triggered when:

- Weather changes
- Traffic spikes
- Delays occur

Example:

```text
Heavy rain near Cubbon Park.
Museum moved to current slot.
```

Implementation:

| Step | Implementation |
| --- | --- |
| Replan signal | `MonitoringSnapshot.replan_required` |
| Reordering | `PlannerAgent` weather-aware prioritization |

## 18. Emergency Mode

Safety Agent goal: provide emergency assistance.

Provides:

- Nearby hospitals
- Nearby police stations
- Emergency contacts
- India helplines

Emergency actions:

- Quick access calling
- SOS support
- Emergency assistance context

Implementation:

| Step | Implementation |
| --- | --- |
| Safety pack | `SafetyAgent` |
| Safety endpoint | `/api/safety/nearby-help` |

## 19. Safety Intelligence

The system may warn about:

- Unsafe late travel
- Severe weather
- Excessive delays

Implementation:

| Step | Implementation |
| --- | --- |
| Safety warnings | `SafetyPack.safety_warnings` |
| Live alerts | `MonitoringSnapshot.safety_alerts` |

## 20. Return Journey Planning

Return Journey Agent goal: coordinate return logistics.

The system calculates:

- Hotel checkout timing
- Traffic buffer
- Airport or station ETA
- Optimal departure timing

Implementation:

| Step | Implementation |
| --- | --- |
| Return planning | `ReturnJourneyAgent` |
| Return schema | `ReturnJourneyPlan` |

## 21. Return Transport Booking

The system:

- Checks transport availability.
- Recommends return transport.
- Initiates booking or payment redirection.

Implementation:

| Step | Implementation |
| --- | --- |
| Return transport option | `ReturnJourneyPlan.recommended_transport` |
| Booking initiation | `/api/bookings/initiate` |

## 22. Trip Completion and Storage

Stored data:

- Itineraries
- Traveler profiles
- Emergency contacts
- Trip history
- Travel logs

Storage:

- MongoDB when configured
- In-memory fallback for local development

Implementation:

| Step | Implementation |
| --- | --- |
| Trip storage | `TravelRepository` |
| Trip history | `/api/trips/history` |

## Final Multi-Agent Architecture

| Agent | Responsibility |
| --- | --- |
| Planner Agent | Trip planning and route optimization |
| Transport Agent | Intercity transport orchestration |
| Mobility Agent | Local transport optimization |
| Monitoring Agent | Weather and traffic observation |
| Stay Agent | Accommodation optimization |
| Scheduler Agent | Timing and ETA management |
| Safety Agent | Emergency handling |
| Return Journey Agent | Return logistics management |

## Final Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React / Next.js |
| Backend | FastAPI |
| Database | MongoDB |
| Authentication | Email OTP through Gmail app passwords and JWT tokens |
| Maps and Routing | OpenStreetMap, OpenRouteService |
| Weather | OpenWeatherMap API |
| Traffic | TomTom Traffic API |
| AI orchestration | LangGraph with sequential fallback |
