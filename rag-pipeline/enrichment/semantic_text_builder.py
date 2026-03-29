"""
semantic_text_builder.py — Generate human-readable semantic descriptions.

This is one of the most important outputs of Step 2.

The `semantic_text` is a natural-language sentence describing what an
element is and what it does.  It will become the primary input for
embedding in Step 3.

The `retrieval_text` is a denser blob that packs more signals for
search indexing.

Design principle:
    A blind user asking "what is this element?" should get back
    something immediately understandable from `semantic_text`.

Extension point for Step 3:
    - Feed `semantic_text` directly into an embedding model.
    - Use `retrieval_text` as an alternative / combined input.
"""

from __future__ import annotations

from .normalizer_helpers import (
    truncate,
    first_non_empty,
    extract_route_hint,
    is_likely_path,
)


# ---------------------------------------------------------------------------
# Human-friendly tag names
# ---------------------------------------------------------------------------

_TAG_NAMES = {
    "a": "Link",
    "button": "Button",
    "input": "Input field",
    "textarea": "Text area",
    "select": "Dropdown selector",
    "form": "Form",
    "label": "Label",
    "nav": "Navigation section",
    "img": "Image",
    "div": "Section",
    "span": "Inline element",
    "header": "Header section",
    "footer": "Footer section",
    "main": "Main content",
    "aside": "Side panel",
    "section": "Section",
}

_ACTION_LABELS = {
    "login": "authentication / login",
    "logout": "signing out",
    "register": "registration / sign up",
    "search": "search",
    "submit": "form submission",
    "contact": "contact / reaching out",
    "support": "help / support",
    "purchase": "purchase / buying",
    "navigate": "navigation",
    "menu": "menu / navigation",
    "filter": "filtering / sorting",
    "download": "downloading",
    "upload": "uploading / attaching",
    "close": "closing / dismissing",
    "cancel": "cancellation",
    "delete": "deletion / removal",
}


def build_semantic_text(record: dict) -> str:
    """
    Build a human-readable description of the element
    suitable for future embeddings.

    Example outputs:
        'Login button on the authentication page. Used to sign in
         to the personal account.'
        'Search input field. Placeholder: "Search Wikipedia".'
        'Navigation link "Contact Us" pointing to the contact page.'
    """
    parts: list[str] = []

    tag = record.get("tag", "")
    tag_name = _TAG_NAMES.get(tag, tag.capitalize() if tag else "Element")
    text = record.get("text", "") or ""
    action_type = record.get("action_type", "unknown")
    label = record.get("label_text") or ""
    aria = record.get("aria_label") or ""
    placeholder = record.get("placeholder") or ""

    # --- Primary description: what kind of element + its text ---
    visible_name = first_non_empty(text, aria, label, placeholder)
    if visible_name:
        visible_name_short = truncate(visible_name, 80)
        parts.append(f'{tag_name} "{visible_name_short}".')
    else:
        parts.append(f"{tag_name}.")

    # --- Action purpose ---
    if action_type != "unknown":
        action_desc = _ACTION_LABELS.get(action_type, action_type)
        parts.append(f"Used for {action_desc}.")

    # --- Input type specifics ---
    input_type = record.get("input_type") or ""
    if input_type and input_type not in ("hidden", "submit", "button"):
        parts.append(f"Input type: {input_type}.")

    # --- Label / placeholder context ---
    if label and label != visible_name:
        parts.append(f"Label: {truncate(label, 60)}.")
    if placeholder and placeholder != visible_name:
        parts.append(f'Placeholder: "{truncate(placeholder, 60)}".')

    # --- Href route ---
    href = record.get("href") or ""
    if is_likely_path(href):
        route = extract_route_hint(href)
        if route:
            parts.append(f"Leads to: {route}.")

    # --- Context ---
    context = record.get("context_summary") or ""
    if context:
        parts.append(truncate(context, 100))

    return " ".join(parts)


def build_retrieval_text(record: dict) -> str:
    """
    Build a dense text blob for search indexing.

    This packs as many searchable signals as possible into one string,
    sacrificing readability for recall.  It's unstructured on purpose —
    think of it as a "search bag".
    """
    parts: list[str] = []

    # All text sources
    for field in ("text", "aria_label", "placeholder", "title", "alt",
                  "label_text", "normalized_text"):
        value = record.get(field)
        if value:
            parts.append(str(value))

    # Tag + role
    tag = record.get("tag", "")
    if tag:
        tag_name = _TAG_NAMES.get(tag, tag)
        parts.append(tag_name)
    role = record.get("role") or ""
    if role:
        parts.append(f"role:{role}")

    # Action type
    action = record.get("action_type", "unknown")
    if action != "unknown":
        parts.append(action)
        label = _ACTION_LABELS.get(action, "")
        if label:
            parts.append(label)

    # Keywords
    keywords = record.get("keywords") or []
    if keywords:
        parts.extend(keywords[:15])  # cap to avoid explosion

    # Route hint
    href = record.get("href") or ""
    if is_likely_path(href):
        route = extract_route_hint(href)
        if route:
            parts.append(route)

    # Context
    ctx = record.get("context_summary") or ""
    if ctx:
        parts.append(truncate(ctx, 100))

    return " ".join(parts)
