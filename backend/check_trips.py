import asyncio
import json
import os
from dotenv import load_dotenv

# We need to simulate how repository.py hits fluxbase
import httpx

async def main():
    load_dotenv()
    url = os.getenv("FLUXBASE_BASE_URL", "https://fluxbase.vercel.app")
    project_id = os.getenv("FLUXBASE_PROJECT_ID", "8825f9ccae8542f7")
    api_key = os.getenv("FLUXBASE_API_KEY", "fl_f794984637260ca1b38e1fc8071556b57512e33ffe540891")
    
    headers = {
        "x-project-id": project_id,
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }
    
    sql = "SELECT data FROM agentic_trips"
    payload = {"query": sql, "params": []}
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{url}/api/v1/sql", json=payload, headers=headers)
        data = resp.json()
        print(f"Status: {resp.status_code}")
        if data.get("rows"):
            print(f"Found {len(data['rows'])} trips.")
            for i, row in enumerate(data["rows"]):
                trip_data = row.get("data")
                if isinstance(trip_data, str):
                    trip_data = json.loads(trip_data)
                print(f"Trip {i}: {trip_data.get('trip_id')} for {trip_data.get('user_email')}")
        else:
            print("No trips found in agentic_trips.")

if __name__ == "__main__":
    asyncio.run(main())
