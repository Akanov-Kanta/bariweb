# Multimodal Service (Dev3)

Backend adapter for voice transcription and OCR.

## Setup

1. Copy env template:
   - `cp .env.example .env` (or create `.env` manually on Windows)
2. Fill real keys:
   - `STT_KK_KEY`
   - `STT_GENERIC_KEY`
   - `OCR_KEY`
3. Install deps: `npm install`
4. Run: `npm run dev`

Service default URL: `http://localhost:8787`

## Endpoints

- `GET /health`
- `POST /v1/transcribe` (multipart: `audio`, optional `languageHint=kk|en|auto`)
- `POST /v1/ocr` (JSON with `imageUrl` or multipart with `image`)