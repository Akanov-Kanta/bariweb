"""
test_crawler.py — Unit tests for the smart crawler.

Tests URL normalization, scope checking, exclusion patterns,
depth/page limits, and link extraction.

Run with: python -m pytest tests/test_crawler.py -v
"""

import os
import sys

import pytest

# Add rag-pipeline root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from extraction.crawler import Crawler, CrawlConfig, DEFAULT_EXCLUDE_PATTERNS


# ---------------------------------------------------------------------------
# URL Normalization
# ---------------------------------------------------------------------------

class TestUrlNormalization:
    """Tests for Crawler._normalize_url()"""

    def _crawler(self, **kwargs) -> Crawler:
        return Crawler(CrawlConfig(**kwargs))

    def test_strips_fragment(self):
        c = self._crawler()
        assert c._normalize_url("https://example.com/page#section") == "https://example.com/page"

    def test_strips_query_params_by_default(self):
        c = self._crawler(strip_query_params=True)
        assert c._normalize_url("https://example.com/page?foo=bar&baz=1") == "https://example.com/page"

    def test_preserves_query_params_when_disabled(self):
        c = self._crawler(strip_query_params=False)
        result = c._normalize_url("https://example.com/page?foo=bar")
        assert "foo=bar" in result

    def test_lowercases_scheme_and_host(self):
        c = self._crawler()
        assert c._normalize_url("HTTPS://EXAMPLE.COM/Page") == "https://example.com/Page"

    def test_removes_trailing_slash(self):
        c = self._crawler()
        assert c._normalize_url("https://example.com/page/") == "https://example.com/page"

    def test_keeps_root_slash(self):
        c = self._crawler()
        assert c._normalize_url("https://example.com/") == "https://example.com/"

    def test_rejects_mailto(self):
        c = self._crawler()
        assert c._normalize_url("mailto:user@example.com") == ""

    def test_rejects_javascript(self):
        c = self._crawler()
        assert c._normalize_url("javascript:void(0)") == ""

    def test_rejects_relative_url(self):
        c = self._crawler()
        assert c._normalize_url("/relative/path") == ""


# ---------------------------------------------------------------------------
# Scope Checking
# ---------------------------------------------------------------------------

class TestScopeChecking:
    """Tests for Crawler._is_in_scope()"""

    def test_same_domain_allows_match(self):
        c = Crawler(CrawlConfig(same_domain_only=True))
        assert c._is_in_scope("https://example.com/about", "example.com") is True

    def test_same_domain_blocks_different(self):
        c = Crawler(CrawlConfig(same_domain_only=True))
        assert c._is_in_scope("https://other.com/page", "example.com") is False

    def test_same_domain_allows_www_mismatch(self):
        c = Crawler(CrawlConfig(same_domain_only=True))
        assert c._is_in_scope("https://www.example.com/page", "example.com") is True
        assert c._is_in_scope("https://example.com/page", "www.example.com") is True

    def test_same_domain_disabled(self):
        c = Crawler(CrawlConfig(same_domain_only=False))
        assert c._is_in_scope("https://other.com/page", "example.com") is True

    def test_path_prefix_allows_match(self):
        c = Crawler(CrawlConfig(path_prefix="/docs/"))
        assert c._is_in_scope("https://example.com/docs/api", "example.com") is True

    def test_path_prefix_blocks_mismatch(self):
        c = Crawler(CrawlConfig(path_prefix="/docs/"))
        assert c._is_in_scope("https://example.com/blog/post", "example.com") is False

    def test_no_path_prefix_allows_all(self):
        c = Crawler(CrawlConfig(path_prefix=None))
        assert c._is_in_scope("https://example.com/any/path", "example.com") is True


# ---------------------------------------------------------------------------
# Exclusion Patterns
# ---------------------------------------------------------------------------

class TestExclusionPatterns:
    """Tests for Crawler._is_excluded()"""

    def _crawler(self) -> Crawler:
        return Crawler(CrawlConfig())

    def test_excludes_login(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/login") is True

    def test_excludes_search_query(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/results?q=test") is True

    def test_excludes_pagination(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/blog?page=2") is True
        assert c._is_excluded("https://example.com/page/3") is True

    def test_excludes_pdf(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/docs/report.pdf") is True

    def test_excludes_images(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/image.jpg") is True
        assert c._is_excluded("https://example.com/logo.png") is True

    def test_excludes_css_js(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/style.css") is True
        assert c._is_excluded("https://example.com/app.js") is True

    def test_excludes_mailto(self):
        c = self._crawler()
        assert c._is_excluded("mailto:user@example.com") is True

    def test_excludes_api_endpoints(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/api/v1/data") is True

    def test_excludes_wp_admin(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/wp-admin/settings") is True

    def test_allows_normal_page(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/about") is False
        assert c._is_excluded("https://example.com/catalog/widget") is False
        assert c._is_excluded("https://example.com/contact") is False

    def test_custom_exclude_pattern(self):
        c = Crawler(CrawlConfig(exclude_patterns=[r"/internal/"]))
        assert c._is_excluded("https://example.com/internal/page") is True
        assert c._is_excluded("https://example.com/public/page") is False

    def test_excludes_language_toggles(self):
        c = self._crawler()
        assert c._is_excluded("https://example.com/page?lang=en") is True
        assert c._is_excluded("https://example.com/page?hl=ru") is True


# ---------------------------------------------------------------------------
# Link Discovery
# ---------------------------------------------------------------------------

class TestLinkDiscovery:
    """Tests for Crawler.discover_links()"""

    def test_adds_in_scope_links(self):
        c = Crawler(CrawlConfig(max_depth=3))
        visited = {"https://example.com/"}
        from collections import deque
        queue = deque()

        added = c.discover_links(
            links=["https://example.com/about", "https://example.com/contact"],
            current_depth=0,
            seed_domain="example.com",
            visited=visited,
            queue=queue,
        )

        assert added == 2
        assert len(queue) == 2

    def test_skips_already_visited(self):
        c = Crawler(CrawlConfig())
        visited = {"https://example.com/", "https://example.com/about"}
        from collections import deque
        queue = deque()

        added = c.discover_links(
            links=["https://example.com/about"],
            current_depth=0,
            seed_domain="example.com",
            visited=visited,
            queue=queue,
        )

        assert added == 0

    def test_skips_out_of_scope(self):
        c = Crawler(CrawlConfig(same_domain_only=True))
        visited = set()
        from collections import deque
        queue = deque()

        added = c.discover_links(
            links=["https://external.com/page"],
            current_depth=0,
            seed_domain="example.com",
            visited=visited,
            queue=queue,
        )

        assert added == 0

    def test_skips_excluded_patterns(self):
        c = Crawler(CrawlConfig())
        visited = set()
        from collections import deque
        queue = deque()

        added = c.discover_links(
            links=[
                "https://example.com/login",
                "https://example.com/report.pdf",
                "https://example.com/about",
            ],
            current_depth=0,
            seed_domain="example.com",
            visited=visited,
            queue=queue,
        )

        # Only /about should pass
        assert added == 1
        assert queue[0][0] == "https://example.com/about"

    def test_deduplicates_normalized_urls(self):
        c = Crawler(CrawlConfig(strip_query_params=True))
        visited = set()
        from collections import deque
        queue = deque()

        added = c.discover_links(
            links=[
                "https://example.com/page?v=1",
                "https://example.com/page?v=2",
                "https://example.com/page#section",
            ],
            current_depth=0,
            seed_domain="example.com",
            visited=visited,
            queue=queue,
        )

        # All three normalize to the same URL
        assert added == 1


# ---------------------------------------------------------------------------
# Integration: crawl method with mock link extractor
# ---------------------------------------------------------------------------

class TestCrawlRun:
    """Integration tests for Crawler.run() with mock extractors."""

    @pytest.mark.asyncio
    async def test_respects_max_pages(self):
        """Crawler stops after max_pages."""
        c = Crawler(CrawlConfig(
            max_pages=3,
            max_depth=10,
            delay_seconds=0,
            respect_robots_txt=False,
        ))

        # Every page returns 5 links to unique pages
        call_count = 0

        async def mock_extractor(url: str) -> tuple[list[str], list]:
            nonlocal call_count
            call_count += 1
            links = [
                f"https://example.com/page-{call_count}-{i}"
                for i in range(5)
            ]
            # Use unique elements so we don't trigger the template limit (which would prune branches)
            elements = [{"tag": "h1", "class_list": [f"test-{call_count}"]}]
            return links, elements

        results = await c.run("https://example.com", mock_extractor)
        assert len(results) == 3

    @pytest.mark.asyncio
    async def test_respects_max_depth(self):
        """Crawler doesn't go deeper than max_depth."""
        c = Crawler(CrawlConfig(
            max_pages=100,
            max_depth=1,
            delay_seconds=0,
            respect_robots_txt=False,
        ))

        # Seed links to /a, /a links to /a/b (depth 2 — should stop)
        async def mock_extractor(url: str) -> tuple[list[str], list]:
            els = [{"tag": "div", "class_list": [url]}]
            if url == "https://example.com":
                return ["https://example.com/a"], els
            elif url == "https://example.com/a":
                return ["https://example.com/a/b"], els
            return [], els

        results = await c.run("https://example.com", mock_extractor)
        urls = [r.url for r in results]
        assert "https://example.com" in urls
        assert "https://example.com/a" in urls
        assert "https://example.com/a/b" not in urls

    @pytest.mark.asyncio
    async def test_seed_only_when_no_links(self):
        """If no links are found, only the seed page is returned."""
        c = Crawler(CrawlConfig(
            max_pages=10,
            delay_seconds=0,
            respect_robots_txt=False,
        ))

        async def mock_extractor(url: str) -> tuple[list[str], list]:
            return [], [{"tag": "body", "class_list": []}]

        results = await c.run("https://example.com", mock_extractor)
        assert len(results) == 1
        assert results[0].url == "https://example.com"

    @pytest.mark.asyncio
    async def test_handles_extractor_errors(self):
        """Crawler continues even if link extraction fails for a page."""
        c = Crawler(CrawlConfig(
            max_pages=5,
            delay_seconds=0,
            respect_robots_txt=False,
        ))

        async def failing_extractor(url: str) -> tuple[list[str], list]:
            if url == "https://example.com":
                return ["https://example.com/good"], [{"tag": "div"}]
            raise RuntimeError("Network error")

        results = await c.run("https://example.com", failing_extractor)
        assert len(results) == 2  # seed + /good

    @pytest.mark.asyncio
    async def test_template_detection_skips_duplicates(self):
        """Crawler should stop crawling branches if identical templates are detected repeatedly."""
        c = Crawler(CrawlConfig(
            max_pages=10,
            max_template_instances=2,
            delay_seconds=0,
            respect_robots_txt=False,
        ))

        async def template_extractor(url: str) -> tuple[list[str], list]:
            # Same elements for all URLs!
            elements = [
                {"tag": "nav", "class_list": ["menu"]},
                {"tag": "a", "class_list": ["link"]},
                {"tag": "a", "class_list": ["link"]},
            ]
            links = [url + "/next"]
            return links, elements

        results = await c.run("https://example.com", template_extractor)
        # Should only record max_template_instances (2) pages, ignoring the rest
        assert len(results) == 2
