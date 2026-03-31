"""
normalizer.py — Transform raw extracted data into a clean, canonical schema.

Responsibilities:
  - Ensure every record has all expected fields (fill missing ones with defaults)
  - Deduplicate elements (by CSS selector)
  - Strip excessive whitespace
  - Prepare the `semantic_text` field (placeholder for now)

In Step 2, this module will also generate `semantic_text` by
combining tag, text, aria_label, and context into a single
string suitable for embedding.
"""

from __future__ import annotations
from typing import List, Dict, Any


# Canonical schema — every output record has exactly these keys.
SCHEMA_FIELDS = {
    "page_url": "",
    "tag": "",
    "text": "",
    "aria_label": None,
    "placeholder": None,
    "title": None,
    "alt": None,
    "role": None,
    "input_type": None,
    "id": None,
    "class_list": [],
    "name": None,
    "href": None,
    "is_visible": True,
    "is_enabled": True,
    "css_selector": "",
    "xpath": "",
    "context_text": "",
    "semantic_text": "",
}


def normalize(raw_elements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Take a list of raw element dicts from the extractor and return
    a cleaned, deduplicated list matching the canonical schema.
    """
    normalized = []
    seen_selectors = set()  # for deduplication

    for raw in raw_elements:
        record = _apply_schema(raw)
        record = _clean_strings(record)

        # --- Deduplication by CSS selector ---
        selector = record["css_selector"]
        if selector and selector in seen_selectors:
            continue
        if selector:
            seen_selectors.add(selector)

        # --- Generate semantic_text (placeholder logic for Step 1) ---
        record["semantic_text"] = _build_semantic_text(record)

        normalized.append(record)

    return normalized


def _apply_schema(raw: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure every field from SCHEMA_FIELDS exists in the record.
    Missing fields get their default value.
    """
    record = {}
    for key, default in SCHEMA_FIELDS.items():
        value = raw.get(key, default)
        # Make a copy of mutable defaults (lists)
        if value is default and isinstance(default, list):
            value = list(default)
        record[key] = value
    return record


def _clean_strings(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Strip excessive whitespace from all string fields.
    """
    for key, value in record.items():
        if isinstance(value, str):
            # Collapse multiple whitespace chars into single spaces
            record[key] = " ".join(value.split())
    return record


def _build_semantic_text(record: Dict[str, Any]) -> str:
    """
    Build a human-readable description of the element.
    This will be the input text for embedding in Step 2.

    For now, we concatenate available descriptive fields.
    Example output: "button: Submit Application [role=button]"
    """
    parts = []

    # Start with the tag
    tag = record.get("tag", "")
    if tag:
        parts.append(f"{tag}:")

    # Add the visible text
    text = record.get("text", "")
    if text:
        parts.append(text)

    # Add aria-label if different from text
    aria = record.get("aria_label") or ""
    if aria and aria != text:
        parts.append(f"[aria-label={aria}]")

    # Add placeholder
    placeholder = record.get("placeholder") or ""
    if placeholder:
        parts.append(f"[placeholder={placeholder}]")

    # Add title
    title = record.get("title") or ""
    if title and title != text:
        parts.append(f"[title={title}]")

    # Add role
    role = record.get("role") or ""
    if role:
        parts.append(f"[role={role}]")

    # Add alt text
    alt = record.get("alt") or ""
    if alt:
        parts.append(f"[alt={alt}]")

    return " ".join(parts).strip()
