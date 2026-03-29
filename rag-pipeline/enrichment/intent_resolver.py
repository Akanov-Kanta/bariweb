"""
intent_resolver.py — Derive candidate user intents for each element.

A "candidate intent" is a short phrase describing what a user might
say when they want to interact with this element.

Examples:
    - Button "Sign In" → ["log into my account", "sign in", "authenticate"]
    - Input with placeholder "Your email" → ["enter email address", "type email"]
    - Link "Contact Us" → ["find contacts", "reach support", "get in touch"]

These help the retrieval system match fuzzy natural-language queries
to the right DOM element.

Extension point for Step 3:
    - Use an LLM to generate more diverse/creative intents.
"""

from __future__ import annotations

from typing import List

from .normalizer_helpers import first_non_empty


# ---------------------------------------------------------------------------
# Intent templates per action_type
# Each template group contains phrases a user might say.
# ---------------------------------------------------------------------------

_INTENT_TEMPLATES: dict[str, list[str]] = {
    "login": [
        "log into my account",
        "sign in to the website",
        "enter my credentials",
        "access my account",
    ],
    "logout": [
        "log out of my account",
        "sign out",
        "exit my session",
    ],
    "register": [
        "create a new account",
        "sign up for the service",
        "register on the website",
    ],
    "search": [
        "search for something",
        "find information",
        "look up a topic",
    ],
    "submit": [
        "submit the form",
        "send the data",
        "confirm my input",
    ],
    "contact": [
        "find contact information",
        "reach out to the company",
        "get in touch",
        "find phone number or email",
    ],
    "support": [
        "get help",
        "find the FAQ",
        "contact support",
        "ask for assistance",
    ],
    "purchase": [
        "buy something",
        "make a purchase",
        "add to my cart",
        "proceed to checkout",
    ],
    "navigate": [
        "go to this page",
        "open this link",
        "navigate to this section",
    ],
    "menu": [
        "open the menu",
        "browse navigation options",
    ],
    "filter": [
        "filter the results",
        "narrow down the list",
        "sort items",
    ],
    "download": [
        "download a file",
        "save to my device",
    ],
    "upload": [
        "upload a file",
        "attach a document",
    ],
    "close": [
        "close this dialog",
        "dismiss the popup",
    ],
    "cancel": [
        "cancel the action",
        "go back",
        "undo",
    ],
    "delete": [
        "delete this item",
        "remove this entry",
    ],
}


def resolve_intents(record: dict, action_type: str) -> List[str]:
    """
    Return a list of candidate user intents for the element.

    Combines:
        1. Action-type template intents
        2. A custom intent derived from the element's visible text
    """
    intents: list[str] = []

    # 1. Template intents from action_type
    templates = _INTENT_TEMPLATES.get(action_type, [])
    intents.extend(templates)

    # 2. Custom intent from visible text
    visible = first_non_empty(
        record.get("text"),
        record.get("aria_label"),
        record.get("placeholder"),
        record.get("title"),
    )
    if visible and len(visible) < 80:
        tag = record.get("tag", "element")
        custom = _make_custom_intent(tag, visible)
        if custom and custom not in intents:
            intents.append(custom)

    # 3. If nothing else, at least a generic intent
    if not intents:
        visible_short = visible[:60] if visible else "this element"
        intents.append(f"interact with {visible_short}")

    return intents


def _make_custom_intent(tag: str, visible_text: str) -> str:
    """Generate a natural-sounding intent phrase from tag + text."""
    text = visible_text.strip()
    if not text:
        return ""

    tag = tag.lower()
    if tag == "a":
        return f'click the "{text}" link'
    if tag == "button":
        return f'press the "{text}" button'
    if tag in ("input", "textarea"):
        return f'fill in the "{text}" field'
    if tag == "select":
        return f'choose from the "{text}" dropdown'
    if tag == "form":
        return f'fill out the "{text}" form'

    return f'use the "{text}" element'
