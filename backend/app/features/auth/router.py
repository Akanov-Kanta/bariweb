from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import timedelta
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.features.auth.models import UserCreate, UserRead, Token, UserLogin
from app.features.auth.schemas import User
from app.features.auth.dependencies import get_db, get_current_user
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash

auth_router = APIRouter(tags=["auth"])


@auth_router.post("/login", response_model=Token)
def login(
    user_in: UserLogin, 
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

    return {"access_token": access_token, "token_type": "bearer"}


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
def logout():
    response = JSONResponse(content={"detail": "Successfully logged out"})
    # Ensure cookie name matches what frontend might use
    response.delete_cookie("access_token")
    return response


@auth_router.get("/verify", response_model=UserRead)
def verify_token(current_user: User = Depends(get_current_user)):
    return current_user

