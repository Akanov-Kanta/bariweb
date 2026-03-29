"""
action_classifier.py — Heuristic action-type classification.

Given the signals available on a DOM element, assigns a best-effort
action_type label like "login", "search", "navigate", "contact", etc.

This is NOT model-based — purely keyword / pattern matching.
Accuracy is decent for common UI patterns across English, Russian,
and basic Kazakh transliterations.

Extension point for Step 3:
    - Replace or augment with a lightweight classifier / LLM call.
"""

from __future__ import annotations

import re
from typing import Tuple

from .normalizer_helpers import normalize_text, extract_route_hint, is_likely_path


# ---------------------------------------------------------------------------
# Pattern tables
# Each entry:  (action_type, [patterns])
# Patterns are checked against merged text (text + aria + placeholder + href).
# Order matters — first match wins, so more specific patterns go first.
# ---------------------------------------------------------------------------

_ACTION_PATTERNS: list[Tuple[str, list[str]]] = [
    # --- Authentication ---
    ("login", [
        "log in", "login", "sign in", "signin",
        "войти", "вход", "авторизац",
        "кіру", "kiru",                              # Kazakh
    ]),
    ("logout", [
        "log out", "logout", "sign out", "signout",
        "выйти", "выход",
        "шығу", "shygu",                             # Kazakh
    ]),
    ("register", [
        "register", "sign up", "signup", "create account", "join",
        "регистрац", "зарегистр", "создать аккаунт",
        "тіркелу", "tirkelu",                        # Kazakh
    ]),

    # --- Search ---
    ("search", [
        "search", "find", "lookup", "look up",
        "поиск", "найти", "искать",
        "іздеу", "izdeu",                            # Kazakh
    ]),

    # --- Forms ---
    ("submit", [
        "submit", "send", "apply", "confirm", "save",
        "отправить", "подтверд", "сохранить", "применить",
        "жіберу", "jiberu",                          # Kazakh
    ]),

    # --- Contact / Support ---
    ("contact", [
        "contact", "contacts", "call us", "reach us",
        "контакт", "связь", "связаться",
        "байланыс", "baylanys",                      # Kazakh
    ]),
    ("support", [
        "support", "help", "help center", "faq",
        "поддержка", "помощь", "справка",
        "көмек", "komek",                            # Kazakh
    ]),

    # --- Purchase ---
    ("purchase", [
        "buy", "purchase", "checkout", "add to cart", "order",
        "купить", "заказать", "корзин", "оформить",
        "сатып алу", "satyp alu",                    # Kazakh
    ]),

    # --- Navigation ---
    ("navigate", [
        "go to", "open", "navigate", "more", "view",
        "read more", "learn more", "details", "see all",
        "перейти", "подробнее", "читать далее", "смотреть",
        "толығырақ", "tolygyrak",                    # Kazakh
    ]),
    ("menu", [
        "menu", "navigation", "nav",
        "меню", "навигац",
        "мәзір", "mazir",                            # Kazakh
    ]),

    # --- Filter / Sort ---
    ("filter", [
        "filter", "sort", "refine",
        "фильтр", "сортиров",
        "сүзгі", "suzgi",                            # Kazakh
    ]),

    # --- Download / Upload ---
    ("download", [
        "download", "скачать", "загрузить",
        "жүктеу", "jükteu",                         # Kazakh
    ]),
    ("upload", [
        "upload", "attach", "выгрузить", "прикрепить",
    ]),

    # --- Close / Cancel / Delete ---
    ("close", [
        "close", "dismiss", "закрыть", "жабу",
    ]),
    ("cancel", [
        "cancel", "отмена", "отменить", "болдырмау",
    ]),
    ("delete", [
        "delete", "remove", "удалить", "жою",
    ]),
]

# Patterns matched against href / route only
_HREF_PATTERNS: list[Tuple[str, list[str]]] = [
    ("login", ["login", "signin", "sign-in", "auth"]),
    ("register", ["register", "signup", "sign-up", "join"]),
    ("contact", ["contact", "contacts"]),
    ("support", ["support", "help", "faq"]),
    ("search", ["search"]),
    ("purchase", ["cart", "checkout", "buy", "order"]),
]

# Additional signal: input_type → action_type
_INPUT_TYPE_MAP = {
    "search": "search",
    "submit": "submit",
    "password": "login",
    "email": "login",       # email input is often part of login
    "file": "upload",
}


def classify_action(record: dict) -> str:
    """
    Return the best-guess action_type for a raw / enriched record.

    Checks, in order:
      1. Merged visible text + aria + placeholder
      2. href / route patterns
      3. input_type shortcuts
      4. Role-based heuristics
      5. Form submit heuristics

    Returns one of the action_type labels, or "unknown".
    """
    # ---- 1. Merge textual signals into one search string -----------------
    merged = _merge_signals(record)

    for action, patterns in _ACTION_PATTERNS:
        for pat in patterns:
            if pat in merged:
                return action

    # ---- 2. Check href / route -------------------------------------------
    href = (record.get("href") or "").lower()
    if is_likely_path(href):
        route = extract_route_hint(href).lower()
        for action, patterns in _HREF_PATTERNS:
            for pat in patterns:
                if pat in href or pat in route:
                    return action
        # Any meaningful href on an <a> is navigation
        if record.get("tag") == "a":
            return "navigate"

    # ---- 3. input_type shortcut ------------------------------------------
    input_type = (record.get("input_type") or "").lower()
    if input_type in _INPUT_TYPE_MAP:
        return _INPUT_TYPE_MAP[input_type]

    # ---- 4. Role-based heuristics ----------------------------------------
    role = (record.get("role") or "").lower()
    if role == "search":
        return "search"
    if role in ("navigation", "nav", "menu", "menubar"):
        return "menu"
    if role == "dialog":
        return "navigate"  # dialog is typically navigational context
    if role == "link":
        return "navigate"

    # ---- 5. Form submit heuristic ----------------------------------------
    tag = (record.get("tag") or "").lower()
    if tag == "form":
        return "submit"
    if tag == "button" and input_type == "submit":
        return "submit"

    return "unknown"


def get_confidence(record: dict, action_type: str) -> str:
    """
    Rough confidence level for the classification.
    
    high   — strong textual match or unambiguous input_type
    medium — href/route match or role match
    low    — fallback or unknown
    """
    if action_type == "unknown":
        return "low"

    # Check how many distinct signals agree
    merged = _merge_signals(record)
    href = (record.get("href") or "").lower()
    input_type = (record.get("input_type") or "").lower()

    signals = 0

    # Does the merged text contain any pattern for this action?
    for act, patterns in _ACTION_PATTERNS:
        if act == action_type:
            if any(p in merged for p in patterns):
                signals += 2  # text match is strong
            break

    # Does the href agree?
    for act, patterns in _HREF_PATTERNS:
        if act == action_type:
            if any(p in href for p in patterns):
                signals += 1
            break

    # Does input_type agree?
    if _INPUT_TYPE_MAP.get(input_type) == action_type:
        signals += 1

    if signals >= 3:
        return "high"
    if signals >= 1:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _merge_signals(record: dict) -> str:
    """Combine all textual signals into one lowercase string for matching."""
    parts = [
        record.get("text") or "",
        record.get("aria_label") or "",
        record.get("placeholder") or "",
        record.get("title") or "",
        record.get("alt") or "",
        record.get("context_text") or record.get("raw_context") or "",
    ]
    return " ".join(parts).lower()
