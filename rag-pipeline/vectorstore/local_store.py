"""
local_store.py — Local vector store using JSON + NumPy.

This is the MVP backend. It stores records in memory and uses
cosine similarity via NumPy for search. The index can be saved
to and loaded from a JSON file on disk.

Limitations:
    - Everything lives in memory — not suitable for millions of records.
    - No approximate nearest-neighbor indexing (brute-force search).
    - Single-threaded.

These limitations are acceptable for demo / development.
For production, swap in the Milvus backend.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

import numpy as np

from embeddings.schema import IndexedRecord
from .base import VectorStoreBase, SearchResult

logger = logging.getLogger(__name__)


class LocalVectorStore(VectorStoreBase):
    """
    In-memory vector store backed by JSON + NumPy.

    Stores IndexedRecords in a list. Search uses brute-force
    cosine similarity over a NumPy matrix.
    """

    def __init__(self):
        self._records: List[IndexedRecord] = []
        # Cached matrix of all embedding vectors (N x D).
        # Rebuilt lazily when search is called after add().
        self._matrix: Optional[np.ndarray] = None
        self._dirty = True  # True when _matrix needs rebuild.

    # ------------------------------------------------------------------
    # VectorStoreBase implementation
    # ------------------------------------------------------------------

    def add(self, records: List[IndexedRecord]) -> int:
        """Add indexed records to the store."""
        added = 0
        for record in records:
            if not record.embedding:
                logger.warning(
                    "Skipping record %s — no embedding vector.",
                    record.element_id,
                )
                continue
            self._records.append(record)
            added += 1

        self._dirty = True
        logger.info("Added %d records (total: %d).", added, len(self._records))
        return added

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[SearchResult]:
        """
        Brute-force cosine similarity search.

        Args:
            query_vector: The query embedding.
            top_k: Number of top results to return.
            filters: Optional dict to filter by metadata fields.
                     Supported keys: "page_url", "action_type", "tag".

        Returns:
            List of SearchResult objects, sorted by score descending.
        """
        if not self._records:
            return []

        # Rebuild the matrix if records were added since last search.
        if self._dirty:
            self._rebuild_matrix()

        # Convert query to numpy.
        query = np.array(query_vector, dtype=np.float32)
        query_norm = np.linalg.norm(query)
        if query_norm == 0:
            return []
        query = query / query_norm

        # Compute cosine similarity against all records.
        # _matrix is already L2-normalized, so dot product = cosine sim.
        similarities = self._matrix @ query  # shape: (N,)

        # Handle any NaN/Inf that might arise from degenerate vectors.
        similarities = np.nan_to_num(similarities, nan=0.0, posinf=0.0, neginf=0.0)

        # Apply filters if provided.
        mask = np.ones(len(self._records), dtype=bool)
        if filters:
            for i, record in enumerate(self._records):
                if "page_url" in filters and record.page_url != filters["page_url"]:
                    mask[i] = False
                if "action_type" in filters and record.action_type != filters["action_type"]:
                    mask[i] = False
                if "tag" in filters and record.tag != filters["tag"]:
                    mask[i] = False

            similarities = np.where(mask, similarities, -1.0)

        # Get top-k indices.
        if top_k >= len(similarities):
            top_indices = np.argsort(similarities)[::-1]
        else:
            # Use argpartition for efficiency with large arrays.
            partitioned = np.argpartition(similarities, -top_k)[-top_k:]
            top_indices = partitioned[np.argsort(similarities[partitioned])[::-1]]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            if score <= 0:
                continue  # Skip filtered-out or zero-similarity results.
            results.append(SearchResult(
                record=self._records[idx],
                score=score,
            ))

        return results[:top_k]

    def count(self) -> int:
        """Return total number of stored records."""
        return len(self._records)

    def clear(self) -> None:
        """Remove all records."""
        self._records.clear()
        self._matrix = None
        self._dirty = True

    def save(self, path: str) -> None:
        """
        Save the entire index to a JSON file.

        The file contains a list of serialized IndexedRecords
        including their embedding vectors.
        """
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

        data = {
            "version": "step3-local-v1",
            "record_count": len(self._records),
            "records": [r.to_dict() for r in self._records],
        }

        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        logger.info("Saved %d records to %s", len(self._records), path)

    def load(self, path: str) -> None:
        """
        Load records from a previously saved JSON index file.

        Replaces the current in-memory contents.
        """
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_records = data.get("records", [])
        self._records = [IndexedRecord.from_dict(r) for r in raw_records]
        self._dirty = True

        logger.info("Loaded %d records from %s", len(self._records), path)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _rebuild_matrix(self) -> None:
        """Rebuild the L2-normalized embedding matrix from current records."""
        if not self._records:
            self._matrix = np.empty((0, 0), dtype=np.float32)
            self._dirty = False
            return

        vectors = []
        for record in self._records:
            vectors.append(record.embedding)

        self._matrix = np.array(vectors, dtype=np.float32)

        # L2-normalize each row for cosine similarity via dot product.
        norms = np.linalg.norm(self._matrix, axis=1, keepdims=True)
        # Avoid division by zero.
        norms = np.where(norms == 0, 1.0, norms)
        self._matrix = self._matrix / norms

        self._dirty = False
