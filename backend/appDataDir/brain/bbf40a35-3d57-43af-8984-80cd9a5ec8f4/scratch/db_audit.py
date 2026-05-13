import asyncio
import os
import json
from dotenv import load_dotenv
from app.database.fluxbase import fluxbase_client

async def audit_database():
    load_dotenv()
    
    # Required collections as defined in repository.py
    REQUIRED = [
        "app_users", "app_otp_codes", "app_emergency_contacts", 
        "app_travelers", "agentic_trips", "app_bookings", "app_travel_logs"
    ]
    
    print("--- Database Audit Started ---")
    try:
        # Get existing tables
        tables_query = "SHOW TABLES"
        rows = await fluxbase_client.execute_sql(tables_query)
        
        # Extract table names (MySQL returns them in a column named 'Tables_in_{db_name}')
        existing_tables = []
        for row in rows:
            # Fluxbase might return a different key, so we take the first value
            table_name = list(row.values())[0]
            existing_tables.append(table_name)
            
        print(f"Current Tables: {existing_tables}")
        
        to_remove = [t for t in existing_tables if t not in REQUIRED]
        
        if not to_remove:
            print("Audit Complete: No unwanted tables found. All current tables are required.")
        else:
            print(f"Found unwanted tables: {to_remove}")
            for table in to_remove:
                print(f"Removing table: {table}...")
                await fluxbase_client.execute_sql(f"DROP TABLE {table}")
            print("Audit Complete: Unwanted tables removed.")
            
    except Exception as e:
        print(f"Audit Failed: {e}")

if __name__ == "__main__":
    asyncio.run(audit_database())
