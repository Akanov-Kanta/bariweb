"""
app.py — FastAPI application factory for the retrieval API.

Creates and configures the FastAPI app, sets up logging,
initializes the RetrievalService, and mounts the routes.

Usage:
    uvicorn api.app:create_app --factory --reload --port 8000

Or via the convenience script:
    python run_server.py
"""

from __future__ import annotations

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router, set_service
from api.service import RetrievalService


def _setup_logging() -> None:
    """Configure structured logging for the API."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(name)-30s  %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    # Reduce noise from third-party libraries.
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def create_app() -> FastAPI:
    """
    Application factory.

    Creates the FastAPI app, initializes the service,
    and mounts the router.
    """
    _setup_logging()
    logger = logging.getLogger(__name__)

    app = FastAPI(
        title="Autonomous Digital Inclusion Proxy — Retrieval API",
        description=(
            "Semantic search over indexed website DOM elements. "
            "Part of the accessibility proxy RAG pipeline."
        ),
        version="0.4.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS — allow all origins for MVP / demo.
    # Tighten this in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Protect API with Token Auth mapping to Main Backend
    from api.middleware import AuthMiddleware
    app.add_middleware(AuthMiddleware)

    # Initialize the service.
    # auto_load_index=True means it will try to load the latest
    # index from disk at startup so the API is immediately searchable.
    service = RetrievalService(auto_load_index=True)
    set_service(service)

    logger.info(
        "Service ready: backend=%s, records=%d",
        service.backend_name,
        service.record_count,
    )

    # Mount routes.
    app.include_router(router)

    return app


# Allow running directly: python -m api.app
# But prefer run_server.py or uvicorn for production.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(create_app(), host="0.0.0.0", port=8000)
