from typing import Any, Dict, List, Optional
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class FluxbaseClient:
    def __init__(self):
        self.base_url = settings.fluxbase_base_url
        self.api_key = settings.fluxbase_api_key
        self.project_id = settings.fluxbase_project_id
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    async def execute_sql(self, sql: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        if not self.api_key or not self.project_id:
            raise ValueError("Fluxbase credentials not configured.")

        url = f"{self.base_url}/api/execute-sql"
        payload = {
            "projectId": self.project_id,
            "query": sql,
            "params": params or []
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=self.headers, json=payload, timeout=30.0)
            response.raise_for_status()
            data = response.json()
            
            if not data.get("success"):
                error_msg = data.get('error')
                logger.error(f"Fluxbase query failed: {error_msg}")
                raise RuntimeError(f"Database error: {error_msg}")
                
            return data.get("result", {}).get("rows", [])

fluxbase_client = FluxbaseClient()
