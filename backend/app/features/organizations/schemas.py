import uuid
from pydantic import BaseModel
from typing import Optional

class ClientBase(BaseModel):
    name: str
    allowed_domains: str

class ClientCreate(ClientBase):
    pass

class ClientRead(ClientBase):
    id: uuid.UUID
    public_id: str
    is_active: bool
    has_admin_key: bool

class AdminKeyDisplay(BaseModel):
    plain_key: str
    message: str = "Copy this key now. It will not be shown again for security reasons."

class AdminKeyStatus(BaseModel):
    has_key: bool
