from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.features.organizations.models import Client
from app.features.auth.dependencies import validate_widget_request
from app.services.chat import chat_service
from app.services.a11y_ai import a11y_ai_service
from app.services.stt import stt_service, SttServiceError

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
        from langfuse import get_client, propagate_attributes
        langfuse_client = get_client()

        with propagate_attributes(user_id=str(client.public_id), session_id=str(client.public_id)):
            with langfuse_client.start_as_current_observation(
                as_type="generation",
                name="stt-transcribe",
                model="whisper-approximation"
            ) as generation:
                
                result = stt_service.transcribe(
                    audio_bytes=content,
                    filename=filename,
                    content_type=content_type,
                    language_mode=language_mode,
                )
                
                estimated_seconds = max(1, len(content) / 3000)
                stt_cost = (estimated_seconds / 60) * 0.006

                generation.update(
                    output=result.text,
                    usage={
                        "input": int(estimated_seconds),
                        "output": 0,
                        "unit": "SECONDS",
                        "total_cost": stt_cost
                    }
                )
    except SttServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return SttTranscriptionResponse(
        text=result.text,
        provider=result.provider,
        detected_language=result.detected_language,
    )
