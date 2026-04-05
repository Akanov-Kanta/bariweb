from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlmodel import Session, select
from datetime import timedelta
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.features.auth.models import UserCreate, UserRead, Token, UserLogin
from app.features.auth.schemas import User
from app.features.auth.dependencies import get_db, get_current_user, get_current_admin
from app.core.config import settings
# Use the correct internal security module
from app.core.security import verify_password, create_access_token, get_password_hash
from app.features.organizations.models import Client

auth_router = APIRouter(tags=["auth"])

class AdminKeyLoginRequest(BaseModel):
    client_public_id: str
    admin_key: str


@auth_router.post("/login")
def login(
    user_in: UserLogin, 
    response: Response,
    db: Session = Depends(get_db),
):
    stmt = select(User).where(User.email == user_in.email)
    user = db.exec(stmt).first()

    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        path="/",
        secure=settings.ENVIRONMENT != 'local',
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {"detail": "Login successful", "user": UserRead.model_validate(user)}


@auth_router.post("/login/widget")
def widget_login(
    body: AdminKeyLoginRequest,
    db: Session = Depends(get_db),
):
    """
    Login for the Bariweb Widget using an Admin Key.
    Verifies the key against the organizations admin_key_hash.
    """
    import logging
    log = logging.getLogger(__name__)
    log.warning(f"[WIDGET LOGIN DEBUG] client_public_id received: '{body.client_public_id}'")

    # 1. Find client
    client = db.exec(select(Client).where(Client.public_id == body.client_public_id)).first()
    
    log.warning(f"[WIDGET LOGIN DEBUG] client found: {client}")
    if client:
        log.warning(f"[WIDGET LOGIN DEBUG] client.id={client.id}, client.public_id='{client.public_id}', has_hash={bool(client.admin_key_hash)}")
    
    if not client:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    if not client.admin_key_hash:
        raise HTTPException(status_code=400, detail="Admin key not set for this organization")

    # 2. Verify key
    if not verify_password(body.admin_key, client.admin_key_hash):
        raise HTTPException(status_code=401, detail="Invalid admin key")

    # 3. Create Token (scoped to this client)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": f"admin_{client.public_id}", "role": "admin", "client_id": client.public_id},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "client_id": client.public_id
    }


@auth_router.get("/login/widget/verify")
def verify_widget_token(
    db: Session = Depends(get_db),
    token_data: dict = Depends(get_current_admin),
):
    """
    Verifies that a widget admin Bearer token is still valid.
    Used by the widget on page reload to restore admin session without re-login.
    Returns 200 OK with client_id if valid, 401 if not.
    """
    return {"valid": True, "client_id": token_data.get("client_id")}


@auth_router.get("/users/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@auth_router.post("/users/", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    user = db.exec(stmt).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@auth_router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=settings.ENVIRONMENT != 'local',
        samesite="lax",
    )
    return {"detail": "Successfully logged out"}


@auth_router.get("/verify", response_model=UserRead)
def verify_token(current_user: User = Depends(get_current_user)):
    return current_user


@auth_router.get("/status", response_model=UserRead)
def get_status(current_user: User = Depends(get_current_user)):
    """Keep /status for compatibility with SDK calls if needed"""
    return current_user
