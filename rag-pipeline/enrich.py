"""
enrich.py — CLI entry point for Step 2: semantic enrichment.

Usage:
    python enrich.py results/example_com_root_2026-03-29T11-40-28.json
    python enrich.py results/*.json

Takes one or more raw Step 1 JSON files and produces enriched JSON
files in the results_enriched/ directory.

Pipeline:
    1. Load raw JSON from Step 1
    2. Enrich every element (action classification, context, keywords, etc.)
    3. Save enriched JSON to results_enriched/
"""

import json
import os
import sys
import time
import glob

from enrichment.pipeline import enrich_records
from output.saver import save_to_json

import config


def enrich_file(input_path: str, output_dir: str) -> str:
    """
    Read a raw Step 1 JSON file, enrich all records, and save
    the enriched output.

    Returns the path to the enriched JSON file.
    """
    # ---- 1. Load the raw file ----
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    source_url = data.get("source_url", "")
    raw_elements = data.get("elements", [])

    print(f"  Loaded {len(raw_elements)} raw elements from {os.path.basename(input_path)}")

    # ---- 2. Enrich ----
    enriched = enrich_records(raw_elements, page_url=source_url)

    print(f"  Enriched {len(enriched)} elements")

    # ---- 3. Save ----
    os.makedirs(output_dir, exist_ok=True)

    # Use the same filename with an "_enriched" suffix
    base_name = os.path.basename(input_path)
    name_without_ext = os.path.splitext(base_name)[0]
    output_filename = f"{name_without_ext}_enriched.json"
    output_path = os.path.join(output_dir, output_filename)

    # Build enriched output structure
    output_data = {
        "source_url": source_url,
        "raw_source": os.path.abspath(input_path),
        "enriched_at": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        "element_count": len(enriched),
        "pipeline_version": "step2-heuristic-v1",
        "elements": enriched,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    return output_path


def main():
    """Parse CLI arguments and run the enrichment pipeline."""
    if len(sys.argv) < 2:
        print("Usage: python enrich.py <path-to-raw-json> [path2.json ...]")
        print("Example: python enrich.py results/example_com_root_2026-03-29T11-40-28.json")
        print("         python enrich.py results/*.json")
        sys.exit(1)

    # Expand globs (for shells that don't expand *.json)
    input_paths = []
    for arg in sys.argv[1:]:
        expanded = glob.glob(arg)
        if expanded:
            input_paths.extend(expanded)
        else:
            input_paths.append(arg)

    output_dir = config.ENRICHED_OUTPUT_DIR

    print(f"\n{'='*60}")
    print(f"  Semantic Enrichment Pipeline (Step 2)")
    print(f"  Files to process: {len(input_paths)}")
    print(f"  Output directory: {output_dir}")
    print(f"{'='*60}\n")

    start_time = time.time()
    results = []

    for i, path in enumerate(input_paths, 1):
        if not os.path.exists(path):
            print(f"[{i}/{len(input_paths)}] ⚠ File not found: {path}")
            continue

        print(f"[{i}/{len(input_paths)}] Enriching: {os.path.basename(path)}")
        output_path = enrich_file(path, output_dir)
        print(f"  → Saved to: {output_path}")
        results.append(output_path)
        print()

    total_time = time.time() - start_time
    print(f"✅ Done in {total_time:.2f}s — {len(results)} file(s) enriched.\n")


if __name__ == "__main__":
    main()
