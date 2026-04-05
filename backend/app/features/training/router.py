from typing import Optional, List
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_db
from app.features.organizations.models import Client
from app.features.auth.dependencies import validate_widget_request, get_current_admin
from app.features.training.models import TrainedScreen
from app.services.chat import chat_service

training_router = APIRouter(tags=["training"])


# ─── Request/Response schemas ───────────────────────────────────────────────

class SaveScreenRequest(BaseModel):
    fingerprint: str
    label: str
    description: Optional[str] = None
    page_url: Optional[str] = ""

class AutoSaveRequest(BaseModel):
    fingerprint: str
    tokens: List[str]
    page_url: Optional[str] = ""

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


# ─── Endpoints ──────────────────────────────────────────────────────────────

@training_router.post("/match-screen", response_model=MatchScreenResponse)
def match_screen(
    body: MatchScreenRequest,
    client: Client = Depends(validate_widget_request),
    db: Session = Depends(get_db),
):
    """
    Called by the SDK on each agent loop or screen change.
    Returns the label if this fingerprint is trained.
    """
    screen = db.exec(
        select(TrainedScreen).where(
            TrainedScreen.client_id == client.public_id,
            TrainedScreen.fingerprint == body.fingerprint,
        )
    ).first()

    if screen:
        # Only return label if it's not a raw draft or if we want to show draft labels too
        return MatchScreenResponse(
            matched=True, 
            label=screen.label, 
            description=screen.description
        )
    return MatchScreenResponse(matched=False)


@training_router.post("/save-screen-context")
def save_screen_context(
    body: SaveScreenRequest,
    admin: dict = Depends(get_current_admin),
    client_id: str = None, # We need a way to pass client_id from admin UI or session
    db: Session = Depends(get_db),
):
    """
    Protected Admin endpoint: Saves/Updates a screen annotation.
    Note: Admin must provide/resolve the client_id they are training for.
    """
    # For now, we assume the admin passes the target client_id or we derive it
    # In a real dashboard, this would be the current organization's client_id
    target_client_id = admin.get("client_id") or "default_client" 

    existing = db.exec(
        select(TrainedScreen).where(
            TrainedScreen.client_id == target_client_id,
            TrainedScreen.fingerprint == body.fingerprint,
        )
    ).first()

    if existing:
        existing.label = body.label
        existing.description = body.description
        existing.is_draft = False
        db.add(existing)
    else:
        screen = TrainedScreen(
            client_id=target_client_id,
            fingerprint=body.fingerprint,
            label=body.label,
            description=body.description,
            is_draft=False,
            page_url=body.page_url or "",
        )
        db.add(screen)

    db.commit()
    return {"status": "success", "label": body.label}


@training_router.post("/auto-save")
def auto_save(
    body: AutoSaveRequest,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Experimental: Auto-saves a draft fingerprint while admin navigates.
    """
    target_client_id = admin.get("client_id") or "default_client"
    
    # Check if already exists
    existing = db.exec(
        select(TrainedScreen).where(
            TrainedScreen.client_id == target_client_id,
            TrainedScreen.fingerprint == body.fingerprint,
        )
    ).first()

    if not existing:
        screen = TrainedScreen(
            client_id=target_client_id,
            fingerprint=body.fingerprint,
            label=f"Auto-detected ({datetime.now().strftime('%H:%M:%S')})",
            is_draft=True,
            page_url=body.page_url or "",
        )
        db.add(screen)
        db.commit()
        return {"status": "created", "id": str(screen.id)}
    
    return {"status": "exists", "id": str(existing.id)}


@training_router.post("/suggest-name")
def suggest_name(
    body: SuggestNameRequest,
    admin: dict = Depends(get_current_admin),
):
    """
    Uses LLM to suggest a screen name based on button tokens.
    """
    tokens_str = ", ".join(body.tokens)
    prompt = f"Given these button/link labels from a web screen: [{tokens_str}]. Suggest a short, descriptive name for this screen (e.g. 'Payment Form', 'User Profile'). Return ONLY the name."
    
    # Use existing chat_service to call LLM
    suggestion = chat_service.call_llm([
        {"role": "system", "content": "You are a UX assistant naming web screens."},
        {"role": "user", "content": prompt}
    ])
    
    return {"suggestion": suggestion.strip().replace('"', '')}


@training_router.patch("/confirm/{screen_id}")
def confirm_screen(
    screen_id: str,
    body: ConfirmRequest,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Moderation: Confirms a draft and updates its label/description.
    """
    screen = db.get(TrainedScreen, screen_id)
    if not screen:
        raise HTTPException(status_code=404, detail="Screen not found")
        
    screen.label = body.label
    screen.description = body.description
    screen.is_draft = False
    db.add(screen)
    db.commit()
    
    return {"status": "confirmed", "label": screen.label}
