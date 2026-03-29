"""
context_builder.py — Build a human-readable context summary for each element.

Uses nearby signals (parent text, label, form context, href, role)
to produce a short sentence describing where the element lives and
what surrounds it.

Example output:
    "Located inside a search form. Label: Search Wikipedia."
    "Navigation link in the main menu pointing to /contact."
"""

from __future__ import annotations

from .normalizer_helpers import (
    normalize_text,
    truncate,
    extract_route_hint,
    first_non_empty,
    is_likely_path,
)


def build_context_summary(record: dict) -> str:
    """
    Produce a short, human-readable context sentence.
    Pulls from raw_context / context_text, label, href, role, etc.
    """
    parts: list[str] = []

    # 1. Role or tag-based location hint
    role = record.get("role") or ""
    tag = record.get("tag") or ""

    if role:
        parts.append(f"Element with role '{role}'.")
    elif tag in ("form",):
        parts.append("Form element.")
    elif tag in ("nav",):
        parts.append("Navigation section.")

    # 2. Label text
    label = record.get("label_text") or ""
    if label:
        parts.append(f"Label: {truncate(label, 80)}.")

    # 3. Form context hint from raw_context / context_text
    raw_ctx = first_non_empty(
        record.get("raw_context"),
        record.get("context_text"),
    )
    if raw_ctx:
        # Try to extract a short meaningful snippet
        ctx_hint = _extract_context_hint(raw_ctx, tag)
        if ctx_hint:
            parts.append(ctx_hint)

    # 4. Href / route hint
    href = record.get("href") or ""
    if is_likely_path(href):
        route = extract_route_hint(href)
        if route:
            parts.append(f"Points to: {route}.")

    # 5. Placeholder as context
    placeholder = record.get("placeholder") or ""
    if placeholder:
        parts.append(f"Placeholder: {truncate(placeholder, 60)}.")

    if not parts:
        return ""

    return " ".join(parts)


def extract_label_text(record: dict) -> str | None:
    """
    Attempt to find an associated label from signals.
    
    In Step 1, we don't explicitly link <label> to <input>,
    but we can approximate from:
      - aria-label
      - placeholder
      - title
      - context_text if it's short enough to be a label
    """
    # aria-label is the most reliable
    aria = record.get("aria_label")
    if aria:
        return aria

    # For inputs, placeholder often functions as a label
    tag = (record.get("tag") or "").lower()
    if tag in ("input", "textarea", "select"):
        placeholder = record.get("placeholder")
        if placeholder:
            return placeholder

    # title can act as a label for some elements
    title = record.get("title")
    if title:
        return title

    return None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_context_hint(raw_context: str, tag: str) -> str:
    """
    Pull a short useful snippet from the raw context text.
    Tries to avoid repeating the element's own text.
    """
    if not raw_context:
        return ""

    # Truncate long context and make it a hint
    clean = " ".join(raw_context.split())
    if len(clean) > 120:
        clean = clean[:117] + "…"

    return f"Context: {clean}"
