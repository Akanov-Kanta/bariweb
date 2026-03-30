import uuid
from typing import Optional, Any
from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    email: str


class UserCreate(UserBase):
    password: str


class UserLogin(UserBase):
    password: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # user_id
    exp: Optional[int] = None  # UNIX timestamp


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime

