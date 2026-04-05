"""
Central configuration for the RAG pipeline.

All tunable parameters live here so other modules
stay free of magic strings and numbers.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ---------------------------------------------------------------------------
# Browser / Playwright settings
# ---------------------------------------------------------------------------

# Maximum time (ms) to wait for a page to reach "networkidle" state.
PAGE_LOAD_TIMEOUT_MS = 30_000

# Playwright browser to use. Chromium is the most reliable for scraping.
BROWSER_TYPE = "chromium"

# Run the browser without a visible window.
HEADLESS = True

# Ignore SSL errors (useful for local development sites like localhost:5173)
IGNORE_HTTPS_ERRORS = os.environ.get("IGNORE_HTTPS_ERRORS", "true").lower() == "true"

# User Agent to avoid being blocked as a bot.
BROWSER_USER_AGENT = os.environ.get(
    "BROWSER_USER_AGENT",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

# Wait strategy for page.goto. 'networkidle' is strict; 'domcontentloaded' is faster.
BROWSER_WAIT_STRATEGY = os.environ.get("BROWSER_WAIT_STRATEGY", "domcontentloaded")

# Manual settle time (ms) after wait_until fires.
BROWSER_SETTLE_MS = int(os.environ.get("BROWSER_SETTLE_MS", "2000"))

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
ALEM_EMBEDDINGS_DIMENSION = 1024  # Assuming the text-1024 model produces 1024d vectors

# ---------------------------------------------------------------------------
# Project Backend Settings (Step 5 Integration)
# ---------------------------------------------------------------------------

# Main backend URL used for Authentication validation
BACKEND_API_URL = os.environ.get("BACKEND_API_URL", "http://localhost:8000")

# Set to True to enable Milvus backend integration
USE_MILVUS = os.environ.get("USE_MILVUS", "false").lower() == "true"

# Set to True to enable RAGFlow semantic retrieval coupled with Milvus
USE_RAGFLOW = os.environ.get("USE_RAGFLOW", "false").lower() == "true"

# Milvus Settings
MILVUS_SERVER = os.environ.get("MILVUS_SERVER", "https://a1-milvus1.alem.ai")
MILVUS_PORT = os.environ.get("MILVUS_PORT", "")
MILVUS_USER = os.environ.get("MILVUS_USER", "")
MILVUS_PASSWORD = os.environ.get("MILVUS_PASSWORD", "")
MILVUS_DB = os.environ.get("MILVUS_DB", "default")
MILVUS_COLLECTION = os.environ.get("MILVUS_COLLECTION", "arifalta_dom_elements")

# RAGFlow Settings
RAGFLOW_API_URL = os.environ.get("RAGFLOW_API_URL", "https://a1-ragflow1.alem.ai/api/v1")
RAGFLOW_API_KEY = os.environ.get("RAGFLOW_API_KEY", "")
RAGFLOW_DATASET_ID = os.environ.get("RAGFLOW_DATASET_ID", "")



# ---------------------------------------------------------------------------
# Crawler settings
# ---------------------------------------------------------------------------

# Maximum number of pages to crawl from a seed URL.
CRAWL_MAX_PAGES = int(os.environ.get("CRAWL_MAX_PAGES", "50"))

# Maximum click-depth from the seed URL (0 = seed page only).
CRAWL_MAX_DEPTH = int(os.environ.get("CRAWL_MAX_DEPTH", "3"))

# Polite delay between requests (seconds).
CRAWL_DELAY_SECONDS = float(os.environ.get("CRAWL_DELAY_SECONDS", "0.5"))

# Only follow links on the same domain as the seed URL.
CRAWL_SAME_DOMAIN_ONLY = os.environ.get(
    "CRAWL_SAME_DOMAIN_ONLY", "true"
).lower() == "true"

# Strip query parameters when deduplicating URLs.
CRAWL_STRIP_QUERY_PARAMS = os.environ.get(
    "CRAWL_STRIP_QUERY_PARAMS", "true"
).lower() == "true"

# Honor robots.txt Disallow rules.
CRAWL_RESPECT_ROBOTS_TXT = os.environ.get(
    "CRAWL_RESPECT_ROBOTS_TXT", "true"
).lower() == "true"

# Comma-separated additional regex patterns to exclude from crawling.
_raw_exclude = os.environ.get("CRAWL_EXCLUDE_PATTERNS", "")
CRAWL_EXCLUDE_PATTERNS = [
    p.strip() for p in _raw_exclude.split(",") if p.strip()
]

# Maximum number of identical page templates to process before pruning the branch.
CRAWL_MAX_TEMPLATE_INSTANCES = int(
    os.environ.get("CRAWL_MAX_TEMPLATE_INSTANCES", "3")
)

# Use sitemap.xml for discovery before falling back to link crawling.
CRAWL_USE_SITEMAP = os.environ.get("CRAWL_USE_SITEMAP", "false").lower() == "true"

