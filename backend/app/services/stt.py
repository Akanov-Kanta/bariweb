import logging
from dataclasses import dataclass
from typing import Literal, Optional

import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

LanguageMode = Literal["auto", "kz", "ru", "en"]
ProviderName = Literal["kz", "generic"]


@dataclass
class SttResult:
    text: str
    provider: ProviderName
    detected_language: Optional[str] = None


class SttServiceError(Exception):
    def __init__(self, detail: str, status_code: int = 502):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


class SttService:
    def __init__(self) -> None:
        self.base_url = settings.STT_BASE_URL.rstrip("/")
        self.timeout = 45
        self.max_audio_bytes = 10 * 1024 * 1024  # 10 MB

    def transcribe(
        self,
        *,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language_mode: LanguageMode,
    ) -> SttResult:
        if not audio_bytes:
            raise SttServiceError("Audio file is empty.", status_code=400)
        if len(audio_bytes) > self.max_audio_bytes:
            raise SttServiceError("Audio file is too large (max 10MB).", status_code=413)

        if language_mode == "kz":
            return self._transcribe_kz(
                audio_bytes=audio_bytes,
                filename=filename,
                content_type=content_type,
            )
        return self._transcribe_generic(
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language_mode=language_mode,
        )

    def _transcribe_kz(self, *, audio_bytes: bytes, filename: str, content_type: str) -> SttResult:
        api_key = settings.SPEACH_TO_TEXT_KZ_API_KEY or settings.SPEECH_TO_TEXT_KZ_API_KEY
        if not api_key:
            raise SttServiceError("KZ STT API key is not configured.", status_code=500)

        data = self._request_stt(
            api_key=api_key,
            model="speech-to-text-kk",
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language=None,
        )
        return self._normalize_result(data, provider="kz")

    def _transcribe_generic(
        self,
        *,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language_mode: LanguageMode,
    ) -> SttResult:
        api_key = settings.SPEACH_TO_TEXT_API_KEY or settings.SPEECH_TO_TEXT_API_KEY
        if not api_key:
            raise SttServiceError("Generic STT API key is not configured.", status_code=500)

        language_hint = language_mode if language_mode in ("ru", "en") else None
        data = self._request_stt(
            api_key=api_key,
            model="speech-to-text",
            audio_bytes=audio_bytes,
            filename=filename,
            content_type=content_type,
            language=language_hint,
        )
        return self._normalize_result(data, provider="generic")

    def _request_stt(
        self,
        *,
        api_key: str,
        model: str,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
        language: Optional[str],
    ) -> dict:
        url = f"{self.base_url}/audio/transcriptions"
        form_data = {"model": model}
        if language:
            form_data["language"] = language

        files = {
            "file": (filename, audio_bytes, content_type or "application/octet-stream"),
        }
        headers = {"Authorization": f"Bearer {api_key}"}

        try:
            resp = requests.post(
                url,
                headers=headers,
                data=form_data,
                files=files,
                timeout=self.timeout,
            )
        except requests.Timeout as exc:
            raise SttServiceError("STT provider timeout.", status_code=504) from exc
        except requests.RequestException as exc:
            raise SttServiceError("Failed to reach STT provider.", status_code=502) from exc

        if resp.status_code >= 400:
            provider_text = (resp.text or "").strip()
            provider_text = provider_text[:500]
            logger.warning("STT provider error status=%s body=%s", resp.status_code, provider_text)

            if resp.status_code == 429:
                raise SttServiceError("STT provider rate limit reached.", status_code=503)
            if resp.status_code in (401, 403):
                raise SttServiceError("STT provider authentication failed (check API key).", status_code=502)
            if resp.status_code in (400, 415, 422):
                detail = provider_text or "Bad request to STT provider (check audio format/language/model)."
                raise SttServiceError(f"STT provider rejected request: {detail}", status_code=502)
            raise SttServiceError("STT provider request failed.", status_code=502)

        try:
            return resp.json()
        except ValueError as exc:
            raise SttServiceError("Invalid STT provider response.", status_code=502) from exc

    def _normalize_result(self, payload: dict, *, provider: ProviderName) -> SttResult:
        text = payload.get("text") or payload.get("transcript") or payload.get("result")
        if not isinstance(text, str) or not text.strip():
            raise SttServiceError("STT provider returned empty transcript.", status_code=502)

        detected_language = payload.get("language") or payload.get("detected_language")
        if detected_language is not None and not isinstance(detected_language, str):
            detected_language = None

        return SttResult(
            text=text.strip(),
            provider=provider,
            detected_language=detected_language,
        )


stt_service = SttService()
