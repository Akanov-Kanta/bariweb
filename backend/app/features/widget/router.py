from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.features.organizations.models import Client
from app.features.auth.dependencies import validate_widget_request
from app.services.chat import chat_service
from app.services.stt import stt_service, SttServiceError

chat_router = APIRouter(tags=["chat"])


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


class SttTranscriptionResponse(BaseModel):
    text: str
    provider: Literal["kz", "generic"]
    detected_language: Optional[str] = None


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


@chat_router.post("/v1/stt/transcribe", response_model=SttTranscriptionResponse)
async def transcribe_audio(
    language_mode: Literal["auto", "kz", "ru", "en"] = Form(...),
    audio: UploadFile = File(...),
    client: Client = Depends(validate_widget_request),
):
    """
    STT endpoint for widget voice input.
    Validates widget origin/client via existing auth dependency.
    """
    _ = client  # consumed by dependency; silence linter

    if not audio:
        raise HTTPException(status_code=400, detail="Missing audio file.")

    content = await audio.read()
    if not content:
        raise HTTPException(status_code=400, detail="Audio file is empty.")

    filename = audio.filename or "speech.webm"
    content_type = audio.content_type or "audio/webm"

    try:
        result = stt_service.transcribe(
            audio_bytes=content,
            filename=filename,
            content_type=content_type,
            language_mode=language_mode,
        )
    except SttServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return SttTranscriptionResponse(
        text=result.text,
        provider=result.provider,
        detected_language=result.detected_language,
    )
