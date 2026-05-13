import asyncio
import httpx
import json

# Old Credentials
OLD_KEY = "fl_f794984637260ca1b38e1fc8071556b57512e33ffe540891"
OLD_PROJECT = "8825f9ccae8542f7"

# New Credentials
NEW_KEY = "fl_aa27e54c6638619fdf8e87611ef60a0674906181dd42d9c7"
NEW_PROJECT = "3c09e08e9cbb4c9e"

BASE_URL = "https://fluxbase.vercel.app"

COLLECTIONS = [
    "app_users", "app_otp_codes", "app_emergency_contacts", 
    "app_travelers", "agentic_trips", "app_bookings", "app_travel_logs"
]

async def execute_sql(base_url, api_key, project_id, sql, params=None):
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "projectId": project_id,
        "query": sql,
        "params": params or []
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{base_url}/api/execute-sql", headers=headers, json=payload, timeout=30.0)
        return response.json()

async def migrate():
    print("--- Starting Fluxbase Migration ---")
    
    for table in COLLECTIONS:
        print(f"Migrating table: {table}")
        
        # 1. Fetch data from OLD
        try:
            res_old = await execute_sql(BASE_URL, OLD_KEY, OLD_PROJECT, f"SELECT * FROM {table}")
            if not res_old.get("success"):
                print(f"  Error fetching from old {table}: {res_old.get('error')}")
                continue
            
            rows = res_old.get("result", {}).get("rows", [])
            print(f"  Found {len(rows)} rows.")
            
            # 2. Initialize table in NEW
            schema_sql = f"CREATE TABLE IF NOT EXISTS {table} (id VARCHAR(255) PRIMARY KEY, data JSON NOT NULL)"
            res_init = await execute_sql(BASE_URL, NEW_KEY, NEW_PROJECT, schema_sql)
            if not res_init.get("success"):
                print(f"  Error initializing new {table}: {res_init.get('error')}")
                continue

            # 3. Insert rows into NEW
            for row in rows:
                doc_id = row.get("id")
                data_json = row.get("data")
                if isinstance(data_json, dict):
                    data_json = json.dumps(data_json)
                
                # Use simple INSERT for migration
                insert_sql = f"INSERT INTO {table} (id, data) VALUES (?, ?)"
                res_insert = await execute_sql(BASE_URL, NEW_KEY, NEW_PROJECT, insert_sql, [doc_id, data_json])
                if not res_insert.get("success"):
                    # If it already exists, we might want to update or just skip
                    if "already exists" in res_insert.get("error", "").lower():
                        pass
                    else:
                        print(f"    Failed to insert row {doc_id}: {res_insert.get('error')}")
            
            print(f"  Finished {table}")
            
        except Exception as e:
            print(f"  Exception during {table} migration: {e}")

    print("--- Migration Completed ---")

if __name__ == "__main__":
    asyncio.run(migrate())
