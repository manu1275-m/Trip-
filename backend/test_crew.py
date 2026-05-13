import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.agents.crew_orchestrator import TripOrchestrator

def main():
    print("Initializing Orchestrator...")
    orchestrator = TripOrchestrator()
    print("Starting plan_trip...")
    try:
        result = orchestrator.plan_trip({"destination": "Kerala", "days": 1})
        print("Success! Result length:", len(str(result)))
        print(str(result)[:200])
    except Exception as e:
        print("ERROR OCCURRED:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
