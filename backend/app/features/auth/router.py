from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.features.auth.security import create_access_token
from app.features.auth.dependencies import get_current_admin

auth_router = APIRouter(tags=["auth"])

class LoginRequest(BaseModel):
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@auth_router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    """
    Simple Admin Login: validates against ADMIN_PASSWORD from settings.
    """
    if body.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin password",
        )
    
    access_token = create_access_token(
        data={"sub": "admin", "role": "admin"}
    )
    return LoginResponse(access_token=access_token)

@auth_router.get("/status")
async def get_status(current_admin: dict = Depends(get_current_admin)):
    """
    Used by the widget to check if the user is a logged-in admin.
    """
    return {"is_admin": True, "role": current_admin.get("role")}
