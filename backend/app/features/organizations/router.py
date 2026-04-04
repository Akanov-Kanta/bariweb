from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
import uuid

from app.features.organizations.models import Client
from app.features.auth.schemas import User
from app.features.auth.dependencies import get_current_user, get_db

org_router = APIRouter(tags=["organizations"])

class ClientRegisterRequest(BaseModel):
    name: str
    domains: str

@org_router.post("/register")
def register_client(
    client_in: ClientRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_client = Client(
        name=client_in.name,
        allowed_domains=client_in.domains,
        owner_id=current_user.id
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    
    script_snippet = f'<script src="https://widget.bariweb.org/bariweb.js" data-client-id="{new_client.public_id}"></script>'
    
    return {
        "client": new_client,
        "script_snippet": script_snippet
    }

@org_router.get("/my")
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
