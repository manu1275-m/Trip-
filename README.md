# Agentic AI Travel Companion

Event-driven multi-agent travel companion for India trips. The project includes a FastAPI backend, MongoDB-ready persistence, Gmail app-password OTP authentication, encrypted traveler ID fields, a LangGraph orchestration layer, and a Next.js operations dashboard.

## What Is Built

- Email OTP login with JWT sessions.
- User profile, emergency contacts, and reusable traveler profiles.
- India-only destination validation with OSM/Nominatim and fallback guardrails.
- Multi-agent trip planning with Planner, Transport, Mobility, Monitoring, Stay, Scheduler, Safety, and Return Journey agents.
- Weather, traffic, route, stay, transport, mobility, emergency, return, and booking initiation flows.
- MongoDB support with an in-memory development fallback while your garbage `.env` credentials are still present.
- Semi-automated booking redirects for providers where direct public booking APIs are not available.

## Configure

The committed `.env` contains garbage placeholders. Replace these before production:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/agentic_travel?retryWrites=true&w=majority
JWT_SECRET_KEY=<long-random-secret>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=<gmail-address>
SMTP_PASSWORD=<gmail-app-password>
SMTP_FROM_EMAIL=<gmail-address>
OPENWEATHER_API_KEY=<key>
TOMTOM_API_KEY=<key>
OPENROUTESERVICE_API_KEY=<key>
```

If `MONGODB_URI` still contains `garbage`, the backend runs in memory so the app can be tested locally without crashing.

## Run Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs open at `http://127.0.0.1:8000/docs`.

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

Dashboard opens at `http://localhost:3000`.

If your backend is not on port `8000`, set:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

## Main Workflow

1. Request OTP through `/api/auth/request-otp`.
2. Verify OTP through `/api/auth/verify-otp`.
3. Save profile, emergency contacts, and travelers.
4. Create a trip through `/api/trips/plan`.
5. Monitor live conditions through `/api/trips/{trip_id}/monitor`.
6. Use booking redirects through `/api/bookings/initiate`.
7. Retrieve saved trips through `/api/trips/history`.

For the full end-to-end agentic workflow, see [`docs/workflow.md`](docs/workflow.md).

## Production Notes

Public APIs for IRCTC, Ola, Uber, Rapido, and hotel inventory usually require partner access. This project implements clean adapter boundaries and provider redirects now, with estimated availability until partner credentials are connected.
