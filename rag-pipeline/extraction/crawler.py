"""
crawler.py — Scope-bounded website crawler for the RAG pipeline.

Performs BFS crawling starting from a seed URL with multiple layers
of protection against infinite loops and irrelevant pages:

    1. Same-domain restriction
    2. Path-prefix scoping
    3. Max pages limit
    4. Max depth limit
    5. URL pattern exclusions (regex)
    6. URL normalization & deduplication
    7. robots.txt respect

Usage:
    from extraction.crawler import Crawler, CrawlConfig

    config = CrawlConfig(max_pages=20, max_depth=2)
    crawler = Crawler(config)
    results = await crawler.crawl("https://example.com")
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
import time
import requests
import xml.etree.ElementTree as ET
from collections import deque
from dataclasses import dataclass, field
from typing import List, Optional, Set
from urllib.parse import urlparse, urlunparse, urljoin
from urllib.robotparser import RobotFileParser

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Default exclusion patterns — common crawl traps
# ---------------------------------------------------------------------------

DEFAULT_EXCLUDE_PATTERNS: List[str] = [
    # Auth / session pages
    r"/login",
    r"/logout",
    r"/register",
    r"/signup",
    r"/auth",
    r"/oauth",
    r"/sso",
    r"/reset-password",
    r"/forgot-password",

    # Search & pagination
    r"[?&]page=",
    r"[?&]p=\d",
    r"/page/\d+",
    r"[?&]q=",
    r"[?&]query=",
    r"[?&]search=",
    r"/search",

    # Social / sharing
    r"[?&]share",
    r"[?&]retweet",
    r"/share\b",
    r"^mailto:",
    r"^tel:",
    r"^javascript:",

    # Language toggles
    r"[?&]lang=",
    r"[?&]hl=",
    r"[?&]locale=",

    # Media / binary files
    r"\.(pdf|docx?|xlsx?|pptx?|zip|rar|tar|gz|exe|dmg|apk)(\?|$)",
    r"\.(jpe?g|png|gif|svg|webp|ico|bmp|tiff?)(\?|$)",
    r"\.(mp[34]|mov|avi|wmv|flv|webm|ogg|wav)(\?|$)",
    r"\.(css|js|woff2?|ttf|eot)(\?|$)",

    # Feed / API
    r"/feed\b",
    r"/rss\b",
    r"/atom\b",
    r"/api/",
    r"/wp-json/",
    r"/xmlrpc",

    # Content-Heavy Pages (Articles, Blogs, Wiki, etc.)
    r"/blog",
    r"/news",
    r"/article",
    r"/post",
    r"/wiki",
    r"/press",
    r"/event",
    r"/help",
    r"/docs",  # Documentation often too heavy; user can override with --path-prefix if needed
    r"/tag",
    r"/category",
    r"/author",
    r"/user",
    r"/item",
    r"/products",  # Product catalogs can be infinite
    r"/collections",

    # Admin / CMS
    r"/wp-admin",
    r"/admin",
    r"/dashboard",
    r"/cgi-bin",

    # Anchors / fragments only (already handled by normalization,
    # but included as safety net)
    r"^#",
]


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CrawlConfig:
    """Configuration for the crawler."""

    max_pages: int = 50
    """Maximum number of pages to crawl."""

    max_depth: int = 3
    """Maximum click-depth from the seed URL (0 = seed only)."""

    same_domain_only: bool = True
    """Only follow links on the same domain as the seed."""

    path_prefix: Optional[str] = None
    """If set, only crawl URLs whose path starts with this prefix
    (e.g. '/docs/' to stay within documentation)."""

    exclude_patterns: List[str] = field(default_factory=list)
    """Additional regex patterns to exclude (merged with defaults)."""

    strip_query_params: bool = True
    """Strip query parameters when deduplicating URLs."""

    respect_robots_txt: bool = True
    """Honor robots.txt Disallow rules."""

    delay_seconds: float = 0.5
    """Polite delay between requests (seconds)."""

    max_template_instances: int = 3
    """Max times to crawl pages with identical structural signatures."""

    use_sitemap: bool = False
    """Pre-fill the crawl queue with URLs discovered from sitemap.xml."""


@dataclass
class CrawlResult:
    """Result from crawling a single page."""

    url: str
    depth: int
    elapsed_seconds: float
    elements: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# Crawler
# ---------------------------------------------------------------------------

class Crawler:
    """
    BFS-based website crawler with scope restrictions.

    The crawler discovers pages but does NOT extract DOM elements —
    that is the responsibility of the calling code which receives
    the list of discovered URLs.
    """

    def __init__(self, config: CrawlConfig | None = None):
        self.config = config or CrawlConfig()

        # Compile exclusion patterns (defaults + user-supplied)
        all_patterns = DEFAULT_EXCLUDE_PATTERNS + self.config.exclude_patterns
        self._exclude_re: List[re.Pattern] = [
            re.compile(p, re.IGNORECASE) for p in all_patterns
        ]

        # robots.txt cache: domain -> RobotFileParser | None
        self._robots_cache: dict[str, RobotFileParser | None] = {}

        # Tracking template signatures: signature -> count
        self.template_counts: dict[str, int] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def _fetch_sitemap_urls(self, seed_url: str) -> List[str]:
        """Fetch and parse sitemap.xml to find internal URLs."""
        base_parsed = urlparse(seed_url)
        base_origin = f"{base_parsed.scheme}://{base_parsed.netloc}"
        
        # Check robots.txt for Sitemaps first
        sitemap_candidates = []
        if self.config.respect_robots_txt and base_origin in self._robots_cache:
            rp = self._robots_cache[base_origin]
            if rp and rp.sitemaps:
                sitemap_candidates.extend(rp.sitemaps)
        
        # Add default locations if not found in robots.txt
        if not sitemap_candidates:
            sitemap_candidates = [
                f"{base_origin}/sitemap.xml",
                f"{base_origin}/sitemap_index.xml"
            ]
        
        urls = []
        for sm_url in sitemap_candidates:
            try:
                headers = {'User-Agent': config.BROWSER_USER_AGENT}
                response = requests.get(sm_url, headers=headers, timeout=10)
                if response.status_code == 200:
                    root = ET.fromstring(response.content)
                    # Handle XML namespaces
                    ns_match = re.match(r'\{(.*)\}', root.tag)
                    ns = {'ns': ns_match.group(1)} if ns_match else {}
                    
                    # Distinguish between sitemap and sitemapindex
                    is_index = "sitemapindex" in root.tag
                    
                    if is_index:
                        # Recursively fetch sub-sitemaps (just one level deep to avoid recursion loops)
                        locs = root.findall('.//ns:loc', ns) if ns else root.findall('.//loc')
                        for sub_loc in locs:
                            if sub_loc.text:
                                urls.extend(self._fetch_sitemap_urls(sub_loc.text))
                    else:
                        locs = root.findall('.//ns:loc', ns) if ns else root.findall('.//loc')
                        for loc in locs:
                            if loc.text:
                                urls.append(loc.text.strip())
                    
                    if urls: break
            except Exception as e:
                logger.debug("Sitemap discovery failed for %s: %s", sm_url, e)
        
        return urls

    async def crawl(self, seed_url: str) -> List[CrawlResult]:
        """
        Crawl from `seed_url` using BFS.

        Returns a list of CrawlResult for every successfully
        discovered (in-scope) URL, including the seed itself.
        The caller should then load each URL and run extraction.
        """
        seed_parsed = urlparse(seed_url)
        seed_domain = seed_parsed.netloc.lower()
        seed_normalized = self._normalize_url(seed_url)

        visited: Set[str] = set()
        results: List[CrawlResult] = []
        queue: deque[tuple[str, int]] = deque()

        # Enqueue seed
        queue.append((seed_normalized, 0))
        visited.add(seed_normalized)

        # Load robots.txt for the seed domain
        if self.config.respect_robots_txt:
            await self._load_robots_txt(seed_parsed.scheme, seed_domain)

        logger.info(
            "Crawl started: seed=%s, max_pages=%d, max_depth=%d",
            seed_url, self.config.max_pages, self.config.max_depth,
        )

        while queue and len(results) < self.config.max_pages:
            url, depth = queue.popleft()

            start = time.time()
            results.append(CrawlResult(
                url=url,
                depth=depth,
                elapsed_seconds=0,
            ))

            # Discover links on this page (done by caller via extract_page_links).
            # The crawler itself only manages the queue and scope.
            # We yield the URL and let the caller provide discovered links.
            results[-1].elapsed_seconds = time.time() - start

            logger.debug(
                "Queued: %s (depth=%d, total=%d/%d)",
                url, depth, len(results), self.config.max_pages,
            )

        logger.info(
            "Crawl plan complete: %d URLs discovered",
            len(results),
        )

        return results

    def discover_links(
        self,
        links: List[str],
        current_depth: int,
        seed_domain: str,
        visited: Set[str],
        queue: deque,
    ) -> int:
        """
        Filter and enqueue discovered links.
        Returns the number of new links added to the queue.
        """
        added = 0
        for raw_link in links:
            normalized = self._normalize_url(raw_link)
            if not normalized:
                continue

            if normalized in visited:
                continue

            if not self._is_in_scope(normalized, seed_domain):
                continue

            if self._is_excluded(normalized):
                continue

            if self.config.respect_robots_txt:
                if not self._is_allowed_by_robots(normalized):
                    logger.debug("Blocked by robots.txt: %s", normalized)
                    continue

            visited.add(normalized)
            queue.append((normalized, current_depth + 1))
            added += 1

        return added

    async def run(
        self,
        seed_url: str,
        page_processor,
    ) -> List[CrawlResult]:
        """
        Full crawl loop: BFS traversal with 1-pass extraction.

        Args:
            seed_url: The starting URL.
            page_processor: An async callable(page_url) -> Tuple[List[str], list]
                that loads a page and returns (all_links, raw_elements).

        Returns:
            List of CrawlResult for every non-duplicate page visited.
        """
        seed_parsed = urlparse(seed_url)
        seed_domain = seed_parsed.netloc.lower()
        seed_normalized = self._normalize_url(seed_url)

        visited: Set[str] = set()
        results: List[CrawlResult] = []
        queue: deque[tuple[str, int]] = deque()

        queue.append((seed_normalized, 0))
        visited.add(seed_normalized)

        if self.config.respect_robots_txt:
            await self._load_robots_txt(seed_parsed.scheme, seed_domain)

        logger.info(
            "Crawl started: seed=%s, max_pages=%d, max_depth=%d",
            seed_url, self.config.max_pages, self.config.max_depth,
        )

        # Pre-fill queue from sitemap if enabled
        if self.config.use_sitemap:
            logger.info("Attempting to discover URLs from sitemap...")
            sitemap_urls = self._fetch_sitemap_urls(seed_url)
            if sitemap_urls:
                added = self.discover_links(sitemap_urls, 0, seed_domain, visited, queue)
                logger.info("Sitemap discovery added %d URLs to queue", added)
            else:
                logger.info("No URLs found in sitemap.")

        while queue and len(results) < self.config.max_pages:
            url, depth = queue.popleft()

            start = time.time()

            # Extract links and elements in a single pass
            try:
                page_links, elements = await page_processor(url)
            except Exception as e:
                logger.warning("Failed to process %s: %s", url, e)
                page_links, elements = [], []

            elapsed = time.time() - start

            # Compute template signature to detect duplicate structures (e.g. articles)
            signature = self._compute_signature(elements)
            seen_count = self.template_counts.get(signature, 0) + 1
            self.template_counts[signature] = seen_count

            if seen_count > self.config.max_template_instances:
                logger.info(
                    "[%d/%d] Skipped %s (Template limit reached: %d)",
                    len(results) + 1, self.config.max_pages, url, seen_count
                )
                # DO NOT save elements and DO NOT enqueue links for this duplicate template
                continue

            results.append(CrawlResult(
                url=url,
                depth=depth,
                elapsed_seconds=elapsed,
                elements=elements,
            ))

            logger.info(
                "[%d/%d] Crawled: %s (depth=%d, links=%d, els=%d, %.2fs)",
                len(results), self.config.max_pages,
                url, depth, len(page_links), len(elements), elapsed,
            )

            # Only discover further links if we haven't hit max depth
            if depth < self.config.max_depth:
                added = self.discover_links(
                    page_links, depth, seed_domain, visited, queue,
                )
                if added:
                    logger.debug("  +%d new URLs queued", added)

            # Polite delay between requests
            if queue and self.config.delay_seconds > 0:
                await asyncio.sleep(self.config.delay_seconds)

        logger.info(
            "Crawl complete: %d pages visited, %d URLs still in queue",
            len(results), len(queue),
        )

        return results

    # ------------------------------------------------------------------
    # Template Detection
    # ------------------------------------------------------------------

    def _compute_signature(self, elements: list) -> str:
        """
        Compute a Run-Length Encoded (RLE) structural signature of the page.
        Abstracts away list lengths by collapsing contiguous identical elements.
        """
        if not elements:
            return "empty"
        
        signature_parts = []
        for el in elements:
            tag = el.get("tag", "unknown")
            classes = ".".join(sorted(el.get("class_list", [])))
            part = f"{tag}.{classes}"
            
            # Run-length encode: only append if different from the last element
            if not signature_parts or signature_parts[-1] != part:
                signature_parts.append(part)
                
        # Hash the resulting normalized structure
        full_string = " | ".join(signature_parts)
        return hashlib.md5(full_string.encode("utf-8")).hexdigest()

    # ------------------------------------------------------------------
    # URL normalization
    # ------------------------------------------------------------------

    def _normalize_url(self, url: str) -> str:
        """
        Normalize a URL for deduplication:
        - Strip fragment (#...)
        - Optionally strip query params (?...)
        - Lowercase scheme and host
        - Remove trailing slash (except for root path)
        """
        try:
            parsed = urlparse(url)
        except Exception:
            return ""

        # Skip non-HTTP URLs
        if parsed.scheme not in ("http", "https", ""):
            return ""

        # If no scheme, it's probably relative — skip
        if not parsed.netloc:
            return ""

        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()
        path = parsed.path

        # Remove trailing slash (keep root '/')
        if path != "/" and path.endswith("/"):
            path = path.rstrip("/")

        # Strip fragment always
        fragment = ""

        # Optionally strip query params
        query = "" if self.config.strip_query_params else parsed.query

        normalized = urlunparse((scheme, netloc, path, parsed.params, query, fragment))
        return normalized

    # ------------------------------------------------------------------
    # Scope checking
    # ------------------------------------------------------------------

    def _is_in_scope(self, url: str, seed_domain: str) -> bool:
        """Check if the URL is within the crawler's allowed scope."""
        parsed = urlparse(url)

        # Same domain check
        if self.config.same_domain_only:
            url_domain = parsed.netloc.lower()
            # Allow www. prefix mismatch
            seed_clean = seed_domain.removeprefix("www.")
            url_clean = url_domain.removeprefix("www.")
            if seed_clean != url_clean:
                return False

        # Path prefix check
        if self.config.path_prefix:
            if not parsed.path.startswith(self.config.path_prefix):
                return False

        return True

    def _is_excluded(self, url: str) -> bool:
        """Check if the URL matches any exclusion pattern."""
        for pattern in self._exclude_re:
            if pattern.search(url):
                return True
        return False

    # ------------------------------------------------------------------
    # robots.txt
    # ------------------------------------------------------------------

    async def _load_robots_txt(self, scheme: str, domain: str) -> None:
        """Fetch and parse robots.txt for the given domain."""
        if domain in self._robots_cache:
            return

        robots_url = f"{scheme}://{domain}/robots.txt"
        rp = RobotFileParser()
        rp.set_url(robots_url)

        try:
            # RobotFileParser.read() is blocking, run in executor
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, rp.read)
            self._robots_cache[domain] = rp
            logger.debug("Loaded robots.txt from %s", robots_url)
        except Exception as e:
            logger.debug(
                "Could not load robots.txt from %s: %s (allowing all)",
                robots_url, e,
            )
            self._robots_cache[domain] = None

    def _is_allowed_by_robots(self, url: str) -> bool:
        """Check if URL is allowed by the domain's robots.txt."""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        rp = self._robots_cache.get(domain)

        if rp is None:
            return True  # No robots.txt = allow everything

        return rp.can_fetch("*", url)
