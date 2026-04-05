import httpx
import asyncio
from app.core.config import settings
import base64

async def test():
    auth = base64.b64encode(f"{settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}".encode()).decode()
    headers = {"Authorization": f"Basic {auth}"}
    
    async with httpx.AsyncClient() as client:
        # Try fetching project stats or metrics
        resp = await client.get(f"{settings.LANGFUSE_BASE_URL}/api/public/metrics/daily", headers=headers)
        if resp.status_code == 404:
            resp = await client.get(f"{settings.LANGFUSE_BASE_URL}/api/public/projects", headers=headers)
        print("Status:", resp.status_code)
        print("Data:", resp.text[:1000])

import sys
import os
sys.path.append(os.getcwd())
asyncio.run(test())
