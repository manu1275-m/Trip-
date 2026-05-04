AI Tourism Planner – Agentic Travel Assistant

Overview
AI Tourism Planner is an Agentic AI-based travel assistant that automates complete trip planning. It generates personalized itineraries, optimizes travel routes, monitors real-time conditions, and assists with bookings in one system.

Features

Smart Itinerary Generation

Generates day-wise travel plans

Suggests best tourist places

Includes location links for navigation

Intelligent Transport System

Compares ride options (bike, auto, cab)

Selects best based on price, time, comfort

Proceeds till final booking step (user only pays)

Real-Time Monitoring

Tracks weather conditions

Adjusts itinerary if weather is bad

Monitors traffic and gives estimated travel time

Stay and Scheduling

Suggests nearby hotels

Recommends departure time

Provides expected return time

Food Suggestions

Breakfast and dinner at stay (if available)

Suggests nearby restaurants after visiting places

Provides links for online ordering (Zomato, Swiggy)

Emergency Mode

Nearby hospitals

Police contacts

Emergency contacts

User Authentication

Secure login

OTP verification

Stores user preferences

Return Travel

Plans and books return journey

Tech Stack

Frontend

Next.js

React

TypeScript

Backend

FastAPI (Python)

Integrations

Maps API

Weather API

Ride Booking APIs

Food Delivery APIs

Project Structure

frontend → UI (Next.js)
backend → API and logic (FastAPI)
docs → documentation

How to Run

Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend
cd frontend
npm install
npm run dev

Future Enhancements

Better AI recommendations

Voice assistant

Full booking automation

Multi-language support