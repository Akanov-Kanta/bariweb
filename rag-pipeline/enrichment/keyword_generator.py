"""
keyword_generator.py — Expand each element into a keyword / synonym list.

This helps future retrieval by bridging the vocabulary gap between
what the user says ("find contacts") and what the DOM contains
("a: Contact Us").

The approach is:
    1. Start with tokens extracted from the element's text signals.
    2. Add synonyms from a curated expansion table.
    3. Add action-type keywords.
    4. Deduplicate and return.

Extension point for Step 3:
    - Use an embedding model or thesaurus API for richer expansion.
"""

from __future__ import annotations

import re
from typing import List

from .normalizer_helpers import normalize_text, extract_route_hint


# ---------------------------------------------------------------------------
# Synonym / expansion table
# Maps a trigger word to additional search terms a user might say.
# Keep this focused and practical — not exhaustive.
# ---------------------------------------------------------------------------

_SYNONYM_TABLE: dict[str, list[str]] = {
    # English
    "login": ["sign in", "log in", "enter account", "authentication"],
    "signin": ["login", "sign in", "log in"],
    "logout": ["sign out", "log out", "exit account"],
    "signout": ["logout", "sign out", "log out"],
    "register": ["sign up", "create account", "join", "registration"],
    "signup": ["register", "sign up", "create account"],
    "search": ["find", "look up", "lookup", "query"],
    "find": ["search", "look up", "locate"],
    "contact": ["contacts", "reach us", "call us", "get in touch"],
    "contacts": ["contact", "reach us", "call us"],
    "support": ["help", "assistance", "customer service", "faq"],
    "help": ["support", "assistance", "faq"],
    "submit": ["send", "apply", "confirm"],
    "send": ["submit", "dispatch"],
    "apply": ["submit", "request"],
    "buy": ["purchase", "order", "checkout"],
    "purchase": ["buy", "order", "checkout", "acquire"],
    "cart": ["basket", "shopping cart", "bag"],
    "checkout": ["pay", "complete order", "finalize"],
    "download": ["get", "save", "export"],
    "upload": ["attach", "import"],
    "menu": ["navigation", "nav", "hamburger"],
    "close": ["dismiss", "exit", "hide"],
    "cancel": ["abort", "undo", "go back"],
    "delete": ["remove", "erase", "trash"],
    "filter": ["refine", "narrow", "sort"],
    "settings": ["preferences", "options", "configuration"],
    "profile": ["account", "my page", "user"],
    "home": ["main page", "start", "homepage"],

    # Russian
    "войти": ["вход", "авторизация", "логин"],
    "вход": ["войти", "авторизация"],
    "выйти": ["выход", "разлогиниться"],
    "регистрация": ["создать аккаунт", "зарегистрироваться"],
    "поиск": ["найти", "искать", "запрос"],
    "найти": ["поиск", "искать"],
    "контакты": ["связаться", "позвонить", "написать"],
    "поддержка": ["помощь", "справка", "служба поддержки"],
    "помощь": ["поддержка", "справка"],
    "отправить": ["послать", "подтвердить"],
    "купить": ["заказать", "приобрести", "оформить"],
    "скачать": ["загрузить", "сохранить"],
    "меню": ["навигация"],
    "закрыть": ["свернуть", "скрыть"],
    "удалить": ["убрать", "стереть"],
    "фильтр": ["сортировка", "отбор"],
    "настройки": ["параметры", "опции"],
    "профиль": ["аккаунт", "личный кабинет"],
    "главная": ["домашняя", "начальная страница"],

    # Kazakh (basic)
    "кіру": ["авторизация", "вход"],
    "іздеу": ["поиск", "табу"],
    "байланыс": ["контакты"],
    "көмек": ["поддержка", "help"],
    "жіберу": ["отправить"],
}

# Keywords associated with each action_type
_ACTION_KEYWORDS: dict[str, list[str]] = {
    "login": ["login", "sign in", "authentication", "войти", "вход"],
    "logout": ["logout", "sign out", "выйти"],
    "register": ["register", "sign up", "create account", "регистрация"],
    "search": ["search", "find", "поиск", "найти", "іздеу"],
    "submit": ["submit", "send", "apply", "отправить"],
    "contact": ["contact", "reach", "контакты", "байланыс"],
    "support": ["support", "help", "faq", "поддержка", "көмек"],
    "purchase": ["buy", "purchase", "checkout", "купить"],
    "navigate": ["go to", "open", "navigate", "view", "перейти"],
    "menu": ["menu", "navigation", "меню"],
    "filter": ["filter", "sort", "refine", "фильтр"],
    "download": ["download", "save", "скачать"],
    "upload": ["upload", "attach"],
    "close": ["close", "dismiss", "закрыть"],
    "cancel": ["cancel", "undo", "отмена"],
    "delete": ["delete", "remove", "удалить"],
}


def generate_keywords(record: dict, action_type: str) -> List[str]:
    """
    Build a keyword list for the given record.

    Steps:
        1. Extract meaningful tokens from text signals.
        2. Expand via synonym table.
        3. Add action-type keywords.
        4. Deduplicate, preserving order.
    """
    keywords: list[str] = []

    # 1. Extract base tokens from all text signals
    base_tokens = _extract_tokens(record)
    keywords.extend(base_tokens)

    # 2. Synonym expansion
    for token in base_tokens:
        expansions = _SYNONYM_TABLE.get(token, [])
        keywords.extend(expansions)

    # 3. Action-type keywords
    if action_type and action_type != "unknown":
        action_kws = _ACTION_KEYWORDS.get(action_type, [])
        keywords.extend(action_kws)

    # 4. Route-based keywords
    href = record.get("href") or ""
    if href:
        route = extract_route_hint(href)
        if route:
            route_tokens = route.lower().replace("/", " ").split()
            keywords.extend(route_tokens)

    # Deduplicate while preserving order
    return _deduplicate(keywords)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Words too common to be useful as keywords
_STOP_WORDS = frozenset({
    "the", "a", "an", "is", "are", "was", "were", "be",
    "to", "of", "in", "for", "on", "with", "at", "by",
    "it", "this", "that", "and", "or", "not", "no",
    "и", "в", "на", "с", "по", "к", "у", "из", "за",
    "от", "до", "о", "для", "не", "да", "но", "же",
})


def _extract_tokens(record: dict) -> list[str]:
    """Pull meaningful lowercase tokens from text, aria-label, title, etc."""
    sources = [
        record.get("text"),
        record.get("aria_label"),
        record.get("placeholder"),
        record.get("title"),
        record.get("alt"),
    ]

    tokens = []
    for source in sources:
        if not source:
            continue
        # Lowercase and split on non-alphanumeric (keep unicode letters)
        words = re.findall(r"[\w]+", source.lower(), re.UNICODE)
        for word in words:
            if word not in _STOP_WORDS and len(word) > 1:
                tokens.append(word)

    return tokens


def _deduplicate(items: list[str]) -> list[str]:
    """Remove duplicates while preserving first-occurrence order."""
    seen = set()
    result = []
    for item in items:
        lower = item.lower().strip()
        if lower and lower not in seen:
            seen.add(lower)
            result.append(lower)
    return result
