from fastapi import APIRouter, Query, HTTPException
import httpx
import os
import logging
from dotenv import load_dotenv

router = APIRouter(prefix="/images", tags=["images"])
logger = logging.getLogger("app.images")

@router.get("/search")
async def search_image(query: str = Query(...)):
    # Ensure environment variables are loaded
    load_dotenv()
    api_key = os.getenv("PEXELS_API_KEY", "").strip()
    
    # Generic high-quality travel fallback
    fallback_url = "https://images.pexels.com/photos/1007427/pexels-photo-1007427.jpeg?auto=compress&cs=tinysrgb&w=800"
    
    if not api_key:
        logger.error("Pexels API Key missing in environment.")
        return {"url": fallback_url}
    
    async def fetch_photo(q: str):
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": api_key}
                resp = await client.get(
                    "https://api.pexels.com/v1/search",
                    params={"query": q, "per_page": 1},
                    headers=headers,
                    timeout=8.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    photos = data.get("photos", [])
                    if photos:
                        return photos[0]["src"]["large"]
                else:
                    logger.error(f"Pexels API Error {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Pexels connection error: {e}")
        return None

    # 1. Try full destination search
    url = await fetch_photo(query)
    
    # 2. Broaden search if specific destination fails
    if not url and " " in query:
        # Try just the first part of the name (e.g., "Hadimba Temple")
        simple_name = " ".join(query.split()[:2])
        url = await fetch_photo(simple_name)
        
    if url:
        return {"url": url}
        
    return {"url": fallback_url}
