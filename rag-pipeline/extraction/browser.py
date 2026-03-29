"""
browser.py — Playwright page loading and lifecycle management.

Responsibilities:
  - Launch a headless browser
  - Navigate to a URL
  - Wait until the page is fully loaded (network idle)
  - Return the Page handle for extraction
  - Clean up browser resources on exit

This module is intentionally thin so we can later add:
  - stealth plugins (to avoid bot detection)
  - cookie/session handling
  - multiple browser support
"""

from contextlib import asynccontextmanager
from playwright.async_api import async_playwright, Page

import sys
import os

# Allow imports from the rag-pipeline root
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


@asynccontextmanager
async def open_page(url: str) -> Page:
    """
    Context manager that launches a browser, navigates to `url`,
    waits for the page to settle, and yields the Page object.

    Usage:
        async with open_page("https://example.com") as page:
            # page is fully loaded and ready for DOM queries
            ...
    """
    playwright = await async_playwright().start()

    browser = await playwright[config.BROWSER_TYPE].launch(
        headless=config.HEADLESS,
    )

    # Create a new browser context (isolated cookies/storage)
    context = await browser.new_context()

    page = await context.new_page()

    try:
        # Navigate and wait until no network requests for 500ms
        await page.goto(url, wait_until="networkidle",
                        timeout=config.PAGE_LOAD_TIMEOUT_MS)

        yield page

    finally:
        # Always clean up, even if extraction fails
        await context.close()
        await browser.close()
        await playwright.stop()
