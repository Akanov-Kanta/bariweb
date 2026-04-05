from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
import httpx
import logging
import uuid
import secrets
import base64

from app.features.organizations.models import Client
from app.features.auth.schemas import User
from app.features.auth.dependencies import get_current_user, get_db
from app.features.organizations.schemas import AdminKeyDisplay, AdminKeyStatus, ClientMetrics
from app.core.config import settings
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

org_router = APIRouter(tags=["organizations"])

class ClientRegisterRequest(BaseModel):
    name: str
    domains: str

async def trigger_rag_crawl(domains: str, client_id: str):
    domain_list = [d.strip() for d in domains.split(",") if d.strip()]
    if not domain_list:
        return
        
    target_url = domain_list[0]
    if not target_url.startswith("http"):
        # For localhost/127.0.0.1, default to http:// 
        if "localhost" in target_url or "127.0.0.1" in target_url:
            target_url = f"http://{target_url}"
        else:
            target_url = f"https://{target_url}"
        
    try:
        crawl_endpoint = f"{settings.RAG_API_URL.rstrip('/')}/crawl"
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                crawl_endpoint,
                json={"url": target_url},
                timeout=5.0
            )
            if resp.status_code not in (200, 202):
                logger.error(f"Failed to trigger RAG crawl: {resp.status_code} {resp.text}")
            else:
                logger.info(f"Triggered RAG pipeline for {target_url}")
    except Exception as e:
        logger.error(f"Failed to connect to RAG pipeline for domain {target_url}: {e}")

@org_router.post("/register")
async def register_client(
    client_in: ClientRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check for domain uniqueness
    stmt = select(Client).where(Client.allowed_domains == client_in.domains)
    existing = db.exec(stmt).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Domain {client_in.domains} is already registered")

    new_client = Client(
        name=client_in.name,
        allowed_domains=client_in.domains,
        owner_id=current_user.id
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    
    # Trigger RAG pipeline directly
    await trigger_rag_crawl(new_client.allowed_domains, str(new_client.public_id))
    
    script_snippet = f'<script src="https://widget.bariweb.org/bariweb.js" data-client-id="{new_client.public_id}"></script>'
    
    return {
        "client": new_client,
        "script_snippet": script_snippet
    }

@org_router.get("/my", response_model=list[Client])
def get_my_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.owner_id == current_user.id)
    clients = db.exec(stmt).all()
    return clients

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    domains: Optional[str] = None

@org_router.patch("/{client_id}")
def update_client(
    client_id: uuid.UUID,
    client_in: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    client = db.exec(stmt).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    if client_in.name is not None:
        client.name = client_in.name
    if client_in.domains is not None:
        client.allowed_domains = client_in.domains
    
    db.add(client)
    db.commit()
    db.refresh(client)
    return client

@org_router.delete("/{client_id}")
def delete_client(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    client = db.exec(stmt).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(client)
    db.commit()
    return {"status": "deleted"}

@org_router.post("/{client_id}/keys", response_model=AdminKeyDisplay)
def generate_admin_key(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    client = db.exec(stmt).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Generate secure 32-char key
    plain_key = secrets.token_urlsafe(32)
    # Hash and save
    client.admin_key_hash = get_password_hash(plain_key)
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return AdminKeyDisplay(plain_key=plain_key)

@org_router.get("/{client_id}/keys/status", response_model=AdminKeyStatus)
def get_admin_key_status(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    client = db.exec(stmt).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    return AdminKeyStatus(has_key=bool(client.admin_key_hash))

@org_router.get("/my/metrics", response_model=ClientMetrics)
async def get_my_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Client).where(Client.owner_id == current_user.id)
    clients = db.exec(stmt).all()
    
    total_cost = 0.0
    total_tokens = 0
    total_traces = 0
    details = []
    
    if not clients or not settings.LANGFUSE_PUBLIC_KEY:
        return ClientMetrics(totalCost=total_cost, totalTokens=total_tokens, totalTraces=total_traces, details=details)
        
    auth_str = base64.b64encode(f"{settings.LANGFUSE_PUBLIC_KEY}:{settings.LANGFUSE_SECRET_KEY}".encode()).decode()
    headers = {"Authorization": f"Basic {auth_str}"}

    async with httpx.AsyncClient() as http_client:
        async def fetch_client_metrics(client):
            client_cost = 0.0
            client_tokens = 0
            client_traces = 0
            try:
                resp = await http_client.get(
                    f"{settings.LANGFUSE_BASE_URL.rstrip('/')}/api/public/traces",
                    params={"userId": str(client.public_id), "page": 1, "limit": 100},
                    headers=headers,
                    timeout=5.0
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    client_traces = len(data)
                    for trace in data:
                        raw_cost = trace.get("totalCost") or 0.0
                        if raw_cost > 0.1:
                            trace_cost = raw_cost / 10000.0
                        else:
                            trace_cost = raw_cost
                        client_cost += trace_cost
                    
                    client_tokens = int(client_cost * 666666)
            except Exception as e:
                logger.warning(f"Failed to fetch metrics for client {client.public_id}: {e}")
            
            domain_label = client.allowed_domains.split(',')[0].strip() if client.allowed_domains else "Unset Domain"
            return {
                "domain": domain_label,
                "tokens": client_tokens,
                "cost": client_cost,
                "traces": client_traces
            }

        tasks = [fetch_client_metrics(client) for client in clients]
        results = await asyncio.gather(*tasks)

        for res in results:
            total_cost += res["cost"]
            total_tokens += res["tokens"]
            total_traces += res["traces"]
            details.append(res)

    return ClientMetrics(totalCost=total_cost, totalTokens=total_tokens, totalTraces=total_traces, details=details)
