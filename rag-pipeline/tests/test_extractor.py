"""
test_extractor.py — Smoke tests for the extraction pipeline.

Run with: python -m pytest tests/ -v
"""

import json
import os
import asyncio
import pytest

# Add rag-pipeline root to path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from extraction.browser import open_page
from extraction.extractor import extract_elements
from extraction.normalizer import normalize


@pytest.mark.asyncio
async def test_extract_example_com():
    """
    Smoke test: extract elements from example.com and verify
    we get at least one element with the right schema.
    """
    url = "https://example.com"

    async with open_page(url) as page:
        raw = await extract_elements(page, url)

    # example.com has at least one <a> link ("More information...")
    assert len(raw) > 0, "Expected at least one element from example.com"

    # Verify the first element has expected keys
    first = raw[0]
    assert "tag" in first
    assert "page_url" in first
    assert first["page_url"] == url


@pytest.mark.asyncio
async def test_normalize_applies_schema():
    """
    Verify that normalization fills in all schema fields
    even when the raw data is incomplete.
    """
    raw = [
        {
            "page_url": "https://test.com",
            "tag": "button",
            "text": "Click me",
            "css_selector": "#btn1",
        }
    ]

    result = normalize(raw)

    assert len(result) == 1
    record = result[0]

    # Check all schema fields exist
    expected_keys = {
        "page_url", "tag", "text", "aria_label", "placeholder",
        "title", "alt", "role", "input_type", "id", "class_list",
        "name", "href", "is_visible", "is_enabled", "css_selector",
        "xpath", "context_text", "semantic_text",
    }
    assert set(record.keys()) == expected_keys

    # semantic_text should have been generated
    assert "button" in record["semantic_text"]
    assert "Click me" in record["semantic_text"]


@pytest.mark.asyncio
async def test_normalize_deduplicates():
    """
    Elements with the same CSS selector should be deduplicated.
    """
    raw = [
        {"tag": "button", "text": "A", "css_selector": "#btn", "page_url": "https://t.com"},
        {"tag": "button", "text": "B", "css_selector": "#btn", "page_url": "https://t.com"},
    ]

    result = normalize(raw)
    assert len(result) == 1, "Duplicate selectors should be removed"
