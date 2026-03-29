"""
test_enrichment.py — Tests for the Step 2 enrichment pipeline.

Run with: python -m pytest tests/ -v
"""

import os
import sys

# Add rag-pipeline root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from enrichment.pipeline import enrich_records
from enrichment.action_classifier import classify_action, get_confidence
from enrichment.context_builder import build_context_summary, extract_label_text
from enrichment.keyword_generator import generate_keywords
from enrichment.semantic_text_builder import build_semantic_text, build_retrieval_text
from enrichment.intent_resolver import resolve_intents
from enrichment.normalizer_helpers import normalize_text, extract_route_hint
from enrichment.schema import empty_enriched_record, ENRICHED_SCHEMA


# ===========================================================================
# Schema tests
# ===========================================================================

def test_empty_enriched_record_has_all_fields():
    """Every field from ENRICHED_SCHEMA exists in an empty record."""
    record = empty_enriched_record()
    for key in ENRICHED_SCHEMA:
        assert key in record, f"Missing field: {key}"


def test_empty_record_lists_are_independent():
    """Mutable defaults (lists) should not be shared across records."""
    r1 = empty_enriched_record()
    r2 = empty_enriched_record()
    r1["keywords"].append("test")
    assert "test" not in r2["keywords"]


# ===========================================================================
# Normalizer helpers tests
# ===========================================================================

def test_normalize_text_basic():
    assert normalize_text("  Hello   World  ") == "hello world"
    assert normalize_text(None) == ""
    assert normalize_text("") == ""


def test_extract_route_hint():
    assert extract_route_hint("https://example.com/login") == "login"
    assert extract_route_hint("https://example.com/support/faq") == "support / faq"
    assert extract_route_hint("https://example.com/") == ""
    assert extract_route_hint(None) == ""


# ===========================================================================
# Action classifier tests
# ===========================================================================

def test_classify_login_button():
    record = {"tag": "button", "text": "Sign In", "href": None}
    assert classify_action(record) == "login"


def test_classify_search_input():
    record = {"tag": "input", "text": "", "placeholder": "Search...",
              "input_type": "search"}
    assert classify_action(record) == "search"


def test_classify_contact_link():
    record = {"tag": "a", "text": "Contact Us", "href": "/contact"}
    assert classify_action(record) == "contact"


def test_classify_russian_login():
    record = {"tag": "button", "text": "Войти"}
    assert classify_action(record) == "login"


def test_classify_kazakh_search():
    record = {"tag": "button", "text": "Іздеу"}
    assert classify_action(record) == "search"


def test_classify_submit_form():
    record = {"tag": "form", "text": "Application Form"}
    assert classify_action(record) == "submit"


def test_classify_unknown():
    record = {"tag": "div", "text": "Some random content"}
    assert classify_action(record) == "unknown"


def test_classify_navigate_link():
    record = {"tag": "a", "text": "More information", "href": "/about"}
    assert classify_action(record) == "navigate"


def test_classify_purchase():
    record = {"tag": "button", "text": "Buy now"}
    assert classify_action(record) == "purchase"


def test_confidence_login():
    record = {"tag": "button", "text": "Sign In", "href": "/login",
              "input_type": None}
    confidence = get_confidence(record, "login")
    assert confidence in ("medium", "high")


def test_confidence_unknown():
    record = {"tag": "div", "text": "stuff"}
    assert get_confidence(record, "unknown") == "low"


# ===========================================================================
# Context builder tests
# ===========================================================================

def test_context_summary_with_role():
    record = {"role": "search", "tag": "div", "label_text": None,
              "raw_context": "", "context_text": "", "href": None,
              "placeholder": None}
    summary = build_context_summary(record)
    assert "role" in summary.lower() or "search" in summary.lower()


def test_extract_label_from_aria():
    record = {"aria_label": "Close", "tag": "button",
              "placeholder": None, "title": None}
    assert extract_label_text(record) == "Close"


def test_extract_label_from_placeholder():
    record = {"aria_label": None, "tag": "input",
              "placeholder": "Your email", "title": None}
    assert extract_label_text(record) == "Your email"


# ===========================================================================
# Keyword generator tests
# ===========================================================================

def test_keywords_for_login():
    record = {"text": "Login", "aria_label": None,
              "placeholder": None, "title": None, "alt": None, "href": None}
    keywords = generate_keywords(record, "login")
    assert "login" in keywords
    assert "sign in" in keywords


def test_keywords_for_contact():
    record = {"text": "Contact Us", "aria_label": None,
              "placeholder": None, "title": None, "alt": None, "href": None}
    keywords = generate_keywords(record, "contact")
    assert "contact" in keywords
    assert "reach us" in keywords or "call us" in keywords


def test_keywords_include_route():
    record = {"text": "Support", "aria_label": None,
              "placeholder": None, "title": None, "alt": None,
              "href": "/help/faq"}
    keywords = generate_keywords(record, "support")
    assert "help" in keywords
    assert "faq" in keywords


# ===========================================================================
# Semantic text builder tests
# ===========================================================================

def test_semantic_text_login_button():
    record = {
        "tag": "button",
        "text": "Sign In",
        "action_type": "login",
        "label_text": None,
        "aria_label": None,
        "placeholder": None,
        "input_type": None,
        "href": None,
        "context_summary": "",
    }
    text = build_semantic_text(record)
    assert "Sign In" in text
    assert "Button" in text
    assert "login" in text.lower() or "authentication" in text.lower()


def test_semantic_text_search_input():
    record = {
        "tag": "input",
        "text": "",
        "action_type": "search",
        "label_text": "Search Wikipedia",
        "aria_label": None,
        "placeholder": "Search...",
        "input_type": "search",
        "href": None,
        "context_summary": "",
    }
    text = build_semantic_text(record)
    assert "search" in text.lower()


def test_retrieval_text_includes_keywords():
    record = {
        "tag": "a",
        "text": "Contact",
        "action_type": "contact",
        "label_text": None,
        "aria_label": None,
        "placeholder": None,
        "title": None,
        "alt": None,
        "normalized_text": "contact",
        "role": None,
        "href": "/contacts",
        "keywords": ["contact", "reach us", "call us"],
        "context_summary": "",
    }
    text = build_retrieval_text(record)
    assert "contact" in text.lower()
    assert "reach us" in text.lower()


# ===========================================================================
# Intent resolver tests
# ===========================================================================

def test_intents_for_login():
    record = {"text": "Sign In", "aria_label": None,
              "placeholder": None, "title": None, "tag": "button"}
    intents = resolve_intents(record, "login")
    assert len(intents) > 0
    assert any("account" in i for i in intents)


def test_intents_include_custom():
    record = {"text": "Submit Application", "aria_label": None,
              "placeholder": None, "title": None, "tag": "button"}
    intents = resolve_intents(record, "submit")
    # Should have custom intent like 'press the "Submit Application" button'
    assert any("Submit Application" in i for i in intents)


# ===========================================================================
# Full pipeline integration test
# ===========================================================================

def test_full_pipeline_enrichment():
    """End-to-end: enrich a set of raw records and validate the output."""
    raw_records = [
        {
            "page_url": "https://example.com",
            "tag": "button",
            "text": "Sign In",
            "aria_label": None,
            "placeholder": None,
            "title": None,
            "alt": None,
            "role": None,
            "input_type": None,
            "id": "btn-login",
            "class_list": ["btn", "btn-primary"],
            "name": None,
            "href": None,
            "is_visible": True,
            "is_enabled": True,
            "css_selector": "#btn-login",
            "xpath": "/html/body/form/button",
            "context_text": "Login to your account",
            "semantic_text": "button: Sign In",
        },
        {
            "page_url": "https://example.com",
            "tag": "a",
            "text": "Contact Us",
            "aria_label": None,
            "placeholder": None,
            "title": None,
            "alt": None,
            "role": None,
            "input_type": None,
            "id": None,
            "class_list": [],
            "name": None,
            "href": "/contact",
            "is_visible": True,
            "is_enabled": True,
            "css_selector": "a.contact-link",
            "xpath": "/html/body/nav/a[3]",
            "context_text": "Home About Contact Us",
            "semantic_text": "a: Contact Us",
        },
        {
            "page_url": "https://example.com",
            "tag": "input",
            "text": "",
            "aria_label": None,
            "placeholder": "Search...",
            "title": None,
            "alt": None,
            "role": None,
            "input_type": "search",
            "id": "search-input",
            "class_list": ["search-field"],
            "name": "q",
            "href": None,
            "is_visible": True,
            "is_enabled": True,
            "css_selector": "#search-input",
            "xpath": "/html/body/header/form/input",
            "context_text": "Search our site",
            "semantic_text": "input: [placeholder=Search...]",
        },
    ]

    enriched = enrich_records(raw_records, page_url="https://example.com")

    assert len(enriched) == 3

    # --- Validate the login button ---
    login_btn = enriched[0]
    assert login_btn["action_type"] == "login"
    assert login_btn["is_clickable"] is True
    assert login_btn["is_form_control"] is False
    assert login_btn["element_id"]  # non-empty
    assert "sign in" in login_btn["normalized_text"]
    assert len(login_btn["keywords"]) > 0
    assert "login" in login_btn["keywords"]
    assert len(login_btn["semantic_text"]) > 10
    assert len(login_btn["retrieval_text"]) > 10
    assert len(login_btn["candidate_intents"]) > 0
    assert login_btn["confidence_hint"] in ("low", "medium", "high")

    # --- Validate the contact link ---
    contact_link = enriched[1]
    assert contact_link["action_type"] == "contact"
    assert contact_link["is_clickable"] is True
    assert "contact" in contact_link["keywords"]
    assert contact_link["href"] == "/contact"

    # --- Validate the search input ---
    search_input = enriched[2]
    assert search_input["action_type"] == "search"
    assert search_input["is_form_control"] is True
    assert search_input["label_text"] == "Search..."  # from placeholder
    assert "search" in search_input["keywords"]


def test_pipeline_handles_empty_records():
    """Pipeline should handle minimal / empty records gracefully."""
    raw = [{"tag": "div", "text": ""}]
    enriched = enrich_records(raw)
    assert len(enriched) == 1
    assert enriched[0]["action_type"] == "unknown"
    assert enriched[0]["element_id"]  # should still get an ID


def test_pipeline_preserves_page_url():
    """Fallback page_url should be used when raw records lack one."""
    raw = [{"tag": "button", "text": "OK"}]
    enriched = enrich_records(raw, page_url="https://fallback.com")
    assert enriched[0]["page_url"] == "https://fallback.com"
