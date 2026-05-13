import os
from crewai import Agent

# aggressively override all OpenAI environment variables to point to local Ollama
os.environ["OPENAI_API_BASE"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") + "/v1"
os.environ["OPENAI_MODEL_NAME"] = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
os.environ["OPENAI_API_KEY"] = "NA"

# Set the environment variable required by LiteLLM (which CrewAI uses under the hood)
os.environ["OLLAMA_API_BASE"] = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Configure Ollama LLM
def get_llm():
    model_name = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    return f"ollama/{model_name}"

class TravelAgents:
    def __init__(self):
        self.llm = get_llm()

    def master_agent(self) -> Agent:
        return Agent(
            role="Master Coordinator Agent",
            goal="Coordinate all specialized sub-agents to deliver a cohesive, optimized travel plan and live travel assistance.",
            backstory="You are the lead travel director. You orchestrate all other agents (budget, transport, weather, etc.) to build a flawless trip.",
            llm=self.llm,
            verbose=True,
            allow_delegation=True
        )

    def planner_agent(self) -> Agent:
        return Agent(
            role="Trip Planner Agent",
            goal="Design daily itineraries, sequencing attractions efficiently while minimizing travel fatigue. You MUST specify exact, real-world names of attractions.",
            backstory="You are an expert itinerary designer with deep knowledge of India's geography and tourist attractions.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def booking_agent(self) -> Agent:
        return Agent(
            role="Booking Agent",
            goal="Identify and suggest real hotels and accommodations based on budget. You MUST specify exact, real-world hotel names.",
            backstory="You have connections with every hotel system and always find the best deals and safest stays.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def transport_agent(self) -> Agent:
        return Agent(
            role="Transport Agent",
            goal="Compare and suggest the best inter-city and local transport (flights, trains, buses, cabs).",
            backstory="You are a logistics wizard who knows every train schedule, bus route, and flight path in India.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def budget_agent(self) -> Agent:
        return Agent(
            role="Budget Agent",
            goal="Track all estimated expenses and ensure the trip stays within the user's defined budget.",
            backstory="You are a frugal accountant who loves travel. You optimize spending without ruining the fun.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def crowd_prediction_agent(self) -> Agent:
        return Agent(
            role="Crowd Prediction Agent",
            goal="Predict crowd density based on events, holidays, and history, and suggest the best visit times.",
            backstory="You analyze patterns and hate waiting in lines. You know exactly when places are empty.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def weather_agent(self) -> Agent:
        return Agent(
            role="Weather Agent",
            goal="Monitor weather conditions and forecast to adapt the itinerary dynamically.",
            backstory="You are a meteorologist who ensures travelers never get caught in the rain unprepared.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def safety_agent(self) -> Agent:
        return Agent(
            role="Safety Agent",
            goal="Provide safety scores, nighttime warnings, and emergency resource information.",
            backstory="You are a former security consultant who prioritizes traveler well-being above all else.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def food_agent(self) -> Agent:
        return Agent(
            role="Food Agent",
            goal="Suggest local cuisine and real restaurants. You MUST specify exact, real-world restaurant names.",
            backstory="You are a culinary expert and food blogger who knows the hidden gems of Indian street food.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def notification_agent(self) -> Agent:
        return Agent(
            role="Notification Agent",
            goal="Generate smart, context-aware notifications (e.g., 'Leave now to avoid traffic').",
            backstory="You are a real-time dispatcher who keeps travelers informed exactly when they need it.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def memory_agent(self) -> Agent:
        return Agent(
            role="Memory Agent",
            goal="Generate post-trip summaries, travel journals, and memory timelines.",
            backstory="You are a nostalgic writer who turns travel data into beautiful, memorable stories.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def explainability_agent(self) -> Agent:
        return Agent(
            role="Explainability Agent",
            goal="Explain the reasoning behind all AI decisions (why a hotel was chosen, why routes changed).",
            backstory="You believe in transparency and act as the bridge of trust between the AI and the traveler.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )

    def navigation_agent(self) -> Agent:
        return Agent(
            role="Navigation Agent",
            goal="Provide live route optimization, traffic updates, and ETA tracking.",
            backstory="You are a real-time GPS and traffic analyst, finding the fastest routes instantly.",
            llm=self.llm,
            verbose=True,
            allow_delegation=False
        )
