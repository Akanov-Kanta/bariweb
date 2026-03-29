"""
normalizer_helpers.py — Small text-cleaning utilities for enrichment.

Kept separate from the Step 1 normalizer to avoid coupling.
These helpers focus on preparing text for semantic analysis
rather than schema enforcement.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse


def normalize_text(text: str | None) -> str:
    """
    Lowercase, collapse whitespace, strip edges.
    Returns "" for None / empty input.
    """
    if not text:
        return ""
    return " ".join(text.lower().split()).strip()


def truncate(text: str, max_len: int = 200) -> str:
    """Truncate text to `max_len` characters, adding '…' if cut."""
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "…"


def extract_route_hint(url: str | None) -> str:
    """
    Pull a human-readable route hint from a URL.

    Examples:
        "https://example.com/login"       -> "login"
        "https://example.com/support/faq"  -> "support / faq"
        "https://example.com/"             -> ""
    """
    if not url:
        return ""
    try:
        path = urlparse(url).path.strip("/")
    except Exception:
        return ""
    if not path:
        return ""
    # Replace separators with " / " for readability
    return " / ".join(segment for segment in path.split("/") if segment)


def first_non_empty(*values: str | None) -> str:
    """Return the first non-None, non-empty-string value, or ''."""
    for v in values:
        if v:
            return v
    return ""


def clean_class_list(class_list: list | None) -> list:
    """Ensure class_list is always a list of strings."""
    if not class_list:
        return []
    if isinstance(class_list, str):
        return class_list.split()
    return [str(c) for c in class_list]


def is_likely_path(href: str | None) -> bool:
    """Check if an href looks like a meaningful page path (not just '#' or 'javascript:')."""
    if not href:
        return False
    href = href.strip()
    if href in ("#", "", "javascript:void(0)", "javascript:;"):
        return False
    if href.startswith("javascript:"):
        return False
    return True
