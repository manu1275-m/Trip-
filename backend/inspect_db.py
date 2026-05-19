import asyncio
import json
from app.database.fluxbase import fluxbase_client

async def inspect_db():
    print("--- Trips ---")
    trips = await fluxbase_client.execute_sql("SELECT id FROM agentic_trips")
    print(f"Total trips found: {len(trips)}")
    for row in trips:
        print(f"Trip ID: {row['id']}")
    
    print("\n--- Detailed Trip Info for trip_07e84b48fe5e4bdc94 ---")
    rows = await fluxbase_client.execute_sql("SELECT data FROM agentic_trips WHERE id = 'trip_07e84b48fe5e4bdc94'")
    if rows:
        data = json.loads(rows[0]['data']) if isinstance(rows[0]['data'], str) else rows[0]['data']
        print(f"Bookings keys: {list(data.get('bookings', {}).keys())}")
        for k, v in data.get('bookings', {}).items():
            print(f"  - {k}: {v}")
    else:
        print("Trip not found!")

if __name__ == "__main__":
    asyncio.run(inspect_db())
