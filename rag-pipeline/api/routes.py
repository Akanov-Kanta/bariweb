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

from fastapi import APIRouter, HTTPException, BackgroundTasks

from api.schemas import (
    ElementResponse,
    HealthResponse,
    IndexRequest,
    IndexResponse,
    MatchResult,
    SearchRequest,
    SearchResponse,
    CrawlRequest,
    CrawlResponse,
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
# POST /crawl
# ---------------------------------------------------------------------------

@router.post(
    "/crawl",
    response_model=CrawlResponse,
    summary="Trigger the background crawler",
    description="Starts crawling the specified URL in the background. After crawling, the elements are indexed.",
)
async def crawl(request: CrawlRequest, background_tasks: BackgroundTasks):
    from main import run_crawl_pipeline
    from enrich import enrich_file
    import config

    async def _run_crawl():
        try:
            logger.info("Starting background crawl for %s", request.url)
            paths = await run_crawl_pipeline(
                url=request.url,
                max_pages=request.max_pages,
                max_depth=request.max_depth
            )
            logger.info("Completed background crawl for %s. Found %d raw paths.", request.url, len(paths))
            
            # Enrich and index
            service = _get_service()
            for raw_path in paths:
                try:
                    enriched_path = enrich_file(raw_path, config.ENRICHED_OUTPUT_DIR)
                    service.index_files(file_path=enriched_path, clear_existing=False)
                except Exception as e:
                    logger.error("Failed to enrich/index %s: %s", raw_path, e)
        except Exception as e:
            logger.error("Error in background crawl for %s: %s", request.url, e)

    background_tasks.add_task(_run_crawl)
    return CrawlResponse(status="accepted", message="Crawl started in the background")





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
