#!/usr/bin/env python3
"""
demo_index.py — Demo script: index enriched files.

Indexes all enriched JSON files from results_enriched/ into the
local vector store.

Usage:
    python demo_index.py
    python demo_index.py results_enriched/specific_file_enriched.json
"""

import glob
import os
import sys

# Add project root to path so imports work from any directory.
sys.path.insert(0, os.path.dirname(__file__))

from embeddings.indexer import index_enriched_file, index_multiple_files
import config


def main():
    # Determine input files.
    if len(sys.argv) > 1:
        # Use provided paths.
        input_paths = []
        for arg in sys.argv[1:]:
            expanded = glob.glob(arg)
            input_paths.extend(expanded if expanded else [arg])
    else:
        # Default: index all enriched files.
        pattern = os.path.join(config.ENRICHED_OUTPUT_DIR, "*_enriched.json")
        input_paths = sorted(glob.glob(pattern))

    if not input_paths:
        print("No enriched files found to index.")
        print(f"Run the enrichment pipeline first (Step 2) or check: {config.ENRICHED_OUTPUT_DIR}")
        sys.exit(1)

    print(f"\n🔍 Found {len(input_paths)} enriched file(s) to index:\n")
    for p in input_paths:
        print(f"   • {os.path.basename(p)}")
    print()

    if len(input_paths) == 1:
        store = index_enriched_file(input_paths[0])
    else:
        store = index_multiple_files(input_paths)

    print(f"📦 Index contains {store.count()} records total.")
    print(f"📁 Index files saved to: {config.INDEX_OUTPUT_DIR}/")
    print()
    print("Next: run  python demo_search.py \"find contacts\"  to search.")


if __name__ == "__main__":
    main()
