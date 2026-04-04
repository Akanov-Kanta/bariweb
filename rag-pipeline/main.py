"""
main.py — CLI entry point for the DOM extraction pipeline.

Usage:
    # Single page (existing behavior):
    python main.py <URL>
    python main.py https://example.com

    # Multi-page crawl:
    python main.py <URL> --crawl
    python main.py <URL> --crawl --max-pages 20 --max-depth 2
    python main.py <URL> --crawl --path-prefix /docs/

Pipeline steps (single page):
    1. Load the page with Playwright (headless Chromium)
    2. Extract interactive/accessible DOM elements
    3. Normalize them into a canonical schema
    4. Save the result as JSON

Pipeline steps (crawl mode):
    1. BFS-crawl the site within scope boundaries
    2. For each page: extract → normalize → save
"""

import argparse
import asyncio
import sys
import time

# Config is lightweight — safe to import at module level
import config


async def run_pipeline(url: str) -> str:
    """
    Execute the full extraction pipeline for a single URL.

    Returns the path to the saved JSON file.
    """
    from extraction.browser import open_page
    from extraction.extractor import extract_elements
    from extraction.normalizer import normalize
    from output.saver import save_to_json

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


async def run_crawl_pipeline(
    url: str,
    max_pages: int | None = None,
    max_depth: int | None = None,
    path_prefix: str | None = None,
    use_sitemap: bool = False,
) -> list[str]:
    """
    Execute the multi-page crawl + extraction pipeline.

    BFS-crawls from `url` within scope, then extracts DOM elements
    from each discovered page.

    Returns a list of saved JSON file paths.
    """
    from extraction.browser import open_page
    from extraction.extractor import extract_elements, extract_page_links
    from extraction.normalizer import normalize
    from extraction.crawler import Crawler, CrawlConfig
    from output.saver import save_to_json
    crawl_config = CrawlConfig(
        max_pages=max_pages or config.CRAWL_MAX_PAGES,
        max_depth=max_depth if max_depth is not None else config.CRAWL_MAX_DEPTH,
        same_domain_only=config.CRAWL_SAME_DOMAIN_ONLY,
        path_prefix=path_prefix,
        exclude_patterns=config.CRAWL_EXCLUDE_PATTERNS,
        strip_query_params=config.CRAWL_STRIP_QUERY_PARAMS,
        respect_robots_txt=config.CRAWL_RESPECT_ROBOTS_TXT,
        delay_seconds=config.CRAWL_DELAY_SECONDS,
        max_template_instances=config.CRAWL_MAX_TEMPLATE_INSTANCES,
        use_sitemap=use_sitemap,
    )

    print(f"\n{'='*60}")
    print(f"  DOM Extraction Pipeline (Crawl Mode)")
    print(f"  Seed:       {url}")
    print(f"  Max Pages:  {crawl_config.max_pages}")
    print(f"  Max Depth:  {crawl_config.max_depth}")
    if path_prefix:
        print(f"  Path Scope: {path_prefix}")
    print(f"{'='*60}\n")

    crawler = Crawler(crawl_config)
    start_time = time.time()

    # Define the one-pass page processor
    async def page_processor(page_url: str) -> tuple[list[str], list]:
        async with open_page(page_url) as page:
            raw_elements = await extract_elements(page, page_url)
            normalized = normalize(raw_elements)
            links = await extract_page_links(page, page_url)
            return links, normalized

    # Run BFS crawl and extraction in one pass
    print("[1/2] Crawling site and extracting elements in one pass...")
    results = await crawler.run(url, page_processor)
    print(f"      Discovered & processed {len(results)} pages\n")

    print("[2/2] Saving extracted elements...")
    output_paths = []
    total_elements = 0

    for i, result in enumerate(results, 1):
        if not result.elements:
            continue
        try:
            output_path = save_to_json(result.elements, result.url, config.OUTPUT_DIR)
            output_paths.append(output_path)
            total_elements += len(result.elements)
            print(f"  [{i}/{len(results)}] {len(result.elements)} elements → {output_path}")
        except Exception as e:
            print(f"           ⚠ Error saving {result.url}: {e}")

    total_time = time.time() - start_time

    # Summary
    print(f"\n{'='*60}")
    print(f"  ✅ Crawl complete!")
    print(f"  Pages:    {len(output_paths)}/{len(results)}")
    print(f"  Elements: {total_elements}")
    print(f"  Time:     {total_time:.2f}s")
    print(f"{'='*60}\n")

    return output_paths


def main():
    """Parse CLI arguments and run the pipeline."""
    import logging
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    parser = argparse.ArgumentParser(
        description="DOM Extraction Pipeline — extract interactive elements from web pages.",
    )
    parser.add_argument(
        "url",
        help="URL to extract from (must include http:// or https://)",
    )
    parser.add_argument(
        "--crawl",
        action="store_true",
        help="Enable multi-page crawl mode (BFS within scope)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help=f"Maximum pages to crawl (default: {config.CRAWL_MAX_PAGES})",
    )
    parser.add_argument(
        "--max-depth",
        type=int,
        default=None,
        help=f"Maximum crawl depth from seed (default: {config.CRAWL_MAX_DEPTH})",
    )
    parser.add_argument(
        "--path-prefix",
        type=str,
        default=None,
        help="Restrict crawling to URLs with this path prefix (e.g. /docs/)",
    )
    parser.add_argument(
        "--sitemap",
        action="store_true",
        help=f"Use sitemap.xml for discovery (default: {config.CRAWL_USE_SITEMAP})",
    )

    args = parser.parse_args()

    # Validate URL
    if not args.url.startswith(("http://", "https://")):
        print(f"Error: '{args.url}' doesn't look like a valid URL.")
        print("Please include the protocol (http:// or https://)")
        sys.exit(1)

    if args.crawl:
        asyncio.run(run_crawl_pipeline(
            url=args.url,
            max_pages=args.max_pages,
            max_depth=args.max_depth,
            path_prefix=args.path_prefix,
            use_sitemap=args.sitemap or config.CRAWL_USE_SITEMAP,
        ))
    else:
        asyncio.run(run_pipeline(args.url))


if __name__ == "__main__":
    main()
