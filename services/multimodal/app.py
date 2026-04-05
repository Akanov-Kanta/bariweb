from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from time import monotonic
from typing import Any, Literal
from urllib.parse import urlparse

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

load_dotenv()

LanguageHint = Literal['kk', 'en', 'ru', 'auto']

OCR_CACHE_VERSION = 'ocr:v3'
STT_CACHE_VERSION = 'stt:v3'
DEFAULT_TIMEOUT_SECONDS = 25.0


@dataclass
class CacheEntry:
    value: str
    expires_at: float


class MemoryTTLStore:
    def __init__(self) -> None:
        self._data: dict[str, CacheEntry] = {}

    async def get(self, key: str) -> str | None:
        entry = self._data.get(key)
        if entry is None:
            return None

        if monotonic() > entry.expires_at:
            self._data.pop(key, None)
            return None

        return entry.value

    async def set(self, key: str, value: str, ttl_seconds: int) -> None:
        self._data[key] = CacheEntry(value=value, expires_at=monotonic() + ttl_seconds)


class AppConfig:
    def __init__(self) -> None:
        self.port = int(os.getenv('PORT', '8787'))
        self.base_url = os.getenv('ALEM_BASE_URL', 'https://llm.alem.ai').rstrip('/')
        self.stt_kk_key = os.getenv('STT_KK_KEY')
        self.stt_generic_key = os.getenv('STT_GENERIC_KEY')
        self.ocr_key = os.getenv('OCR_KEY')
        self.cache_ttl_seconds = int(os.getenv('CACHE_TTL_SECONDS', '600'))
        node_env = os.getenv('NODE_ENV', '').lower()
        self.debug_metadata = os.getenv('DEBUG_METADATA') == '1' or node_env != 'production'
        self.cors_origin = os.getenv('CORS_ORIGIN', '*')


config = AppConfig()
cache = MemoryTTLStore()

app = FastAPI(title='multimodal-service', version='0.1.0')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'] if config.cors_origin == '*' else [config.cors_origin],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def hash_buffer(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def hash_text(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def new_request_id() -> str:
    return str(uuid.uuid4())


def normalize_language_hint(value: Any) -> LanguageHint:
    if value in ('kk', 'en', 'ru', 'auto'):
        return value
    return 'auto'


def log_event(event: str, details: dict[str, Any]) -> None:
    payload = {
        'event': event,
        'at': datetime.now(timezone.utc).isoformat(),
        **details,
    }
    print(json.dumps(payload, ensure_ascii=False))


async def safe_read_text(response: httpx.Response) -> str:
    try:
        return response.text.strip()[:500]
    except Exception:
        return ''


async def transcribe_with_alem(
    *,
    api_key: str,
    base_url: str,
    model: Literal['speech-to-text-kk', 'speech-to-text'],
    audio: bytes,
    mime_type: str,
    file_name: str,
    language: str | None = None,
) -> str:
    files = {'file': (file_name, audio, mime_type)}
    data: dict[str, str] = {'model': model}

    if language:
        data['language'] = language

    timeout = httpx.Timeout(DEFAULT_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.post(
            f'{base_url}/v1/audio/transcriptions',
            headers={'Authorization': f'Bearer {api_key}'},
            data=data,
            files=files,
        )

    if response.status_code >= 400:
        details = await safe_read_text(response)
        suffix = f': {details}' if details else ''
        raise RuntimeError(f'STT request failed with status {response.status_code}{suffix}')

    payload = response.json()
    text = payload.get('text', '') if isinstance(payload, dict) else ''
    normalized = text.strip() if isinstance(text, str) else ''

    if not normalized:
        raise RuntimeError('STT provider returned empty text.')

    return normalized


async def ocr_with_alem(*, api_key: str, base_url: str, image_url: str, prompt: str) -> str:
    body = {
        'model': 'deepseek-ocr',
        'temperature': 0,
        'messages': [
            {
                'role': 'user',
                'content': [
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': image_url,
                        },
                    },
                    {
                        'type': 'text',
                        'text': prompt,
                    },
                ],
            }
        ],
    }

    timeout = httpx.Timeout(DEFAULT_TIMEOUT_SECONDS)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.post(
            f'{base_url}/v1/chat/completions',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json=body,
        )

    if response.status_code >= 400:
        details = await safe_read_text(response)
        suffix = f': {details}' if details else ''
        raise RuntimeError(f'OCR request failed with status {response.status_code}{suffix}')

    payload = response.json()
    text = extract_completion_text(payload).strip()

    if not text:
        raise RuntimeError('OCR provider returned empty text.')

    return text


def extract_completion_text(payload: Any) -> str:
    if not isinstance(payload, dict):
        return ''

    choices = payload.get('choices')
    if not isinstance(choices, list) or len(choices) == 0:
        return ''

    first = choices[0]
    if not isinstance(first, dict):
        return ''

    message = first.get('message')
    if not isinstance(message, dict):
        return ''

    content = message.get('content')

    if isinstance(content, str):
        return content

    if not isinstance(content, list):
        return ''

    chunks: list[str] = []
    for item in content:
        if isinstance(item, dict):
            text = item.get('text')
            if isinstance(text, str) and text:
                chunks.append(text)

    return '\n'.join(chunks)


def assess_generic_candidate(text: str) -> dict[str, Any]:
    trimmed = text.strip()
    words = [word for word in re.split(r'\s+', trimmed) if word]

    if not trimmed or len(words) == 0:
        return {'accept': False, 'reason': 'empty', 'languageGuess': 'unknown'}

    if len(trimmed) < 3:
        return {'accept': False, 'reason': 'too_short', 'languageGuess': 'unknown'}

    latin_count = len(re.findall(r'[A-Za-z]', trimmed))
    cyrillic_count = len(re.findall(r'[\u0400-\u04FF]', trimmed))

    if latin_count == 0 and cyrillic_count > 0:
        return {'accept': False, 'reason': 'non_latin_detected', 'languageGuess': 'cyrillic'}

    if latin_count >= 2 and len(words) >= 1:
        return {'accept': True, 'reason': 'latin_text_detected', 'languageGuess': 'en'}

    if cyrillic_count > 0 and latin_count > 0:
        return {'accept': True, 'reason': 'mixed_script_text_detected', 'languageGuess': 'mixed'}

    return {'accept': True, 'reason': 'generic_text_detected', 'languageGuess': 'auto'}


def assess_kazakh_candidate(text: str) -> dict[str, Any]:
    trimmed = text.strip()

    if not trimmed:
        return {'accept': False, 'reason': 'empty', 'hasKazakhMarkers': False}

    if len(trimmed) < 2:
        return {'accept': False, 'reason': 'too_short', 'hasKazakhMarkers': False}

    has_markers = bool(
        re.search(r'[\u04D8\u04D9\u0406\u0456\u04A2\u04A3\u0492\u0493\u04AE\u04AF\u04B0\u04B1\u049A\u049B\u04E8\u04E9\u04BA\u04BB]', trimmed)
    )

    return {'accept': True, 'reason': 'kk_candidate_ok', 'hasKazakhMarkers': has_markers}


async def transcribe_with_routing(
    language_hint: LanguageHint,
    *,
    audio: bytes,
    mime_type: str,
    file_name: str,
) -> dict[str, Any]:
    if language_hint == 'en':
        english = await transcribe_with_alem(
            api_key=config.stt_generic_key or '',
            base_url=config.base_url,
            model='speech-to-text',
            audio=audio,
            mime_type=mime_type,
            file_name=file_name,
            language='en',
        )

        return {
            'text': english,
            'provider': 'speech-to-text',
            'language': 'en',
            'debug': {
                'selectedProvider': 'speech-to-text',
                'candidatesTried': ['speech-to-text:en'],
                'selectionReason': 'explicit_en_hint',
                'retryCount': 0,
            },
        }

    if language_hint == 'ru':
        russian = await transcribe_with_alem(
            api_key=config.stt_generic_key or '',
            base_url=config.base_url,
            model='speech-to-text',
            audio=audio,
            mime_type=mime_type,
            file_name=file_name,
            language='ru',
        )

        return {
            'text': russian,
            'provider': 'speech-to-text',
            'language': 'ru',
            'debug': {
                'selectedProvider': 'speech-to-text',
                'candidatesTried': ['speech-to-text:ru'],
                'selectionReason': 'explicit_ru_hint',
                'retryCount': 0,
            },
        }

    if language_hint == 'kk':
        kazakh = await transcribe_with_alem(
            api_key=config.stt_kk_key or '',
            base_url=config.base_url,
            model='speech-to-text-kk',
            audio=audio,
            mime_type=mime_type,
            file_name=file_name,
        )

        return {
            'text': kazakh,
            'provider': 'speech-to-text-kk',
            'language': 'kk',
            'debug': {
                'selectedProvider': 'speech-to-text-kk',
                'candidatesTried': ['speech-to-text-kk'],
                'selectionReason': 'explicit_kk_hint',
                'retryCount': 0,
            },
        }

    tried: list[str] = []

    try:
        tried.append('speech-to-text-kk')
        kazakh = await transcribe_with_alem(
            api_key=config.stt_kk_key or '',
            base_url=config.base_url,
            model='speech-to-text-kk',
            audio=audio,
            mime_type=mime_type,
            file_name=file_name,
        )

        kk_quality = assess_kazakh_candidate(kazakh)

        if kk_quality['accept'] and kk_quality['hasKazakhMarkers']:
            return {
                'text': kazakh,
                'provider': 'speech-to-text-kk',
                'language': 'kk',
                'debug': {
                    'selectedProvider': 'speech-to-text-kk',
                    'candidatesTried': tried,
                    'selectionReason': 'kk_markers_detected',
                    'retryCount': 0,
                },
            }

        tried.append('speech-to-text:en')
        generic_english = await transcribe_with_alem(
            api_key=config.stt_generic_key or '',
            base_url=config.base_url,
            model='speech-to-text',
            audio=audio,
            mime_type=mime_type,
            file_name=file_name,
            language='en',
        )

        generic_quality = assess_generic_candidate(generic_english)

        if generic_quality['accept'] and generic_quality['languageGuess'] == 'en':
            return {
                'text': generic_english,
                'provider': 'speech-to-text',
                'language': 'en',
                'debug': {
                    'selectedProvider': 'speech-to-text',
                    'candidatesTried': tried,
                    'selectionReason': 'latin_text_detected_after_kk_probe',
                    'retryCount': 1,
                },
            }

        if kk_quality['accept']:
            return {
                'text': kazakh,
                'provider': 'speech-to-text-kk',
                'language': 'kk',
                'debug': {
                    'selectedProvider': 'speech-to-text-kk',
                    'candidatesTried': tried,
                    'selectionReason': f"generic_not_english:{generic_quality['reason']}",
                    'retryCount': 1,
                },
            }

        if generic_quality['accept']:
            return {
                'text': generic_english,
                'provider': 'speech-to-text',
                'language': generic_quality['languageGuess'],
                'debug': {
                    'selectedProvider': 'speech-to-text',
                    'candidatesTried': tried,
                    'selectionReason': f"kk_rejected:{kk_quality['reason']}",
                    'retryCount': 1,
                },
            }
    except Exception:
        pass

    tried.append('speech-to-text:auto')
    generic_auto = await transcribe_with_alem(
        api_key=config.stt_generic_key or '',
        base_url=config.base_url,
        model='speech-to-text',
        audio=audio,
        mime_type=mime_type,
        file_name=file_name,
    )

    return {
        'text': generic_auto,
        'provider': 'speech-to-text',
        'language': 'auto',
        'debug': {
            'selectedProvider': 'speech-to-text',
            'candidatesTried': tried,
            'selectionReason': 'fallback_generic_auto',
            'retryCount': max(0, len(tried) - 1),
        },
    }


def validate_image_url(raw: str) -> dict[str, Any]:
    try:
        parsed = urlparse(raw)
    except Exception:
        return {'ok': False, 'error': 'imageUrl must be a valid URL.'}

    if parsed.scheme not in ('http', 'https'):
        return {'ok': False, 'error': 'imageUrl must start with http:// or https://.'}

    return {'ok': True}


async def fetch_image_as_data_url(image_url: str) -> dict[str, Any]:
    timeout = httpx.Timeout(20.0)

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(image_url)

        if response.status_code >= 400:
            return {
                'ok': False,
                'errorReason': f'fetch_status_{response.status_code}',
                'userMessage': 'Could not fetch image URL. Please provide a direct public image link.',
            }

        content_type = response.headers.get('content-type', '').lower()
        if content_type and not content_type.startswith('image/'):
            return {
                'ok': False,
                'errorReason': f'non_image_content_type:{content_type}',
                'userMessage': 'URL does not point to an image resource.',
            }

        raw = response.content
        if len(raw) == 0:
            return {
                'ok': False,
                'errorReason': 'empty_image_payload',
                'userMessage': 'Image URL returned empty content.',
            }

        mime_type = content_type or 'image/png'
        base64_data = base64.b64encode(raw).decode('ascii')

        return {
            'ok': True,
            'dataUrl': f'data:{mime_type};base64,{base64_data}',
        }
    except Exception:
        return {
            'ok': False,
            'errorReason': 'fetch_failed',
            'userMessage': 'Failed to fetch image URL. Check that the link is public and direct.',
        }


def strip_prompt_echo(text: str, prompt: str) -> str:
    prompt_lower = prompt.lower()
    lines = [line.strip() for line in text.split('\n') if line.strip()]

    cleaned_lines = []
    for line in lines:
        lowered = line.lower()
        if len(lowered) >= 8 and lowered in prompt_lower:
            continue
        cleaned_lines.append(line)

    return '\n'.join(cleaned_lines).strip()


def looks_like_instruction_echo(text: str) -> bool:
    lowered = text.lower()

    highly_suspicious_patterns = [
        'if the text is not a valid url',
        'return invalid_url',
        'if the text is too long, return long_text',
        'do not repeat this instruction',
        'preserve the original language and script',
        'do not translate',
    ]

    for pattern in highly_suspicious_patterns:
        if pattern in lowered:
            occurrences = lowered.count(pattern)
            if occurrences >= 2 or (occurrences >= 1 and len(lowered) < 240):
                return True

    sentences = [chunk.strip() for chunk in re.split(r'[.!?\n]+', lowered) if len(chunk.strip()) >= 8]

    if len(sentences) < 8:
        return False

    counts: dict[str, int] = {}
    for sentence in sentences:
        counts[sentence] = counts.get(sentence, 0) + 1

    max_repeat = max(counts.values(), default=0)
    return max_repeat >= 6 and max_repeat / len(sentences) >= 0.55


def normalize_ocr_text(input_text: str, prompt: str) -> dict[str, Any]:
    text = input_text.strip()

    if not text:
        return {'accept': False, 'text': ''}

    stripped = strip_prompt_echo(text, prompt).strip()

    if not stripped:
        return {'accept': False, 'text': ''}

    if stripped.lower() == 'no_text':
        return {'accept': False, 'text': ''}

    if looks_like_instruction_echo(stripped):
        return {'accept': False, 'text': ''}

    return {'accept': True, 'text': stripped}


async def run_ocr_with_retry(image_data_url: str, first_prompt: str) -> dict[str, Any]:
    prompts = [
        first_prompt,
        'Extract only text visible in the image. Preserve original language/script exactly. Output text only. Do not translate. If no text is visible, output NO_TEXT.',
    ]

    for index, prompt in enumerate(prompts):
        raw = await ocr_with_alem(
            api_key=config.ocr_key or '',
            base_url=config.base_url,
            image_url=image_data_url,
            prompt=prompt,
        )

        normalized = normalize_ocr_text(raw, prompt)
        if normalized['accept']:
            return {
                'text': normalized['text'],
                'retryCount': index,
                'reason': 'primary_prompt' if index == 0 else 'fallback_prompt',
            }

    return {
        'text': '',
        'retryCount': 1,
        'reason': 'echo_or_empty_after_retry',
    }


@app.get('/health')
async def health() -> dict[str, Any]:
    stt = 'ready' if (config.stt_kk_key and config.stt_generic_key) else 'degraded'
    ocr = 'ready' if config.ocr_key else 'degraded'

    return {
        'ok': stt == 'ready' and ocr == 'ready',
        'stt': stt,
        'ocr': ocr,
    }


@app.post('/v1/transcribe')
async def transcribe(audio: UploadFile = File(...), languageHint: str = Form('auto')) -> JSONResponse:  # noqa: N803
    started_at = monotonic()
    request_id = new_request_id()

    try:
        if not config.stt_kk_key or not config.stt_generic_key:
            return JSONResponse(status_code=503, content={'error': 'STT is not configured on server.', 'requestId': request_id})

        audio_bytes = await audio.read()
        if len(audio_bytes) == 0:
            return JSONResponse(status_code=400, content={'error': 'Audio file is required under field "audio".', 'requestId': request_id})

        language_hint = normalize_language_hint(languageHint)
        file_hash = hash_buffer(audio_bytes)
        cache_key = f"{STT_CACHE_VERSION}:{hash_text(f'{file_hash}:{language_hint}')}"

        cached = await cache.get(cache_key)
        if cached:
            parsed = json.loads(cached)

            payload: dict[str, Any] = {
                'text': parsed.get('text', ''),
                'language': parsed.get('language', language_hint),
                'provider': parsed.get('provider', ''),
                'latencyMs': int((monotonic() - started_at) * 1000),
                'requestId': request_id,
                'cacheHit': True,
            }

            if config.debug_metadata and parsed.get('debug'):
                payload['debug'] = parsed.get('debug')

            log_event(
                'stt_success',
                {
                    'requestId': request_id,
                    'provider': payload['provider'],
                    'language': payload['language'],
                    'cacheHit': True,
                    'latencyMs': payload['latencyMs'],
                },
            )

            return JSONResponse(content=payload)

        decision = await transcribe_with_routing(
            language_hint,
            audio=audio_bytes,
            mime_type=audio.content_type or 'audio/wav',
            file_name=audio.filename or 'recording.wav',
        )

        response_body: dict[str, Any] = {
            'text': decision['text'],
            'language': decision['language'],
            'provider': decision['provider'],
            'latencyMs': int((monotonic() - started_at) * 1000),
            'requestId': request_id,
            'cacheHit': False,
        }

        if config.debug_metadata:
            response_body['debug'] = decision['debug']

        await cache.set(
            cache_key,
            json.dumps(
                {
                    'text': response_body['text'],
                    'language': response_body['language'],
                    'provider': response_body['provider'],
                    'debug': decision['debug'],
                },
                ensure_ascii=False,
            ),
            config.cache_ttl_seconds,
        )

        log_event(
            'stt_success',
            {
                'requestId': request_id,
                'provider': response_body['provider'],
                'language': response_body['language'],
                'cacheHit': False,
                'selectionReason': decision['debug']['selectionReason'],
                'candidatesTried': decision['debug']['candidatesTried'],
                'latencyMs': response_body['latencyMs'],
            },
        )

        return JSONResponse(content=response_body)
    except Exception as error:
        log_event('stt_error', {'requestId': request_id, 'error': str(error)})
        return JSONResponse(status_code=500, content={'error': 'Failed to transcribe audio. Please retry.', 'requestId': request_id})


@app.post('/v1/ocr')
async def ocr(request: Request) -> JSONResponse:
    started_at = monotonic()
    request_id = new_request_id()

    try:
        if not config.ocr_key:
            return JSONResponse(status_code=503, content={'error': 'OCR is not configured on server.', 'requestId': request_id})

        body = await request.json()
        if not isinstance(body, dict):
            return JSONResponse(status_code=400, content={'error': 'imageUrl is required for OCR.', 'requestId': request_id})

        prompt_base = body.get('prompt')
        if not isinstance(prompt_base, str) or len(prompt_base.strip()) == 0:
            prompt_base = 'Extract all visible text from this image. Return only text from the image.'

        prompt = f'{prompt_base.strip()} Preserve the original language and script exactly. Do not translate.'

        image_url_raw = body.get('imageUrl')
        image_url = image_url_raw.strip() if isinstance(image_url_raw, str) else ''

        if not image_url:
            return JSONResponse(status_code=400, content={'error': 'imageUrl is required for OCR.', 'requestId': request_id})

        validated = validate_image_url(image_url)
        if not validated.get('ok'):
            return JSONResponse(status_code=400, content={'error': validated['error'], 'requestId': request_id})

        cache_key = f"{OCR_CACHE_VERSION}:{hash_text(f'{image_url}:{prompt}:deepseek-ocr')}"
        cached = await cache.get(cache_key)

        if cached:
            parsed = json.loads(cached)

            payload: dict[str, Any] = {
                'text': parsed.get('text', ''),
                'provider': parsed.get('provider', ''),
                'latencyMs': int((monotonic() - started_at) * 1000),
                'requestId': request_id,
                'cacheHit': True,
            }

            if config.debug_metadata and parsed.get('debug'):
                payload['debug'] = parsed.get('debug')

            log_event(
                'ocr_success',
                {
                    'requestId': request_id,
                    'provider': payload['provider'],
                    'cacheHit': True,
                    'latencyMs': payload['latencyMs'],
                },
            )

            return JSONResponse(content=payload)

        fetched = await fetch_image_as_data_url(image_url)
        if not fetched.get('ok'):
            log_event('ocr_rejected', {'requestId': request_id, 'reason': fetched['errorReason'], 'imageUrl': image_url})
            return JSONResponse(status_code=400, content={'error': fetched['userMessage'], 'requestId': request_id})

        decision = await run_ocr_with_retry(fetched['dataUrl'], prompt)
        if not decision.get('text'):
            log_event(
                'ocr_rejected',
                {
                    'requestId': request_id,
                    'reason': decision['reason'],
                    'retryCount': decision['retryCount'],
                },
            )
            return JSONResponse(status_code=422, content={'error': 'OCR could not extract reliable text from this image.', 'requestId': request_id})

        debug_meta = {
            'selectedProvider': 'deepseek-ocr',
            'candidatesTried': ['deepseek-ocr-attempt-1', 'deepseek-ocr-attempt-2'][: decision['retryCount'] + 1],
            'selectionReason': decision['reason'],
            'retryCount': decision['retryCount'],
        }

        response_body: dict[str, Any] = {
            'text': decision['text'],
            'provider': 'deepseek-ocr',
            'latencyMs': int((monotonic() - started_at) * 1000),
            'requestId': request_id,
            'cacheHit': False,
        }

        if config.debug_metadata:
            response_body['debug'] = debug_meta

        await cache.set(
            cache_key,
            json.dumps(
                {
                    'text': response_body['text'],
                    'provider': response_body['provider'],
                    'debug': debug_meta if config.debug_metadata else None,
                },
                ensure_ascii=False,
            ),
            config.cache_ttl_seconds,
        )

        log_event(
            'ocr_success',
            {
                'requestId': request_id,
                'provider': response_body['provider'],
                'cacheHit': False,
                'retryCount': decision['retryCount'],
                'selectionReason': decision['reason'],
                'latencyMs': response_body['latencyMs'],
            },
        )

        return JSONResponse(content=response_body)
    except Exception as error:
        log_event('ocr_error', {'requestId': request_id, 'error': str(error)})
        return JSONResponse(status_code=500, content={'error': 'OCR request failed. Please retry with a direct image URL.', 'requestId': request_id})


if __name__ == '__main__':
    import uvicorn

    missing: list[str] = []

    if not config.stt_kk_key:
        missing.append('STT_KK_KEY')
    if not config.stt_generic_key:
        missing.append('STT_GENERIC_KEY')
    if not config.ocr_key:
        missing.append('OCR_KEY')

    if len(missing) > 0:
        print(f"[multimodal] Started with degraded config: {', '.join(missing)}")

    print(f'[multimodal] Listening on http://localhost:{config.port}')
    uvicorn.run('app:app', host='0.0.0.0', port=config.port, reload=False)
