from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.features.organizations.models import Client
from app.features.auth.dependencies import validate_widget_request
from app.services.chat import chat_service

chat_router = APIRouter(tags=["chat"])


class InteractiveElement(BaseModel):
    id: str
    label: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    page_text: str = Field(default="", max_length=5000)
    elements: List[InteractiveElement] = Field(default_factory=list)
    page_url: Optional[str] = Field(default="")


class ActionPayload(BaseModel):
    type: str  # "click_element" | "navigate"
    element_id: Optional[str] = None
    url: Optional[str] = None


class ChatResponse(BaseModel):
    text: str
    action: Optional[Dict[str, Any]] = None


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
        query=request.query,
        page_text=request.page_text,
        elements=[el.model_dump() for el in request.elements],
        page_url=request.page_url or "",
    )
    return ChatResponse(**result)
