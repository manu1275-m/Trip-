# Architecture

## System Shape

The backend is a FastAPI service that coordinates domain agents through `TravelOrchestrator`. If `langgraph` is installed, the orchestrator compiles a `StateGraph`; otherwise it executes the same nodes sequentially.

```text
Auth -> Profile -> Travelers -> Trip Init -> Destination Validation
  -> Monitoring -> Planner -> Scheduler -> Stay -> Transport
  -> Mobility -> Safety -> Return Journey -> Booking Readiness -> Storage
```

## Agents

- `PlannerAgent`: builds destination clusters and day-wise place plans.
- `SchedulerAgent`: creates departure times, ETAs, visit durations, meals, and buffers.
- `MonitoringAgent`: reads weather and traffic context and decides if replanning is needed.
- `StayAgent`: recommends zones and stay options with availability status.
- `TransportAgent`: compares train, bus, and flight options, or flights for international sources.
- `MobilityAgent`: ranks Uber, Ola, Rapido, and Namma Yatri based on rain, traffic, and group size.
- `SafetyAgent`: returns emergency contacts, nearby help, and India helplines.
- `ReturnJourneyAgent`: calculates checkout, terminal buffer, and return transport.

## Data Layer

`TravelRepository` writes to MongoDB when a real `MONGODB_URI` is configured. In development, placeholder garbage credentials activate a memory store. Sensitive government ID numbers are encrypted before storage using Fernet.

## External API Boundaries

- OpenStreetMap/Nominatim: geocoding and destination validation.
- OpenRouteService: route duration and distance when a key is available.
- OpenWeatherMap: live weather when a key is available.
- TomTom Traffic: live traffic speed and congestion when a key is available.
- Gmail SMTP with an app password: OTP delivery in local development.
- Booking providers: semi-automated redirects until partner APIs are connected.
