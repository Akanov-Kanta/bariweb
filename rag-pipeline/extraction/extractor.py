"""
extractor.py — Raw DOM element extraction.

Responsibilities:
  - Query the loaded page for all target elements
  - Read attributes, text content, visibility, and state
  - Build a CSS selector for each element (best-effort)
  - Return a list of raw Python dicts (one per element)

This module does NOT normalize or deduplicate — that's normalizer.py's job.
"""

from __future__ import annotations

from playwright.async_api import Page, ElementHandle
from typing import List, Dict, Any

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import config


async def extract_elements(page: Page, url: str) -> List[Dict[str, Any]]:
    """
    Find all interactive/accessible elements on the page
    and return their raw attribute data.
    """
    # Combine all target selectors into one CSS query.
    # querySelectorAll with comma-separated selectors returns
    # the union of all matches, in DOM order, with no duplicates.
    combined_selector = ", ".join(config.TARGET_SELECTORS)

    handles: List[ElementHandle] = await page.query_selector_all(combined_selector)

    raw_elements = []

    for handle in handles:
        element_data = await _read_element(handle, url)
        if element_data is not None:
            raw_elements.append(element_data)

    return raw_elements


async def _read_element(handle: ElementHandle, url: str) -> Dict[str, Any] | None:
    """
    Read all useful properties from a single DOM element.
    Returns None if the element is detached or unreadable.
    """
    try:
        # -- Basic info --------------------------------------------------
        tag = await handle.evaluate("el => el.tagName.toLowerCase()")

        # Inner text (visible text inside the element)
        text = await handle.evaluate("el => (el.innerText || '').trim()")

        # -- Attributes ---------------------------------------------------
        attrs = {}
        for attr_name in config.ATTRIBUTES_TO_COLLECT:
            value = await handle.get_attribute(attr_name)
            attrs[attr_name] = value  # None if attribute doesn't exist

        # -- Accessibility-specific attributes ----------------------------
        aria_label = attrs.get("aria-label")
        role = attrs.get("role")
        placeholder = attrs.get("placeholder")
        title = attrs.get("title")
        alt = attrs.get("alt")

        # -- State --------------------------------------------------------
        is_visible = await handle.is_visible()
        is_enabled = await handle.is_enabled()

        # -- Selectors (best-effort) -------------------------------------
        css_selector = await _build_css_selector(handle, tag, attrs)
        xpath = await _build_xpath(handle)

        # -- Context text (text around the element) -----------------------
        context_text = await _get_context_text(handle)

        return {
            "page_url": url,
            "tag": tag,
            "text": text,
            "aria_label": aria_label,
            "placeholder": placeholder,
            "title": title,
            "alt": alt,
            "role": role,
            "input_type": attrs.get("type"),
            "id": attrs.get("id"),
            "class_list": (attrs.get("class") or "").split() or [],
            "name": attrs.get("name"),
            "href": attrs.get("href"),
            "is_visible": is_visible,
            "is_enabled": is_enabled,
            "css_selector": css_selector,
            "xpath": xpath,
            "context_text": context_text,
            # Placeholder for future embedding input text
            "semantic_text": "",
        }

    except Exception:
        # Element may have been removed from DOM between query and read.
        return None


async def _build_css_selector(
    handle: ElementHandle, tag: str, attrs: Dict[str, Any]
) -> str:
    """
    Build a best-effort CSS selector for the element.
    Priority: #id > tag[unique-attr] > tag.classes > tag
    """
    # If the element has an id, that's the most reliable selector.
    el_id = attrs.get("id")
    if el_id:
        return f"#{el_id}"

    # Try name attribute (common on form elements)
    name = attrs.get("name")
    if name:
        return f'{tag}[name="{name}"]'

    # Try aria-label
    aria = attrs.get("aria-label")
    if aria:
        return f'{tag}[aria-label="{aria}"]'

    # Fall back to tag + classes
    classes = (attrs.get("class") or "").strip()
    if classes:
        class_selector = "." + ".".join(classes.split())
        return f"{tag}{class_selector}"

    # Last resort: just the tag
    return tag


async def _build_xpath(handle: ElementHandle) -> str:
    """
    Generate an XPath expression for the element using a small
    in-browser script that walks up the DOM tree.
    """
    try:
        xpath = await handle.evaluate("""el => {
            const parts = [];
            let current = el;
            while (current && current.nodeType === Node.ELEMENT_NODE) {
                let index = 1;
                let sibling = current.previousElementSibling;
                while (sibling) {
                    if (sibling.tagName === current.tagName) index++;
                    sibling = sibling.previousElementSibling;
                }
                const tagName = current.tagName.toLowerCase();
                parts.unshift(`${tagName}[${index}]`);
                current = current.parentElement;
            }
            return '/' + parts.join('/');
        }""")
        return xpath
    except Exception:
        return ""


async def _get_context_text(handle: ElementHandle) -> str:
    """
    Grab a snippet of text from the parent element to provide
    surrounding context. Useful for understanding what a button
    or input relates to.
    """
    try:
        context = await handle.evaluate("""el => {
            const parent = el.parentElement;
            if (!parent) return '';
            // Get parent's text, trim, and limit to 200 chars
            const text = (parent.innerText || '').trim();
            return text.substring(0, 200);
        }""")
        return context
    except Exception:
        return ""
