"""
schemas.py — Pydantic request/response models for the retrieval API.

These models define the contract between the API and its consumers
(the orchestrator, the frontend widget, or external callers).

All models use Pydantic for automatic validation, serialization,
and OpenAPI documentation generation.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    """Response from the /health endpoint."""
    status: str = Field(default="ok", description="Service status")
    indexed_records: int = Field(
        description="Number of records currently in the vector store"
    )
    vector_backend: str = Field(
        description="Name of the active vector store backend"
    )


# ---------------------------------------------------------------------------
# Indexing
# ---------------------------------------------------------------------------

class IndexRequest(BaseModel):
    """Request body for POST /index."""
    file_path: Optional[str] = Field(
        default=None,
        description=(
            "Path to a specific enriched JSON file to index. "
            "If omitted, indexes all enriched files in the configured directory."
        ),
    )
    clear_existing: bool = Field(
        default=False,
        description="If true, clears the existing index before indexing.",
    )


class IndexResponse(BaseModel):
    """Response from POST /index."""
    status: str = Field(description="Outcome of the indexing operation")
    files_indexed: int = Field(description="Number of files processed")
    records_indexed: int = Field(description="Total records added to the store")
    total_records: int = Field(description="Total records now in the store")
    index_time_ms: float = Field(description="Time taken for indexing in ms")
    errors: List[str] = Field(
        default_factory=list,
        description="Any errors encountered during indexing",
    )


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

class SearchRequest(BaseModel):
    """Request body for POST /search."""
    query: str = Field(
        description="Natural-language query (e.g., 'find contacts')",
        min_length=1,
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Maximum number of results to return",
    )
    min_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score threshold (0.0–1.0)",
    )
    action_type: Optional[str] = Field(
        default=None,
        description="Filter results by action type (e.g., 'login', 'search')",
    )
    page_url: Optional[str] = Field(
        default=None,
        description="Filter results by page URL",
    )
    tag: Optional[str] = Field(
        default=None,
        description="Filter results by HTML tag (e.g., 'button', 'a')",
    )


class MatchResult(BaseModel):
    """A single search result."""
    element_id: str
    page_url: str
    selector: str
    tag: str
    action_type: str
    semantic_text: str
    confidence_hint: str
    score: float
    href: Optional[str] = None
    keywords: Optional[List[str]] = None


class SearchResponse(BaseModel):
    """Response from POST /search."""
    query: str
    top_k: int
    total_matches: int = Field(description="Number of matches returned")
    search_time_ms: float
    matches: List[MatchResult]


# ---------------------------------------------------------------------------
# Element lookup
# ---------------------------------------------------------------------------

class ElementResponse(BaseModel):
    """Response from GET /elements/{element_id}."""
    element_id: str
    page_url: str
    selector: str
    tag: str
    action_type: str
    semantic_text: str
    retrieval_text: str
    context_summary: str
    keywords: List[str]
    confidence_hint: str
    embedding_text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
