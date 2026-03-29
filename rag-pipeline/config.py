"""
Central configuration for the RAG pipeline.

All tunable parameters live here so other modules
stay free of magic strings and numbers.
"""

import os

# ---------------------------------------------------------------------------
# Browser / Playwright settings
# ---------------------------------------------------------------------------

# Maximum time (ms) to wait for a page to reach "networkidle" state.
PAGE_LOAD_TIMEOUT_MS = 30_000

# Playwright browser to use. Chromium is the most reliable for scraping.
BROWSER_TYPE = "chromium"

# Run the browser without a visible window.
HEADLESS = True

# ---------------------------------------------------------------------------
# DOM extraction settings
# ---------------------------------------------------------------------------

# CSS selectors for interactive / accessible elements we care about.
# These are combined with a comma into one querySelectorAll call.
TARGET_SELECTORS = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    "form",
    "label",
    "[aria-label]",
    "[role]",
    "[placeholder]",
    "[title]",
    "[alt]",
]

# HTML attributes to read from every matched element.
ATTRIBUTES_TO_COLLECT = [
    "id",
    "class",
    "name",
    "href",
    "type",
    "placeholder",
    "title",
    "alt",
    "aria-label",
    "role",
    "value",
    "for",
    "action",
    "method",
]

# ---------------------------------------------------------------------------
# Output settings
# ---------------------------------------------------------------------------

# Directory where JSON results are saved (relative to rag-pipeline/).
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "results")

# Directory where enriched JSON results are saved (Step 2 output).
ENRICHED_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "results_enriched")
