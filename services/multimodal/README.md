# Multimodal Service (Python)

Backend adapter for voice transcription and OCR.

## Setup

1. Create virtual env and activate:
   - Windows PowerShell: `python -m venv .venv; .\.venv\Scripts\Activate.ps1`
2. Install deps:
   - `pip install -r requirements.txt`
3. Copy env template:
   - `Copy-Item .env.example .env`
4. Fill real keys:
   - `STT_KK_KEY`
   - `STT_GENERIC_KEY`
   - `OCR_KEY`
5. Run:
   - `python app.py`

Service default URL: `http://localhost:8787`

## Endpoints

- `GET /health`
- `POST /v1/transcribe` (multipart: `audio`, optional `languageHint=kk|en|ru|auto`)
- `POST /v1/ocr` (JSON with `imageUrl`, optional `prompt`)

## Notes

- Legacy TypeScript implementation is kept in `src/` for reference.
- Python app entrypoint: `app.py`.
