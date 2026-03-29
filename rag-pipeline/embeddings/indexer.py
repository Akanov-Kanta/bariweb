"""
indexer.py — Indexing pipeline for Step 3.

Reads enriched JSON files from Step 2, builds embedding text for
each record, requests embeddings from the Alem API, and stores
the resulting vectors + metadata in the vector store.

Usage (as module):
    from embeddings.indexer import index_enriched_file
    store = index_enriched_file("results_enriched/example_enriched.json")

Usage (CLI):
    python -m embeddings.indexer results_enriched/example_enriched.json
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Dict, Any, List, Optional

from embeddings.text_builder import build_embedding_text
from embeddings.client import EmbeddingsClient
from embeddings.schema import IndexedRecord
from vectorstore.local_store import LocalVectorStore
from vectorstore.base import VectorStoreBase
import config

logger = logging.getLogger(__name__)


def load_enriched_records(file_path: str) -> tuple[str, List[Dict[str, Any]]]:
    """
    Load enriched element records from a Step 2 JSON file.

    Returns:
        Tuple of (source_url, list of enriched element dicts).
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    source_url = data.get("source_url", "")
    elements = data.get("elements", [])

    return source_url, elements


def index_enriched_file(
    file_path: str,
    store: Optional[VectorStoreBase] = None,
    client: Optional[EmbeddingsClient] = None,
    save_index: bool = True,
) -> VectorStoreBase:
    """
    Index all enriched records from a single JSON file.

    Steps:
        1. Load enriched records from the file.
        2. Build embedding_text for each record.
        3. Request embeddings from the Alem API (batched).
        4. Create IndexedRecord objects.
        5. Store in the vector store.
        6. Optionally save the index to disk.

    Args:
        file_path: Path to a Step 2 enriched JSON file.
        store: An existing vector store to add to (creates new if None).
        client: An existing embeddings client (creates new if None).
        save_index: Whether to save the index to the configured directory.

    Returns:
        The vector store with the indexed records.
    """
    print(f"\n{'='*60}")
    print(f"  Indexing Pipeline (Step 3)")
    print(f"  Source: {os.path.basename(file_path)}")
    print(f"{'='*60}\n")

    start_time = time.time()

    # ---- 1. Load enriched records ----
    print("[1/5] Loading enriched records...")
    source_url, elements = load_enriched_records(file_path)
    print(f"      Loaded {len(elements)} records from {source_url or 'unknown'}")

    if not elements:
        print("      ⚠ No elements found. Nothing to index.")
        return store or LocalVectorStore()

    # ---- 2. Build embedding texts ----
    print("[2/5] Building embedding texts...")
    embedding_texts = []
    for elem in elements:
        text = build_embedding_text(elem)
        embedding_texts.append(text)

    non_empty = sum(1 for t in embedding_texts if t.strip())
    print(f"      Built {non_empty} non-empty embedding texts")

    # ---- 3. Request embeddings ----
    print("[3/5] Requesting embeddings from Alem API...")
    if client is None:
        client = EmbeddingsClient()

    # Filter empty texts and track indices.
    texts_to_embed = []
    text_indices = []
    for i, text in enumerate(embedding_texts):
        if text.strip():
            texts_to_embed.append(text)
            text_indices.append(i)

    if not texts_to_embed:
        print("      ⚠ All embedding texts are empty. Nothing to embed.")
        return store or LocalVectorStore()

    vectors = client.embed_batch(texts_to_embed)
    print(f"      Received {len(vectors)} embedding vectors")
    if vectors:
        print(f"      Vector dimension: {len(vectors[0])}")

    # ---- 4. Create IndexedRecords ----
    print("[4/5] Creating indexed records...")
    indexed_records: List[IndexedRecord] = []

    # Map vectors back to their original element indices.
    vector_map: Dict[int, List[float]] = {}
    for vec_idx, orig_idx in enumerate(text_indices):
        vector_map[orig_idx] = vectors[vec_idx]

    for i, elem in enumerate(elements):
        embedding = vector_map.get(i, [])
        embedding_text = embedding_texts[i]

        indexed = IndexedRecord.from_enriched(
            enriched=elem,
            embedding_text=embedding_text,
            embedding=embedding,
        )
        indexed_records.append(indexed)

    print(f"      Created {len(indexed_records)} indexed records")

    # ---- 5. Store in vector store ----
    print("[5/5] Storing in vector store...")
    if store is None:
        store = LocalVectorStore()

    added = store.add(indexed_records)
    print(f"      Stored {added} records (total in store: {store.count()})")

    # ---- Save index ----
    if save_index:
        index_dir = config.INDEX_OUTPUT_DIR
        os.makedirs(index_dir, exist_ok=True)

        # Build index filename from source file.
        base_name = os.path.basename(file_path)
        name_without_ext = os.path.splitext(base_name)[0]
        index_filename = f"{name_without_ext}_index.json"
        index_path = os.path.join(index_dir, index_filename)

        store.save(index_path)
        print(f"      Index saved to: {index_path}")

    total_time = time.time() - start_time
    print(f"\n✅ Indexing complete in {total_time:.2f}s — "
          f"{added} records indexed.\n")

    return store


def index_multiple_files(
    file_paths: List[str],
    save_index: bool = True,
) -> VectorStoreBase:
    """
    Index multiple enriched JSON files into a single vector store.

    Args:
        file_paths: List of paths to Step 2 enriched JSON files.
        save_index: Whether to save the combined index to disk.

    Returns:
        The vector store with all indexed records.
    """
    store = LocalVectorStore()
    client = EmbeddingsClient()

    for path in file_paths:
        if not os.path.exists(path):
            print(f"⚠ File not found: {path}")
            continue

        index_enriched_file(
            file_path=path,
            store=store,
            client=client,
            save_index=False,  # We'll save once at the end.
        )

    if save_index:
        index_dir = config.INDEX_OUTPUT_DIR
        os.makedirs(index_dir, exist_ok=True)
        index_path = os.path.join(index_dir, "combined_index.json")
        store.save(index_path)
        print(f"Combined index saved to: {index_path}")

    return store


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    """CLI entry point for indexing enriched files."""
    if len(sys.argv) < 2:
        print("Usage: python -m embeddings.indexer <enriched-json> [enriched2.json ...]")
        print("Example: python -m embeddings.indexer results_enriched/*_enriched.json")
        sys.exit(1)

    import glob
    input_paths = []
    for arg in sys.argv[1:]:
        expanded = glob.glob(arg)
        if expanded:
            input_paths.extend(expanded)
        else:
            input_paths.append(arg)

    if len(input_paths) == 1:
        index_enriched_file(input_paths[0])
    else:
        index_multiple_files(input_paths)


if __name__ == "__main__":
    main()
