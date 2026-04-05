import httpx
import asyncio
from app.core.config import settings
import base64

async def test():
    auth = base64.b64encode(f"{settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}".encode()).decode()
    headers = {"Authorization": f"Basic {auth}"}
    
    async with httpx.AsyncClient() as http_client:
        try:
            resp = await http_client.get(
                f"{settings.LANGFUSE_BASE_URL.rstrip('/')}/api/public/traces?page=1&limit=100",
                headers=headers,
                timeout=5.0
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                users_cost = {}
                for t in data:
                    uid = t.get("userId")
                    cost = t.get("totalCost") or 0.0
                    users_cost[uid] = users_cost.get(uid, 0) + cost
                print("Aggregated cost by user:", users_cost)
            else:
                print("Error:", resp.text)
        except Exception as e:
            print("Error:", e)

import sys
import os
sys.path.append(os.getcwd())
asyncio.run(test())
