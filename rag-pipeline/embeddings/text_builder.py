"""
text_builder.py — Build the final embedding text from enriched records.

Each enriched record from Step 2 carries many fields (semantic_text,
retrieval_text, action_type, keywords, etc.).  Before we send anything
to the embedding model, we combine the most useful signals into a
single, deliberate string called `embedding_text`.

Design principles:
    - Include the most semantically meaningful signals.
    - Keep the text compact but rich — embedding models work best
      with focused, descriptive text.
    - Avoid raw HTML or noisy class names.
    - Be consistent across all records.

The resulting embedding_text is what gets sent to the embeddings API
and is stored alongside the vector for debugging/inspection.
"""

from __future__ import annotations

from typing import Dict, Any


def build_embedding_text(record: Dict[str, Any]) -> str:
    """
    Build the final text representation to embed for a single record.

    Combines the most useful signals from the enriched record into
    one clean string. This is the input to the embedding model.

    Args:
        record: An enriched element dict from Step 2.

    Returns:
        A single string suitable for embedding.
    """
    parts: list[str] = []

    # 1. Semantic text — the primary human-readable description.
    #    This is the richest single field from Step 2.
    semantic = (record.get("semantic_text") or "").strip()
    if semantic:
        parts.append(semantic)

    # 2. Action type — gives the model a strong intent signal.
    action = record.get("action_type", "unknown")
    if action and action != "unknown":
        parts.append(f"Action: {action}.")

    # 3. Tag — which HTML element type this is.
    tag = record.get("tag", "")
    if tag:
        parts.append(f"Element: {tag}.")

    # 4. Keywords — expanded synonyms from Step 2.
    keywords = record.get("keywords") or []
    if keywords:
        # Take the first 10 keywords to avoid bloat.
        kw_str = ", ".join(keywords[:10])
        parts.append(f"Keywords: {kw_str}.")

    # 5. Page URL hint — helps tie the element to a page context.
    page_url = record.get("page_url", "")
    if page_url:
        # Extract a short route hint from the URL.
        route = _extract_short_route(page_url)
        if route:
            parts.append(f"Page: {route}.")

    # 6. Context summary — surrounding page context.
    context = (record.get("context_summary") or "").strip()
    if context and context not in semantic:
        # Avoid duplicating if context_summary was already in semantic_text.
        parts.append(context)

    return " ".join(parts)


def _extract_short_route(url: str) -> str:
    """
    Pull a short route description from a URL.

    Examples:
        "https://example.com/login"       -> "example.com/login"
        "https://example.com/"            -> "example.com"
    """
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc or ""
        path = parsed.path.strip("/")
        if path:
            return f"{domain}/{path}"
        return domain
    except Exception:
        return ""
