"""
Auth security utilities for admin JWT tokens.
Uses the SAME key and library as app.core.security to ensure
tokens created by /auth/login/widget can be decoded here.
"""
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, Union
from app.core.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Union[dict, None]:
    """
    Decodes a JWT access token. Returns the payload or None if invalid.
    Must use the same SECRET_KEY and algorithm as create_access_token in core.security.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except (JWTError, Exception):
        return None
