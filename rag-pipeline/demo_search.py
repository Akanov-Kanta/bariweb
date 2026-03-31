#!/usr/bin/env python3
"""
demo_search.py — Demo script: semantic search over indexed elements.

Runs a natural-language query against the vector store and prints
the top matching DOM elements with scores.

Usage:
    python demo_search.py "find contacts"
    python demo_search.py "open login" --top-k 3
    python demo_search.py "search tickets" --index index/combined_index.json
"""

import json
import os
import sys

# Add project root to path so imports work from any directory.
sys.path.insert(0, os.path.dirname(__file__))

from embeddings.retriever import Retriever


def main():
    if len(sys.argv) < 2:
        print("Usage: python demo_search.py <query> [--top-k N] [--index PATH]")
        print()
        print("Examples:")
        print('  python demo_search.py "find contacts"')
        print('  python demo_search.py "open login" --top-k 3')
        print('  python demo_search.py "where is support" --index index/combined_index.json')
        sys.exit(1)

    # Parse arguments.
    query = sys.argv[1]
    top_k = 5
    index_path = None

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--top-k" and i + 1 < len(sys.argv):
            top_k = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == "--index" and i + 1 < len(sys.argv):
            index_path = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    print(f"\n{'='*60}")
    print(f"  🔎 Semantic Search Demo (Step 3)")
    print(f"  Query: \"{query}\"")
    print(f"  Top-K: {top_k}")
    print(f"{'='*60}\n")

    # Initialize retriever.
    try:
        retriever = Retriever(index_path=index_path)
    except FileNotFoundError as e:
        print(f"❌ {e}")
        print("Run  python demo_index.py  first to build the index.")
        sys.exit(1)

    print(f"📦 Loaded {retriever.record_count} indexed records.\n")

    # Run search.
    results = retriever.search(query, top_k=top_k)

    print(f"Found {results['result_count']} matches "
          f"in {results['search_time_ms']}ms:\n")

    if not results["matches"]:
        print("  No matches found.")
        return

    # Pretty-print each result.
    for i, match in enumerate(results["matches"], 1):
        score = match["score"]
        # Color-code the score bar.
        bar_len = int(score * 20)
        bar = "█" * bar_len + "░" * (20 - bar_len)

        print(f"  ┌─ #{i}  [{bar}] {score:.4f}")
        print(f"  │  element_id:    {match['element_id']}")
        print(f"  │  page_url:      {match['page_url']}")
        print(f"  │  selector:      {match['selector']}")
        print(f"  │  tag:           {match['tag']}")
        print(f"  │  action_type:   {match['action_type']}")
        print(f"  │  confidence:    {match['confidence_hint']}")
        sem_text = match["semantic_text"]
        if len(sem_text) > 100:
            sem_text = sem_text[:97] + "..."
        print(f"  │  semantic_text: {sem_text}")
        if match.get("href"):
            print(f"  │  href:          {match['href']}")
        if match.get("keywords"):
            print(f"  │  keywords:      {', '.join(match['keywords'])}")
        print(f"  └{'─'*55}")
        print()

    # Print full JSON at the end.
    print("─" * 60)
    print("Full JSON output:")
    print("─" * 60)
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
