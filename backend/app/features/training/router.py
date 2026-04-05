"""
Training Router — Passive Discovery + Dashboard Moderation

Widget endpoints (Bearer admin token):
  POST /discover           — Passive auto-discovery from Watcher.
  GET  /screens            — List screens for widget admin.
  POST /match-screen       — Public: match fingerprint for chat context.
  POST /suggest-name       — AI screen name suggestion.
  PATCH /confirm/{id}      — Confirm draft + index to Milvus.

Dashboard endpoints (Cookie session auth):
  GET  /dashboard/clients  — All clients owned by this user (for domain filter).
  GET  /dashboard/screens  — Screens for a specific client (or first if not specified).
  PATCH /dashboard/confirm/{id} — Confirm draft + index to Milvus.
"""
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_db
from app.features.organizations.models import Client
from app.features.auth.dependencies import (
    validate_widget_request,
    get_current_admin,
    get_current_user_as_admin,
)
from app.features.training.models import TrainedScreen
from app.services.chat import chat_service
from app.services.screen_index import index_screen

logger = logging.getLogger(__name__)

training_router = APIRouter(tags=["training"])


# ─── Schemas ────────────────────────────────────────────────────────────────

class DiscoverRequest(BaseModel):
    fingerprint: str
    tokens: List[str] = []
    page_url: Optional[str] = ""

class DiscoverResponse(BaseModel):
    status: str         # "existing" | "created"
    is_trained: bool
    label: Optional[str] = None
    description: Optional[str] = None

class MatchScreenRequest(BaseModel):
    fingerprint: str

class MatchScreenResponse(BaseModel):
    matched: bool
    label: Optional[str] = None
    description: Optional[str] = None

class SuggestNameRequest(BaseModel):
    tokens: List[str]

class ConfirmRequest(BaseModel):
    label: str
    description: Optional[str] = None


# ─── Shared helpers ──────────────────────────────────────────────────────────

def _serialize_screen(s: TrainedScreen) -> dict:
    return {
        "id": str(s.id),
        "fingerprint": s.fingerprint,
        "label": s.label,
        "description": s.description,
        "is_draft": s.is_draft,
        "page_url": s.page_url,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _list_screens(client_id: str, is_draft: Optional[bool], db: Session) -> List[dict]:
    query = select(TrainedScreen).where(TrainedScreen.client_id == client_id)
    if is_draft is not None:
        query = query.where(TrainedScreen.is_draft == is_draft)
    query = query.order_by(TrainedScreen.created_at.desc())  # type: ignore
    return [_serialize_screen(s) for s in db.exec(query).all()]


def _do_confirm(screen: TrainedScreen, body: ConfirmRequest, db: Session, background: BackgroundTasks):
    screen.label = body.label
    screen.description = body.description
    screen.is_draft = False
    db.add(screen)
    db.commit()

    # Background Milvus indexing — non-blocking
    screen_id = str(screen.id)
    background.add_task(
        index_screen,
        screen_id=screen_id,
        client_id=screen.client_id,
        fingerprint=screen.fingerprint,
        label=screen.label,
        description=screen.description,
        page_url=screen.page_url or "",
    )
    logger.info(f"Screen '{screen.label}' confirmed — queued for Milvus indexing")


# ─── Passive Discovery (Widget Bearer) ──────────────────────────────────────

@training_router.post("/discover", response_model=DiscoverResponse)
def discover_screen(
    body: DiscoverRequest,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Called by BariwebWatcher on every screen change.
    Creates a draft if fingerprint is new, returns existing data if known.
    """
    client_id = admin.get("client_id") or ""
    if not client_id:
        raise HTTPException(status_code=400, detail="No client_id in token")

    existing = db.exec(
        select(TrainedScreen).where(
            TrainedScreen.client_id == client_id,
            TrainedScreen.fingerprint == body.fingerprint,
        )
    ).first()

    if existing:
        return DiscoverResponse(
            status="existing",
            is_trained=not existing.is_draft,
            label=existing.label,
            description=existing.description,
        )

    # Build a readable auto-label from tokens and URL
    auto_label = "Auto-detected"
    if body.page_url:
        path = body.page_url.rstrip("/").split("/")[-1]
        if path:
            auto_label = f"Auto: /{path}"
    if body.tokens:
        hints = [t for t in body.tokens if len(t) > 2][:3]
        if hints:
            auto_label = f"Auto: {' · '.join(hints)}"

    screen = TrainedScreen(
        client_id=client_id,
        fingerprint=body.fingerprint,
        label=auto_label,
        is_draft=True,
        page_url=body.page_url or "",
    )
    db.add(screen)
    db.commit()
    db.refresh(screen)

    logger.info(f"Discovery: created draft '{auto_label}' for client={client_id}")

    return DiscoverResponse(
        status="created",
        is_trained=False,
        label=auto_label,
        description=None,
    )


@training_router.get("/screens")
def list_screens_bearer(
    is_draft: Optional[bool] = None,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Widget admin Bearer token: list screens."""
    return _list_screens(admin.get("client_id", ""), is_draft, db)


@training_router.patch("/confirm/{screen_id}")
def confirm_screen_bearer(
    screen_id: str,
    body: ConfirmRequest,
    background: BackgroundTasks,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Widget admin Bearer token: confirm a draft + index to Milvus."""
    screen = db.get(TrainedScreen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
    _do_confirm(screen, body, db, background)
    return {"status": "confirmed", "label": screen.label}


# ─── Public match (used by chat agent for current-page context) ──────────────

@training_router.post("/match-screen", response_model=MatchScreenResponse)
def match_screen(
    body: MatchScreenRequest,
    client: Client = Depends(validate_widget_request),
    db: Session = Depends(get_db),
):
    """Public: match fingerprint for user-facing chat context. Only returns confirmed screens."""
    screen = db.exec(
        select(TrainedScreen).where(
            TrainedScreen.client_id == client.public_id,
            TrainedScreen.fingerprint == body.fingerprint,
            TrainedScreen.is_draft == False,
        )
    ).first()

    if screen:
        return MatchScreenResponse(matched=True, label=screen.label, description=screen.description)
    return MatchScreenResponse(matched=False)


# ─── AI suggest name ─────────────────────────────────────────────────────────

@training_router.post("/suggest-name")
def suggest_name(
    body: SuggestNameRequest,
    admin: dict = Depends(get_current_admin),
):
    tokens_str = ", ".join(body.tokens)
    prompt = (
        f"Given these button/link labels from a web screen: [{tokens_str}]. "
        "Suggest a short, descriptive name (e.g. 'Payment Form', 'User Profile'). Return ONLY the name."
    )
    suggestion = chat_service.call_llm([
        {"role": "system", "content": "You are a UX assistant naming web screens."},
        {"role": "user", "content": prompt},
    ])
    return {"suggestion": suggestion.strip().replace('"', '')}


# ─── Dashboard endpoints (Cookie session auth) ────────────────────────────────

@training_router.get("/dashboard/clients")
def dashboard_get_clients(
    user_admin: dict = Depends(get_current_user_as_admin),
    db: Session = Depends(get_db),
):
    """
    Returns all clients owned by this dashboard user.
    Used by the Training page to build the domain selector.
    """
    import uuid as _uuid
    user_id = _uuid.UUID(user_admin["sub"])
    clients = db.exec(
        select(Client).where(Client.owner_id == user_id)
    ).all()
    return [
        {"id": str(c.id), "public_id": c.public_id, "name": c.name, "allowed_domains": c.allowed_domains}
        for c in clients
    ]


@training_router.get("/dashboard/screens")
def dashboard_list_screens(
    client_public_id: Optional[str] = None,
    is_draft: Optional[bool] = None,
    user_admin: dict = Depends(get_current_user_as_admin),
    db: Session = Depends(get_db),
):
    """
    Dashboard: list screens for a specific client (by public_id).
    If client_public_id not given, uses the primary client from the session.
    """
    if client_public_id:
        # Verify ownership
        import uuid as _uuid
        user_id = _uuid.UUID(user_admin["sub"])
        client = db.exec(
            select(Client).where(
                Client.public_id == client_public_id,
                Client.owner_id == user_id,
            )
        ).first()
        if not client:
            raise HTTPException(status_code=403, detail="Access denied to this client")
        target_id = client_public_id
    else:
        target_id = user_admin.get("client_id", "")

    return _list_screens(target_id, is_draft, db)


@training_router.patch("/dashboard/confirm/{screen_id}")
def dashboard_confirm_screen(
    screen_id: str,
    body: ConfirmRequest,
    background: BackgroundTasks,
    user_admin: dict = Depends(get_current_user_as_admin),
    db: Session = Depends(get_db),
):
    """Dashboard: confirm a draft + index to Milvus."""
    import uuid as _uuid
    user_id = _uuid.UUID(user_admin["sub"])

    screen = db.get(TrainedScreen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")

    # Verify the screen belongs to one of this user's clients
    client = db.exec(
        select(Client).where(
            Client.public_id == screen.client_id,
            Client.owner_id == user_id,
        )
    ).first()
    if not client:
        raise HTTPException(status_code=403, detail="Access denied")

    _do_confirm(screen, body, db, background)
    return {"status": "confirmed", "label": screen.label}
