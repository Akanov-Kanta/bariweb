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

# Directory where vector index files are saved (Step 3 output).
INDEX_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "index")

# ---------------------------------------------------------------------------
# Embeddings settings (Step 3)
# ---------------------------------------------------------------------------

# The API key must be set in the environment variable.
# NEVER hardcode it here or in any source file.
# Export it before running:  export ALEM_EMBEDDINGS_API_KEY=sk-...
ALEM_EMBEDDINGS_BASE_URL = os.environ.get(
    "ALEM_EMBEDDINGS_BASE_URL", "https://llm.alem.ai/v1"
)
ALEM_EMBEDDINGS_MODEL = os.environ.get(
    "ALEM_EMBEDDINGS_MODEL", "text-1024"
)
