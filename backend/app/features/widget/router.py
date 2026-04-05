from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.features.organizations.models import Client
from app.features.auth.dependencies import validate_widget_request
from app.services.chat import chat_service
from app.services.a11y_ai import a11y_ai_service

chat_router = APIRouter(tags=["chat", "a11y"])


class InteractiveElement(BaseModel):
    id: str
    label: str


class ChatMessage(BaseModel):
    role: str
    text: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    history: Optional[List[ChatMessage]] = Field(default_factory=list)
    page_text: str = Field(default="", max_length=5000)
    elements: str = Field(default="")
    page_url: Optional[str] = Field(default="")
    screen_label: Optional[str] = Field(default=None)
    screen_fingerprint: Optional[str] = Field(default=None)


class ActionPayload(BaseModel):
    type: str  # "click_element" | "navigate"
    element_id: Optional[str] = None
    url: Optional[str] = None


class ChatResponse(BaseModel):
    text: str
    action: Optional[Dict[str, Any]] = None


class A11yBrokenElement(BaseModel):
    id: str
    html: str

class A11yFixRequest(BaseModel):
    elements: List[A11yBrokenElement]

class A11yPatch(BaseModel):
    id: str
    attribute: str
    value: str

class A11ySimplifyRequest(BaseModel):
    text: str

class A11ySimplifyResponse(BaseModel):
    text: str


@chat_router.post("/v1/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    client: Client = Depends(validate_widget_request),
):
    """
    Main chat endpoint. Validates widget origin, retrieves context from Milvus,
    calls Qwen3, and returns a structured { text, action } response.
    """
    result = chat_service.chat(
        client_id=client.public_id,
        query=request.query,
        history=[m.model_dump() for m in request.history],
        page_text=request.page_text,
        elements=request.elements,
        page_url=request.page_url or "",
        screen_label=request.screen_label,
    )
    return ChatResponse(**result)


@chat_router.post("/v1/widget/a11y/fix", response_model=List[A11yPatch])
async def fix_a11y_markup(
    request: A11yFixRequest,
    client: Client = Depends(validate_widget_request),
):
    """
    Receives broken HTML snippets (missing alt, missing aria-labels),
    asks LLM for fixes, and returns a JSON patch array.
    """
    patches = a11y_ai_service.fix_markup([el.model_dump() for el in request.elements])
    return [A11yPatch(**p) for p in patches if "id" in p and "attribute" in p]


@chat_router.post("/v1/widget/a11y/simplify", response_model=A11ySimplifyResponse)
async def simplify_a11y_text(
    request: A11ySimplifyRequest,
    client: Client = Depends(validate_widget_request),
):
    """
    Rewrites complex text into Plain/B1 language for cognitive accessibility.
    """
    simplified = a11y_ai_service.simplify_text(request.text)
    return A11ySimplifyResponse(text=simplified)
