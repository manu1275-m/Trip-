import asyncio
import json
import logging
from app.database.repository import repo, COLLECTIONS
from app.database.fluxbase import fluxbase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def sync_existing_bookings():
    logger.info("Starting sync of existing bookings from trips to app_bookings collection...")
    
    # 1. Initialize schema
    await repo.initialize_schema()
    
    # 2. Get all trips
    # Since we don't have a list_all_trips, we'll fetch all rows from agentic_trips directly
    sql = "SELECT data FROM agentic_trips"
    rows = await fluxbase_client.execute_sql(sql)
    
    logger.info(f"Found {len(rows)} trips to process.")
    
    count = 0
    for row in rows:
        data = json.loads(row.get("data")) if isinstance(row.get("data"), str) else row.get("data")
        if not data:
            continue
            
        email = data.get("user_email")
        trip_id = data.get("id")
        bookings = data.get("bookings", {})
        
        if not email or not bookings:
            continue
            
        for key, b in bookings.items():
            # Construct a booking document
            booking_doc = {
                "trip_id": trip_id,
                "user_email": email,
                "pnr": b.get("pnr"),
                "type": b.get("type"),
                "item_name": b.get("item_name", key),
                "total_price": b.get("price", 0),
                "status": b.get("status", "confirmed"),
                "created_at": b.get("confirmed_at") or data.get("created_at"),
                "synced": True
            }
            
            # Check if already exists in app_bookings to avoid duplicates
            # (Simple heuristic: check for PNR)
            existing = await repo._find_one("app_bookings", {"pnr": b.get("pnr"), "user_email": email})
            if not existing:
                await repo.save_booking(email, booking_doc)
                count += 1
                logger.info(f"Synced booking {b.get('pnr')} for {email}")
    
    logger.info(f"Sync complete. {count} bookings pushed to app_bookings database.")

if __name__ == "__main__":
    asyncio.run(sync_existing_bookings())
