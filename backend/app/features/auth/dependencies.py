import urllib.parse
import uuid
from typing import Generator, Annotated

from jose import jwt
from jose.exceptions import JWTError
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyCookie
from pydantic import ValidationError
from sqlmodel import Session, select

from app.features.auth.models import TokenPayload
from app.features.organizations.models import Client
from app.features.auth.schemas import User
from app.core.config import settings
from app.core.database import get_db

cookie_scheme = APIKeyCookie(name="access_token")
TokenDep = Annotated[str, Depends(cookie_scheme)]


def get_current_user(
    token: TokenDep,
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid credentials",
        )

    try:
        user_id = uuid.UUID(token_data.sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid token subject")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


async def validate_widget_request(request: Request, db: Session = Depends(get_db)) -> Client:
    client_id = request.headers.get("X-Client-ID")
    origin = request.headers.get("Origin")

    if not client_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing X-Client-ID header")
    if not origin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing Origin header")

    # Clean origin to get domain without protocol
    try:
        parsed_origin = urllib.parse.urlparse(origin)
        domain = parsed_origin.netloc if parsed_origin.netloc else parsed_origin.path
    except Exception:
        domain = origin

    stmt = select(Client).where(Client.public_id == client_id)
    client = db.exec(stmt).first()

    if not client or not client.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or inactive client ID")

    allowed_domains_list = [d.strip() for d in client.allowed_domains.split(",")]
    if domain not in allowed_domains_list:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Origin not allowed")

    return client
