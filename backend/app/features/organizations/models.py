import secrets
import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

def generate_public_id():
    return secrets.token_urlsafe(6)

class Client(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False
    )
    public_id: str = Field(default_factory=generate_public_id, unique=True, index=True)
    name: str
    allowed_domains: str
    owner_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
