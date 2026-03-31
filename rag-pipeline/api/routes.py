"""
routes.py — FastAPI route definitions for the retrieval API.

All routes delegate to the RetrievalService — no business logic here.

Endpoints:
    GET  /health                — Service health check
    POST /index                 — Index enriched files
    POST /search                — Semantic search
    GET  /elements/{element_id} — Look up a specific element
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from api.schemas import (
    ElementResponse,
    HealthResponse,
    IndexRequest,
    IndexResponse,
    MatchResult,
    SearchRequest,
    SearchResponse,
)
from api.service import RetrievalService

logger = logging.getLogger(__name__)

# The router is created here and mounted in app.py.
router = APIRouter()

# The service instance is injected at app startup (see app.py).
_service: RetrievalService | None = None


def set_service(service: RetrievalService) -> None:
    """Inject the service instance. Called once at app startup."""
    global _service
    _service = service


def _get_service() -> RetrievalService:
    """Return the service or raise if not initialized."""
    if _service is None:
        raise HTTPException(
            status_code=503,
            detail="Service not initialized. Please wait for startup.",
        )
    return _service


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns the service status, record count, and backend name.",
)
async def health():
    service = _get_service()
    return HealthResponse(
        status="ok",
        indexed_records=service.record_count,
        vector_backend=service.backend_name,
    )


# ---------------------------------------------------------------------------
# POST /index
# ---------------------------------------------------------------------------

@router.post(
    "/index",
    response_model=IndexResponse,
    summary="Index enriched records",
    description=(
        "Indexes enriched DOM element records from Step 2 JSON files. "
        "If no file_path is provided, all enriched files in the "
        "configured directory are indexed."
    ),
)
async def index_records(request: IndexRequest):
    service = _get_service()

    logger.info(
        "Index request: file_path=%s, clear_existing=%s",
        request.file_path,
        request.clear_existing,
    )

    result = service.index_files(
        file_path=request.file_path,
        clear_existing=request.clear_existing,
    )

    return IndexResponse(**result)


# ---------------------------------------------------------------------------
# POST /search
# ---------------------------------------------------------------------------

@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Semantic search",
    description=(
        "Accepts a natural-language query and returns the top-matching "
        "interactive DOM elements with similarity scores."
    ),
)
async def search(request: SearchRequest):
    service = _get_service()

    logger.info(
        "Search request: query=%r, top_k=%d, min_score=%s, "
        "action_type=%s, page_url=%s, tag=%s",
        request.query,
        request.top_k,
        request.min_score,
        request.action_type,
        request.page_url,
        request.tag,
    )

    result = service.search(
        query=request.query,
        top_k=request.top_k,
        min_score=request.min_score,
        action_type=request.action_type,
        page_url=request.page_url,
        tag=request.tag,
    )

    # Convert match dicts to MatchResult models.
    matches = [MatchResult(**m) for m in result["matches"]]

    return SearchResponse(
        query=result["query"],
        top_k=result["top_k"],
        total_matches=result["total_matches"],
        search_time_ms=result["search_time_ms"],
        matches=matches,
    )


# ---------------------------------------------------------------------------
# GET /elements/{element_id}
# ---------------------------------------------------------------------------

@router.get(
    "/elements/{element_id}",
    response_model=ElementResponse,
    summary="Get element by ID",
    description="Returns full metadata for a specific indexed element.",
)
async def get_element(element_id: str):
    service = _get_service()

    logger.info("Element lookup: element_id=%s", element_id)

    element = service.get_element(element_id)
    if element is None:
        raise HTTPException(
            status_code=404,
            detail=f"Element '{element_id}' not found in the index.",
        )

    return ElementResponse(**element)
