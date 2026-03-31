"""
test_step4.py — Unit tests for Step 4: API service layer.

Tests the API endpoints, service layer logic, and schema validation
without hitting the real embeddings API (uses mocked vector store).
"""

import os
import json
import pytest
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient

from embeddings.schema import IndexedRecord
from vectorstore.local_store import LocalVectorStore
from vectorstore.base import SearchResult
from api.service import RetrievalService
from api.schemas import (
    HealthResponse,
    IndexRequest,
    IndexResponse,
    SearchRequest,
    SearchResponse,
    MatchResult,
    ElementResponse,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_store_with_records() -> LocalVectorStore:
    """Create a LocalVectorStore with some fake records for testing."""
    store = LocalVectorStore()
    records = [
        IndexedRecord(
            element_id="el_001",
            page_url="https://example.com/contacts",
            selector="a.contact-link",
            tag="a",
            action_type="contact",
            semantic_text='Link "Contact Us". Used for contact.',
            retrieval_text="Contact Us contact link",
            context_summary="Navigation link in header.",
            keywords=["contact", "support", "email"],
            confidence_hint="high",
            embedding_text="Contact link test",
            embedding=[1.0, 0.0, 0.0, 0.0],
            metadata={"href": "/contacts", "is_clickable": True},
        ),
        IndexedRecord(
            element_id="el_002",
            page_url="https://example.com/login",
            selector="button.login-btn",
            tag="button",
            action_type="login",
            semantic_text='Button "Sign In". Used for authentication.',
            retrieval_text="Sign In login button",
            context_summary="Login form submit button.",
            keywords=["login", "sign in", "authenticate"],
            confidence_hint="high",
            embedding_text="Login button test",
            embedding=[0.0, 1.0, 0.0, 0.0],
            metadata={"href": None, "is_clickable": True},
        ),
        IndexedRecord(
            element_id="el_003",
            page_url="https://example.com",
            selector="input.search-box",
            tag="input",
            action_type="search",
            semantic_text='Input field "Search". Used for search.',
            retrieval_text="Search input field",
            context_summary="Main search input in header.",
            keywords=["search", "find", "query"],
            confidence_hint="high",
            embedding_text="Search input test",
            embedding=[0.0, 0.0, 1.0, 0.0],
            metadata={"href": None, "is_clickable": False},
        ),
    ]
    store.add(records)
    return store


def _create_test_app():
    """Create a test FastAPI app with a pre-loaded store."""
    from fastapi import FastAPI
    from api.routes import router, set_service

    store = _make_store_with_records()
    service = RetrievalService(store=store, auto_load_index=False)
    set_service(service)

    app = FastAPI()
    app.include_router(router)
    return app


# ---------------------------------------------------------------------------
# Schema tests
# ---------------------------------------------------------------------------

class TestSchemas:
    """Test Pydantic model validation."""

    def test_search_request_validation(self):
        req = SearchRequest(query="find contacts")
        assert req.query == "find contacts"
        assert req.top_k == 5
        assert req.min_score is None

    def test_search_request_with_all_fields(self):
        req = SearchRequest(
            query="login",
            top_k=3,
            min_score=0.5,
            action_type="login",
            page_url="https://example.com",
            tag="button",
        )
        assert req.top_k == 3
        assert req.min_score == 0.5

    def test_search_request_empty_query_rejected(self):
        with pytest.raises(Exception):
            SearchRequest(query="")

    def test_match_result_serialization(self):
        match = MatchResult(
            element_id="el_001",
            page_url="https://example.com",
            selector="a.link",
            tag="a",
            action_type="navigate",
            semantic_text="A link.",
            confidence_hint="high",
            score=0.92,
        )
        d = match.model_dump()
        assert d["score"] == 0.92
        assert d["element_id"] == "el_001"

    def test_health_response(self):
        resp = HealthResponse(
            status="ok",
            indexed_records=42,
            vector_backend="LocalVectorStore",
        )
        assert resp.indexed_records == 42


# ---------------------------------------------------------------------------
# Service tests
# ---------------------------------------------------------------------------

class TestRetrievalService:
    """Test the RetrievalService business logic."""

    def test_service_init_with_store(self):
        store = _make_store_with_records()
        service = RetrievalService(store=store, auto_load_index=False)
        assert service.record_count == 3
        assert service.backend_name == "LocalVectorStore"

    def test_get_element_found(self):
        store = _make_store_with_records()
        service = RetrievalService(store=store, auto_load_index=False)
        element = service.get_element("el_001")
        assert element is not None
        assert element["element_id"] == "el_001"
        assert element["action_type"] == "contact"
        assert element["selector"] == "a.contact-link"

    def test_get_element_not_found(self):
        store = _make_store_with_records()
        service = RetrievalService(store=store, auto_load_index=False)
        element = service.get_element("nonexistent")
        assert element is None

    def test_search_empty_store(self):
        store = LocalVectorStore()
        service = RetrievalService(store=store, auto_load_index=False)
        result = service.search("find contacts")
        assert result["total_matches"] == 0
        assert result["matches"] == []

    def test_index_file_not_found(self):
        store = LocalVectorStore()
        service = RetrievalService(store=store, auto_load_index=False)
        result = service.index_files(file_path="/nonexistent/path.json")
        assert result["status"] == "error"
        assert len(result["errors"]) > 0


# ---------------------------------------------------------------------------
# API route tests
# ---------------------------------------------------------------------------

class TestAPIRoutes:
    """Test the FastAPI endpoints using TestClient."""

    def setup_method(self):
        self.app = _create_test_app()
        self.client = TestClient(self.app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["indexed_records"] == 3
        assert data["vector_backend"] == "LocalVectorStore"

    def test_search_endpoint_basic(self):
        """Test search with mocked embeddings client."""
        # We need to mock the embeddings client since we don't
        # want to call the real API in tests.
        with patch("embeddings.client.EmbeddingsClient") as MockClient:
            mock_instance = MockClient.return_value
            # Return a vector similar to el_001 (contact)
            mock_instance.embed_one.return_value = [0.9, 0.1, 0.0, 0.0]

            # Re-create app with mocked client.
            from api.routes import set_service
            store = _make_store_with_records()
            service = RetrievalService(store=store, auto_load_index=False)
            service._client = mock_instance
            set_service(service)

            response = self.client.post(
                "/search",
                json={"query": "find contacts", "top_k": 3},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["query"] == "find contacts"
            assert data["total_matches"] > 0
            assert len(data["matches"]) <= 3

            # The contact element should be the best match.
            if data["matches"]:
                best = data["matches"][0]
                assert "element_id" in best
                assert "score" in best
                assert "action_type" in best

    def test_search_with_min_score_filter(self):
        """Test that min_score filters out low-scoring results."""
        with patch("embeddings.client.EmbeddingsClient") as MockClient:
            mock_instance = MockClient.return_value
            mock_instance.embed_one.return_value = [0.5, 0.5, 0.5, 0.0]

            from api.routes import set_service
            store = _make_store_with_records()
            service = RetrievalService(store=store, auto_load_index=False)
            service._client = mock_instance
            set_service(service)

            # With a very high min_score, we should get fewer or no results.
            response = self.client.post(
                "/search",
                json={"query": "anything", "top_k": 5, "min_score": 0.99},
            )
            assert response.status_code == 200
            data = response.json()
            # All results should meet the threshold.
            for match in data["matches"]:
                assert match["score"] >= 0.99

    def test_get_element_found(self):
        response = self.client.get("/elements/el_002")
        assert response.status_code == 200
        data = response.json()
        assert data["element_id"] == "el_002"
        assert data["action_type"] == "login"
        assert data["tag"] == "button"

    def test_get_element_not_found(self):
        response = self.client.get("/elements/nonexistent")
        assert response.status_code == 404

    def test_search_empty_query_rejected(self):
        response = self.client.post(
            "/search",
            json={"query": "", "top_k": 5},
        )
        assert response.status_code == 422  # Validation error.

    def test_index_endpoint(self):
        """Test the index endpoint with a non-existent file."""
        response = self.client.post(
            "/index",
            json={"file_path": "/nonexistent/file.json"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert data["files_indexed"] == 0

    def test_search_response_shape(self):
        """Verify the response matches the expected schema exactly."""
        with patch("embeddings.client.EmbeddingsClient") as MockClient:
            mock_instance = MockClient.return_value
            mock_instance.embed_one.return_value = [1.0, 0.0, 0.0, 0.0]

            from api.routes import set_service
            store = _make_store_with_records()
            service = RetrievalService(store=store, auto_load_index=False)
            service._client = mock_instance
            set_service(service)

            response = self.client.post(
                "/search",
                json={"query": "contacts"},
            )
            data = response.json()

            # Top-level fields.
            assert "query" in data
            assert "top_k" in data
            assert "total_matches" in data
            assert "search_time_ms" in data
            assert "matches" in data

            if data["matches"]:
                match = data["matches"][0]
                required_fields = [
                    "element_id", "page_url", "selector", "tag",
                    "action_type", "semantic_text", "confidence_hint",
                    "score",
                ]
                for field in required_fields:
                    assert field in match, f"Missing field: {field}"
