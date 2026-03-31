"""
main.py — CLI entry point for the DOM extraction pipeline.

Usage:
    python main.py <URL>
    python main.py https://example.com

Pipeline steps:
    1. Load the page with Playwright (headless Chromium)
    2. Extract interactive/accessible DOM elements
    3. Normalize them into a canonical schema
    4. Save the result as JSON
"""

import asyncio
import sys
import time

# Local imports
from extraction.browser import open_page
from extraction.extractor import extract_elements
from extraction.normalizer import normalize
from output.saver import save_to_json
import config


async def run_pipeline(url: str) -> str:
    """
    Execute the full extraction pipeline for a single URL.

    Returns the path to the saved JSON file.
    """
    print(f"\n{'='*60}")
    print(f"  DOM Extraction Pipeline")
    print(f"  Target: {url}")
    print(f"{'='*60}\n")

    start_time = time.time()

    # ---- Step 1: Load the page ------------------------------------------
    print("[1/4] Loading page...")
    async with open_page(url) as page:
        load_time = time.time() - start_time
        print(f"      Page loaded in {load_time:.2f}s")

        # ---- Step 2: Extract raw elements --------------------------------
        print("[2/4] Extracting DOM elements...")
        raw_elements = await extract_elements(page, url)
        print(f"      Found {len(raw_elements)} raw elements")

    # ---- Step 3: Normalize -----------------------------------------------
    print("[3/4] Normalizing elements...")
    normalized = normalize(raw_elements)
    print(f"      {len(normalized)} elements after normalization")

    # ---- Step 4: Save to JSON --------------------------------------------
    print("[4/4] Saving results...")
    output_path = save_to_json(normalized, url, config.OUTPUT_DIR)
    print(f"      Saved to: {output_path}")

    total_time = time.time() - start_time
    print(f"\n✅ Done in {total_time:.2f}s — {len(normalized)} elements extracted.\n")

    return output_path


def main():
    """Parse CLI arguments and run the pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python main.py <URL>")
        print("Example: python main.py https://example.com")
        sys.exit(1)

    url = sys.argv[1]

    # Validate that it looks like a URL
    if not url.startswith(("http://", "https://")):
        print(f"Error: '{url}' doesn't look like a valid URL.")
        print("Please include the protocol (http:// or https://)")
        sys.exit(1)

    asyncio.run(run_pipeline(url))


if __name__ == "__main__":
    main()
