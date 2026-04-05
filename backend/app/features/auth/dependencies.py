import logging
import urllib.parse
import uuid
from typing import Generator, Annotated

logger = logging.getLogger(__name__)


from jose import jwt
from jose.exceptions import JWTError
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyCookie, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import ValidationError
from sqlmodel import Session, select

from app.features.auth.security import decode_access_token

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
        logger.warning(f"BariWeb Auth: Missing X-Client-ID header from {origin}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing X-Client-ID header")
    if not origin:
        logger.warning(f"BariWeb Auth: Missing Origin header for client {client_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing Origin header")

    # Clean origin to get domain without protocol
    try:
        parsed_origin = urllib.parse.urlparse(origin)
        domain = parsed_origin.netloc if parsed_origin.netloc else parsed_origin.path
    except Exception:
        domain = origin

    stmt = select(Client).where(Client.public_id == client_id)
    client = db.exec(stmt).first()

    if not client:
        logger.warning(f"BariWeb Auth: Client ID '{client_id}' not found in database. Origin: {domain}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Client ID '{client_id}' not found")
    if not client.is_active:
        logger.warning(f"BariWeb Auth: Client account '{client_id}' is inactive. Origin: {domain}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client account is inactive")

    # Normalize allowed domains to netloc for comparison
    allowed_list = []
    for d in client.allowed_domains.split(","):
        d = d.strip()
        if not d: continue
        if "://" not in d:
            d = f"http://{d}"
        try:
            allowed_list.append(urllib.parse.urlparse(d).netloc)
        except Exception:
            allowed_list.append(d)

    if domain not in allowed_list:
        logger.warning(f"BariWeb Auth: Origin '{domain}' not in {allowed_list} for client '{client_id}'")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Origin '{domain}' not authorized")

    return client

security_scheme = HTTPBearer()

def get_current_admin(token: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)]) -> dict:
    """
    Dependency to validate the Admin JWT token from the Authorization header.
    Used by the widget admin flow.
    """
    payload = decode_access_token(token.credentials)
    if not payload or payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate admin credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_current_user_as_admin(
    token: TokenDep,
    db: Session = Depends(get_db),
) -> dict:
    """
    Dashboard dependency: authenticates via cookie session (same as get_current_user),
    then resolves the user's primary client and returns an admin-like payload.
    This lets dashboard pages call training endpoints without a separate widget token.
    """
    from jose import jwt as jose_jwt
    from jose.exceptions import JWTError
    try:
        payload = jose_jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=403, detail="Invalid session token")
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(status_code=403, detail="Invalid session token")

    # Get user's primary client
    client = db.exec(
        select(Client).where(Client.owner_id == user_id)
    ).first()

    if not client:
        raise HTTPException(status_code=404, detail="No client found for this account")

    return {
        "sub": str(user_id),
        "role": "admin",
        "client_id": client.public_id,
    }
