from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel

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
