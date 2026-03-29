"""
test_step3.py — Unit tests for Step 3: embeddings, indexing, retrieval.

Tests the embedding text builder, indexed record schema,
local vector store, and search logic without hitting the real API.
"""

import json
import os
import tempfile
import pytest

import numpy as np

# --- Imports under test ---
from embeddings.text_builder import build_embedding_text
from embeddings.schema import IndexedRecord
from vectorstore.local_store import LocalVectorStore
from vectorstore.base import SearchResult


# ---------------------------------------------------------------------------
# Sample enriched record for testing
# ---------------------------------------------------------------------------

SAMPLE_ENRICHED = {
    "element_id": "abc123",
    "page_url": "https://example.com/contacts",
    "tag": "a",
    "text": "Contact Us",
    "normalized_text": "contact us",
    "label_text": None,
    "aria_label": None,
    "placeholder": None,
    "title": None,
    "alt": None,
    "href": "/contacts",
    "role": None,
    "input_type": None,
    "selector": "a.contact-link",
    "xpath": "/html/body/nav/a[3]",
    "is_clickable": True,
    "is_form_control": False,
    "raw_context": "Home About Contact Us",
    "context_summary": "Navigation link in header menu.",
    "action_type": "contact",
    "candidate_intents": ["contact the company", "reach support"],
    "keywords": ["contact", "support", "email", "reach"],
    "semantic_text": 'Link "Contact Us". Used for contact / reaching out. Leads to: contacts.',
    "retrieval_text": "Contact Us contact us Link contact contact / reaching out contact support email reach contacts Navigation link in header menu.",
    "confidence_hint": "high",
    "notes": "",
}

SAMPLE_LOGIN = {
    "element_id": "def456",
    "page_url": "https://example.com/login",
    "tag": "button",
    "text": "Sign In",
    "normalized_text": "sign in",
    "label_text": None,
    "aria_label": "Sign in to your account",
    "placeholder": None,
    "title": None,
    "alt": None,
    "href": None,
    "role": "button",
    "input_type": "submit",
    "selector": "button.login-btn",
    "xpath": "/html/body/form/button[1]",
    "is_clickable": True,
    "is_form_control": False,
    "raw_context": "Email Password Sign In",
    "context_summary": "Login form submit button.",
    "action_type": "login",
    "candidate_intents": ["sign in", "log in", "authenticate"],
    "keywords": ["login", "sign in", "authenticate", "password"],
    "semantic_text": 'Button "Sign In". Used for authentication / login. Login form submit button.',
    "retrieval_text": "Sign In Sign in to your account sign in Button role:button login authentication / login login sign in authenticate password Login form submit button.",
    "confidence_hint": "high",
    "notes": "",
}

SAMPLE_SEARCH = {
    "element_id": "ghi789",
    "page_url": "https://example.com",
    "tag": "input",
    "text": "",
    "normalized_text": "",
    "label_text": None,
    "aria_label": "Search",
    "placeholder": "Search the site...",
    "title": None,
    "alt": None,
    "href": None,
    "role": "searchbox",
    "input_type": "text",
    "selector": "input.search-box",
    "xpath": "/html/body/header/input[1]",
    "is_clickable": False,
    "is_form_control": True,
    "raw_context": "Search the site",
    "context_summary": "Main search input in header.",
    "action_type": "search",
    "candidate_intents": ["search", "find something"],
    "keywords": ["search", "find", "query", "look up"],
    "semantic_text": 'Input field "Search". Used for search. Placeholder: "Search the site...". Main search input in header.',
    "retrieval_text": "Search Search the site... search Input field role:searchbox search search find query look up Main search input in header.",
    "confidence_hint": "high",
    "notes": "",
}


# ---------------------------------------------------------------------------
# Tests: Embedding text builder
# ---------------------------------------------------------------------------

class TestEmbeddingTextBuilder:
    """Tests for embeddings.text_builder.build_embedding_text."""

    def test_builds_non_empty_text(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        assert text, "Embedding text should not be empty."

    def test_includes_semantic_text(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        assert "Contact Us" in text

    def test_includes_action_type(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        assert "Action: contact" in text

    def test_includes_tag(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        assert "Element: a" in text

    def test_includes_keywords(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        for kw in ["contact", "support", "email"]:
            assert kw in text

    def test_includes_page_hint(self):
        text = build_embedding_text(SAMPLE_ENRICHED)
        assert "example.com" in text

    def test_empty_record_returns_string(self):
        text = build_embedding_text({})
        assert isinstance(text, str)

    def test_unknown_action_excluded(self):
        record = {**SAMPLE_ENRICHED, "action_type": "unknown"}
        text = build_embedding_text(record)
        assert "Action: unknown" not in text


# ---------------------------------------------------------------------------
# Tests: IndexedRecord schema
# ---------------------------------------------------------------------------

class TestIndexedRecord:
    """Tests for embeddings.schema.IndexedRecord."""

    def test_from_enriched(self):
        record = IndexedRecord.from_enriched(
            SAMPLE_ENRICHED,
            embedding_text="test text",
            embedding=[0.1, 0.2, 0.3],
        )
        assert record.element_id == "abc123"
        assert record.page_url == "https://example.com/contacts"
        assert record.tag == "a"
        assert record.action_type == "contact"
        assert record.embedding_text == "test text"
        assert record.embedding == [0.1, 0.2, 0.3]

    def test_to_dict_roundtrip(self):
        original = IndexedRecord.from_enriched(
            SAMPLE_ENRICHED,
            embedding_text="test",
            embedding=[0.1, 0.2],
        )
        as_dict = original.to_dict()
        restored = IndexedRecord.from_dict(as_dict)
        assert restored.element_id == original.element_id
        assert restored.embedding == original.embedding

    def test_metadata_contains_href(self):
        record = IndexedRecord.from_enriched(SAMPLE_ENRICHED)
        assert record.metadata["href"] == "/contacts"
        assert record.metadata["is_clickable"] is True


# ---------------------------------------------------------------------------
# Tests: LocalVectorStore
# ---------------------------------------------------------------------------

class TestLocalVectorStore:
    """Tests for vectorstore.local_store.LocalVectorStore."""

    def _make_record(self, element_id, embedding, **kwargs):
        """Helper to create a test IndexedRecord with a given embedding."""
        return IndexedRecord(
            element_id=element_id,
            page_url=kwargs.get("page_url", "https://example.com"),
            selector=kwargs.get("selector", "a.test"),
            tag=kwargs.get("tag", "a"),
            action_type=kwargs.get("action_type", "navigate"),
            semantic_text=kwargs.get("semantic_text", "Test element."),
            embedding_text=kwargs.get("embedding_text", "test"),
            embedding=embedding,
        )

    def test_add_and_count(self):
        store = LocalVectorStore()
        records = [
            self._make_record("r1", [1.0, 0.0, 0.0]),
            self._make_record("r2", [0.0, 1.0, 0.0]),
        ]
        added = store.add(records)
        assert added == 2
        assert store.count() == 2

    def test_add_skips_empty_embedding(self):
        store = LocalVectorStore()
        records = [
            self._make_record("r1", [1.0, 0.0]),
            self._make_record("r2", []),  # No embedding.
        ]
        added = store.add(records)
        assert added == 1
        assert store.count() == 1

    def test_search_returns_sorted_results(self):
        store = LocalVectorStore()
        records = [
            self._make_record("r1", [1.0, 0.0, 0.0]),
            self._make_record("r2", [0.0, 1.0, 0.0]),
            self._make_record("r3", [0.7, 0.7, 0.0]),  # Closer to r1's direction.
        ]
        store.add(records)

        # Query similar to r1.
        results = store.search([1.0, 0.0, 0.0], top_k=3)
        # r2 is orthogonal (cosine=0), gets filtered out → 2 results.
        assert len(results) == 2
        # r1 should be the best match (cosine sim = 1.0).
        assert results[0].record.element_id == "r1"
        assert results[0].score == pytest.approx(1.0, abs=1e-4)
        # r3 should come second (has a component in the same direction).
        assert results[1].record.element_id == "r3"

    def test_search_with_filter(self):
        store = LocalVectorStore()
        records = [
            self._make_record("r1", [1.0, 0.0], action_type="login"),
            self._make_record("r2", [0.9, 0.1], action_type="contact"),
            self._make_record("r3", [0.8, 0.2], action_type="login"),
        ]
        store.add(records)

        results = store.search(
            [1.0, 0.0],
            top_k=5,
            filters={"action_type": "login"},
        )
        assert all(r.record.action_type == "login" for r in results)

    def test_search_empty_store(self):
        store = LocalVectorStore()
        results = store.search([1.0, 0.0], top_k=5)
        assert results == []

    def test_clear(self):
        store = LocalVectorStore()
        store.add([self._make_record("r1", [1.0, 0.0])])
        assert store.count() == 1
        store.clear()
        assert store.count() == 0

    def test_save_and_load(self):
        store = LocalVectorStore()
        records = [
            self._make_record("r1", [1.0, 0.0, 0.5], semantic_text="Hello test"),
            self._make_record("r2", [0.0, 1.0, 0.3], semantic_text="World test"),
        ]
        store.add(records)

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            temp_path = f.name

        try:
            store.save(temp_path)
            assert os.path.exists(temp_path)

            # Load into a new store.
            store2 = LocalVectorStore()
            store2.load(temp_path)
            assert store2.count() == 2

            # Search should work on the loaded store.
            results = store2.search([1.0, 0.0, 0.5], top_k=1)
            assert results[0].record.element_id == "r1"
        finally:
            os.unlink(temp_path)

    def test_top_k_limits_results(self):
        store = LocalVectorStore()
        for i in range(10):
            vec = [0.0] * 4
            vec[i % 4] = 1.0
            store.add([self._make_record(f"r{i}", vec)])

        results = store.search([1.0, 0.0, 0.0, 0.0], top_k=3)
        assert len(results) <= 3


# ---------------------------------------------------------------------------
# Tests: SearchResult
# ---------------------------------------------------------------------------

class TestSearchResult:
    """Tests for vectorstore.base.SearchResult."""

    def test_to_dict_shape(self):
        record = IndexedRecord(
            element_id="el_001",
            page_url="https://example.com",
            selector="a.link",
            tag="a",
            action_type="navigate",
            semantic_text="A navigation link.",
            confidence_hint="high",
            keywords=["nav", "link", "go"],
            metadata={"href": "/about"},
        )
        result = SearchResult(record=record, score=0.9234)
        d = result.to_dict()

        assert d["element_id"] == "el_001"
        assert d["score"] == 0.9234
        assert d["action_type"] == "navigate"
        assert d["href"] == "/about"
        assert len(d["keywords"]) <= 5
