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
    context = await browser.new_context(
        user_agent=config.BROWSER_USER_AGENT
    )

    page = await context.new_page()

    try:
        # Use configurable wait strategy (default: domcontentloaded)
        try:
            await page.goto(url, wait_until=config.BROWSER_WAIT_STRATEGY,
                            timeout=config.PAGE_LOAD_TIMEOUT_MS)
        except Exception as e:
            # Check for Playwright-specific TimeoutError
            if "Timeout" in str(e):
                import logging
                logging.getLogger(__name__).warning(f"Timeout loading {url}, attempting partial extraction...")
            else:
                raise e
        
        # Give JS/React a moment to render (default: 2000ms)
        import asyncio
        await asyncio.sleep(config.BROWSER_SETTLE_MS / 1000.0)

        yield page

    finally:
        # Always clean up, even if extraction fails
        await context.close()
        await browser.close()
        # The 'playwright' variable here is the object from async_playwright().start()
        await playwright.stop()
