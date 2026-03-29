"""
schema.py — Enriched record schema for Step 2.

Defines the canonical shape of an enriched DOM element record.
Every record produced by the enrichment pipeline will have
exactly these fields, making downstream consumers predictable.

Extension point for Step 3:
    - Add `embedding_vector` field when embeddings are generated.
    - Add `milvus_id` field when records are indexed.
"""

from __future__ import annotations
from typing import List, Optional


# All fields an enriched record carries.
# Used as a template: missing values get sensible defaults.
ENRICHED_SCHEMA = {
    # --- Identity (carried from Step 1) ---
    "element_id": "",            # Unique ID assigned during enrichment
    "page_url": "",              # Source URL of the page
    "tag": "",                   # HTML tag name (button, a, input, …)

    # --- Raw text signals ---
    "text": "",                  # Visible inner text
    "normalized_text": "",       # Lowercased, whitespace-collapsed text
    "label_text": None,          # <label> text associated with this element
    "aria_label": None,          # aria-label attribute
    "placeholder": None,         # placeholder attribute
    "title": None,               # title attribute
    "alt": None,                 # alt attribute (images)

    # --- Location / targeting ---
    "href": None,                # Link target
    "role": None,                # ARIA role
    "input_type": None,          # type= for <input> elements
    "selector": "",              # Best-effort CSS selector
    "xpath": "",                 # XPath from Step 1

    # --- Boolean flags ---
    "is_clickable": False,       # Heuristic: can the user click this?
    "is_form_control": False,    # Heuristic: is this a form field?

    # --- Context ---
    "raw_context": "",           # Raw parent text from Step 1
    "context_summary": "",       # Short human-readable context sentence

    # --- Semantic enrichment (Step 2 core output) ---
    "action_type": "unknown",    # Classified action (login, search, …)
    "candidate_intents": [],     # Possible user intents this element serves
    "keywords": [],              # Expanded keyword / synonym list
    "semantic_text": "",         # Human-readable description for embeddings
    "retrieval_text": "",        # Dense text blob for search indexing

    # --- Confidence ---
    "confidence_hint": "low",    # low / medium / high

    # --- Developer notes ---
    "notes": "",                 # Any heuristic notes or warnings
}


def empty_enriched_record() -> dict:
    """Return a fresh copy of the enriched schema with default values."""
    record = {}
    for key, default in ENRICHED_SCHEMA.items():
        if isinstance(default, list):
            record[key] = list(default)
        else:
            record[key] = default
    return record
