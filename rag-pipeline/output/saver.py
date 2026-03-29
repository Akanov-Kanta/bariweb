"""
saver.py — Save extraction results to disk.

Responsibilities:
  - Write a list of element records to a JSON file
  - Create the output directory if it doesn't exist
  - Generate a descriptive filename from the URL + timestamp

Future extensions:
  - Save to Supabase / Postgres
  - Push to Milvus for vector indexing
  - Stream to RAGFlow ingestion API
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import List, Dict, Any
from urllib.parse import urlparse


def save_to_json(
    records: List[Dict[str, Any]],
    url: str,
    output_dir: str,
) -> str:
    """
    Save the list of element records to a JSON file.

    Args:
        records: Normalized element dicts to save.
        url: The source URL (used in the filename).
        output_dir: Directory to write the file into.

    Returns:
        The absolute path of the created JSON file.
    """
    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Build a filename: domain_path_timestamp.json
    filename = _build_filename(url)
    filepath = os.path.join(output_dir, filename)

    # Write with pretty-printing for readability
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(
            {
                "source_url": url,
                "extracted_at": datetime.now(timezone.utc).isoformat(),
                "element_count": len(records),
                "elements": records,
            },
            f,
            indent=2,
            ensure_ascii=False,
        )

    return filepath


def _build_filename(url: str) -> str:
    """
    Generate a filename from the URL and current timestamp.
    Example: example_com_2026-03-29T12-00-00.json
    """
    parsed = urlparse(url)

    # Use domain + path, sanitized
    domain = parsed.netloc.replace(".", "_").replace(":", "_")
    path = parsed.path.strip("/").replace("/", "_") or "root"
    # Remove any non-alphanumeric characters (except underscores)
    path = re.sub(r"[^a-zA-Z0-9_]", "", path)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")

    return f"{domain}_{path}_{timestamp}.json"
