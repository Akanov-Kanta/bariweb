"""
retriever.py — Semantic search / retrieval service for Step 3.

Accepts a natural-language query, embeds it using the Alem API,
searches the vector store for the most similar DOM element records,
and returns ranked results with scores and metadata.

Usage (as module):
    from embeddings.retriever import Retriever
    retriever = Retriever(index_path="index/combined_index.json")
    results = retriever.search("find contacts")

Usage (CLI):
    python -m embeddings.retriever "find contacts"
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Any, Dict, List, Optional

from embeddings.client import EmbeddingsClient
from vectorstore.local_store import LocalVectorStore
from vectorstore.base import VectorStoreBase, SearchResult
import config

logger = logging.getLogger(__name__)


class Retriever:
    """
    Semantic retrieval over indexed DOM elements.

    Wraps the embeddings client + vector store to provide
    a simple search(query) → results interface.
    """

    def __init__(
        self,
        store: Optional[VectorStoreBase] = None,
        client: Optional[EmbeddingsClient] = None,
        index_path: Optional[str] = None,
    ):
        """
        Initialize the retriever.

        Args:
            store: A pre-loaded vector store. If None, will load from index_path.
            client: An embeddings client. If None, creates one from env vars.
            index_path: Path to a saved index JSON file. Used if store is None.
        """
        self._client = client or EmbeddingsClient()

        if store is not None:
            self._store = store
        elif index_path:
            self._store = LocalVectorStore()
            self._store.load(index_path)
        else:
            # Try default location.
            default_path = self._find_latest_index()
            if default_path:
                self._store = LocalVectorStore()
                self._store.load(default_path)
            else:
                raise FileNotFoundError(
                    "No index found. Run the indexing pipeline first, "
                    "or provide an index_path."
                )

        logger.info("Retriever ready with %d records.", self._store.count())

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Search for DOM elements matching a natural-language query.

        Args:
            query: Natural-language query (e.g., "find contacts").
            top_k: Maximum number of results.
            filters: Optional filters (page_url, action_type, tag).

        Returns:
            A dict with the query, result count, and list of matches.
        """
        start = time.time()

        # 1. Embed the query.
        query_vector = self._client.embed_one(query)

        # 2. Search the vector store.
        results = self._store.search(
            query_vector=query_vector,
            top_k=top_k,
            filters=filters,
        )

        elapsed = time.time() - start

        # 3. Format output.
        return {
            "query": query,
            "top_k": top_k,
            "result_count": len(results),
            "search_time_ms": round(elapsed * 1000, 1),
            "matches": [r.to_dict() for r in results],
        }

    @property
    def record_count(self) -> int:
        """Number of indexed records available for search."""
        return self._store.count()

    def _find_latest_index(self) -> Optional[str]:
        """
        Find the most recently modified index file in the default
        index output directory.
        """
        index_dir = config.INDEX_OUTPUT_DIR
        if not os.path.isdir(index_dir):
            return None

        json_files = [
            os.path.join(index_dir, f)
            for f in os.listdir(index_dir)
            if f.endswith("_index.json")
        ]

        if not json_files:
            return None

        # Return the most recently modified.
        return max(json_files, key=os.path.getmtime)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    """CLI entry point for search demo."""
    if len(sys.argv) < 2:
        print("Usage: python -m embeddings.retriever <query> [--top-k N] [--index PATH]")
        print('Example: python -m embeddings.retriever "find contacts"')
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
    print(f"  Semantic Search (Step 3)")
    print(f"  Query: \"{query}\"")
    print(f"  Top-K: {top_k}")
    print(f"{'='*60}\n")

    retriever = Retriever(index_path=index_path)
    print(f"Loaded {retriever.record_count} indexed records.\n")

    results = retriever.search(query, top_k=top_k)

    print(f"Found {results['result_count']} matches "
          f"in {results['search_time_ms']}ms:\n")

    for i, match in enumerate(results["matches"], 1):
        print(f"  #{i}  score={match['score']:.4f}")
        print(f"       element_id:   {match['element_id']}")
        print(f"       page_url:     {match['page_url']}")
        print(f"       selector:     {match['selector']}")
        print(f"       action_type:  {match['action_type']}")
        print(f"       semantic:     {match['semantic_text'][:80]}...")
        print()

    # Also print the full JSON for piping.
    print("--- Full JSON output ---")
    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
