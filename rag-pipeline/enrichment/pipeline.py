"""
pipeline.py — The Step 2 enrichment pipeline.

Takes raw extracted records from Step 1 and produces enriched records
with action classifications, context summaries, keywords, semantic
text, retrieval text, and candidate intents.

Usage (as a module):
    from enrichment.pipeline import enrich_records
    enriched = enrich_records(raw_records)

This module orchestrates the individual enrichment components:
    - action_classifier
    - context_builder
    - keyword_generator
    - semantic_text_builder
    - intent_resolver

Extension point for Step 3:
    - Add an `embed_records()` step after enrichment that calls an
      embedding model and attaches vectors to each record.
"""

from __future__ import annotations

import hashlib
from typing import List, Dict, Any

from .schema import empty_enriched_record
from .normalizer_helpers import (
    normalize_text,
    clean_class_list,
    first_non_empty,
)
from .action_classifier import classify_action, get_confidence
from .context_builder import build_context_summary, extract_label_text
from .keyword_generator import generate_keywords
from .semantic_text_builder import build_semantic_text, build_retrieval_text
from .intent_resolver import resolve_intents


def enrich_records(
    raw_records: List[Dict[str, Any]],
    page_url: str = "",
) -> List[Dict[str, Any]]:
    """
    Run the full enrichment pipeline on a list of raw Step 1 records.

    Args:
        raw_records: List of element dicts from Step 1 extraction.
        page_url:    Fallback page URL if not present in records.

    Returns:
        List of enriched element dicts matching the enriched schema.
    """
    enriched_list = []

    for index, raw in enumerate(raw_records):
        enriched = _enrich_single(raw, index, page_url)
        enriched_list.append(enriched)

    return enriched_list


def _enrich_single(
    raw: Dict[str, Any],
    index: int,
    fallback_url: str,
) -> Dict[str, Any]:
    """
    Enrich a single raw record through all enrichment stages.
    """
    record = empty_enriched_record()

    # === Stage 0: Copy raw fields =========================================
    record["page_url"] = raw.get("page_url") or fallback_url
    record["tag"] = raw.get("tag", "")
    record["text"] = raw.get("text", "")
    record["aria_label"] = raw.get("aria_label")
    record["placeholder"] = raw.get("placeholder")
    record["title"] = raw.get("title")
    record["alt"] = raw.get("alt")
    record["href"] = raw.get("href")
    record["role"] = raw.get("role")
    record["input_type"] = raw.get("input_type")
    record["selector"] = raw.get("css_selector", "")
    record["xpath"] = raw.get("xpath", "")
    record["raw_context"] = raw.get("context_text", "")

    # === Stage 1: Normalize text ==========================================
    record["normalized_text"] = normalize_text(record["text"])

    # === Stage 2: Derive boolean flags ====================================
    record["is_clickable"] = _is_clickable(record)
    record["is_form_control"] = _is_form_control(record)

    # === Stage 3: Generate element ID =====================================
    record["element_id"] = _generate_id(record, index)

    # === Stage 4: Extract label text ======================================
    record["label_text"] = extract_label_text(record)

    # === Stage 5: Classify action type ====================================
    action_type = classify_action(record)
    record["action_type"] = action_type

    # === Stage 6: Confidence =============================================
    record["confidence_hint"] = get_confidence(record, action_type)

    # === Stage 7: Context summary =========================================
    record["context_summary"] = build_context_summary(record)

    # === Stage 8: Keywords ================================================
    record["keywords"] = generate_keywords(record, action_type)

    # === Stage 9: Candidate intents ======================================
    record["candidate_intents"] = resolve_intents(record, action_type)

    # === Stage 10: Semantic text (depends on context + action) =============
    record["semantic_text"] = build_semantic_text(record)

    # === Stage 11: Retrieval text =========================================
    record["retrieval_text"] = build_retrieval_text(record)

    # === Stage 12: Notes ==================================================
    record["notes"] = _build_notes(record)

    return record


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

_CLICKABLE_TAGS = frozenset({"a", "button"})
_CLICKABLE_ROLES = frozenset({"button", "link", "menuitem", "tab", "option"})
_CLICKABLE_INPUT_TYPES = frozenset({"submit", "button", "reset", "checkbox", "radio"})

_FORM_TAGS = frozenset({"input", "textarea", "select"})
_FORM_ROLES = frozenset({"textbox", "combobox", "listbox", "spinbutton", "slider"})


def _is_clickable(record: dict) -> bool:
    """Heuristic: can the user click this element to trigger an action?"""
    tag = (record.get("tag") or "").lower()
    if tag in _CLICKABLE_TAGS:
        return True
    role = (record.get("role") or "").lower()
    if role in _CLICKABLE_ROLES:
        return True
    input_type = (record.get("input_type") or "").lower()
    if input_type in _CLICKABLE_INPUT_TYPES:
        return True
    return False


def _is_form_control(record: dict) -> bool:
    """Heuristic: is this a form field the user fills in?"""
    tag = (record.get("tag") or "").lower()
    if tag in _FORM_TAGS:
        return True
    role = (record.get("role") or "").lower()
    if role in _FORM_ROLES:
        return True
    return False


def _generate_id(record: dict, index: int) -> str:
    """
    Generate a stable, unique element ID.
    Based on page_url + selector + index for determinism.
    """
    raw = f"{record.get('page_url', '')}|{record.get('selector', '')}|{index}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _build_notes(record: dict) -> str:
    """Add diagnostic notes about enrichment quality."""
    notes: list[str] = []

    # Warn if no text signals at all
    has_text = any([
        record.get("text"),
        record.get("aria_label"),
        record.get("placeholder"),
        record.get("title"),
        record.get("alt"),
    ])
    if not has_text:
        notes.append("No visible text or accessibility label found.")

    if record.get("action_type") == "unknown":
        notes.append("Could not determine action type.")

    if record.get("input_type") == "hidden":
        notes.append("Hidden input — may not be user-facing.")

    return " ".join(notes)
