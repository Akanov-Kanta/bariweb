"""
service.py — Business logic layer for the retrieval API.

This module sits between the API routes and the Step 3 retrieval
pipeline. It keeps route handlers thin and testable.

Responsibilities:
    - Manage the lifecycle of the vector store and retriever
    - Handle indexing requests (load → embed → store)
    - Handle search requests (embed query → search → filter → format)
    - Handle element lookups
    - Provide diagnostics (record counts, backend info)

The orchestrator or any other consumer should only depend on this
interface — never on the raw vector store or embeddings client.
"""

from __future__ import annotations

import glob
import logging
import os
import time
from typing import Any, Dict, List, Optional

from embeddings.client import EmbeddingsClient
from embeddings.indexer import index_enriched_file, load_enriched_records
from embeddings.retriever import Retriever
from embeddings.schema import IndexedRecord
from vectorstore.base import VectorStoreBase
from vectorstore.local_store import LocalVectorStore
import config

logger = logging.getLogger(__name__)


class RetrievalService:
    """
    Central service that wraps the retrieval pipeline.

    Manages the vector store, embeddings client, and retriever
    instances. All API routes delegate to this service.
    """

    def __init__(
        self,
        store: Optional[VectorStoreBase] = None,
        auto_load_index: bool = True,
    ):
        """
        Initialize the retrieval service.

        Args:
            store: An existing vector store to use. Creates a LocalVectorStore
                   if None.
            auto_load_index: If True and no store is provided, attempt to load
                             the latest index from disk on startup.
        """
        self._store = store or LocalVectorStore()
        self._client: Optional[EmbeddingsClient] = None
        self._retriever: Optional[Retriever] = None

        if auto_load_index and isinstance(self._store, LocalVectorStore):
            self._try_load_latest_index()

        logger.info(
            "RetrievalService initialized. Backend: %s, Records: %d",
            self.backend_name,
            self._store.count(),
        )

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def backend_name(self) -> str:
        """Human-readable name of the current vector store backend."""
        return type(self._store).__name__

    @property
    def record_count(self) -> int:
        """Number of records currently in the store."""
        return self._store.count()

    # ------------------------------------------------------------------
    # Indexing
    # ------------------------------------------------------------------

    def index_files(
        self,
        file_path: Optional[str] = None,
        clear_existing: bool = False,
    ) -> Dict[str, Any]:
        """
        Index enriched JSON files into the vector store.

        Args:
            file_path: Path to a specific enriched JSON file. If None,
                       indexes all files in the enriched output directory.
            clear_existing: If True, clears the store before indexing.

        Returns:
            Dict with indexing results (files_indexed, records_indexed, etc.)
        """
        start = time.time()
        errors: List[str] = []

        if clear_existing:
            self._store.clear()
            logger.info("Cleared existing index.")

        # Determine which files to index.
        if file_path:
            if not os.path.exists(file_path):
                return {
                    "status": "error",
                    "files_indexed": 0,
                    "records_indexed": 0,
                    "total_records": self._store.count(),
                    "index_time_ms": 0,
                    "errors": [f"File not found: {file_path}"],
                }
            file_paths = [file_path]
        else:
            pattern = os.path.join(
                config.ENRICHED_OUTPUT_DIR, "*_enriched.json"
            )
            file_paths = sorted(glob.glob(pattern))

        if not file_paths:
            return {
                "status": "warning",
                "files_indexed": 0,
                "records_indexed": 0,
                "total_records": self._store.count(),
                "index_time_ms": 0,
                "errors": ["No enriched files found to index."],
            }

        # Ensure the embeddings client is available.
        client = self._get_embeddings_client()

        files_indexed = 0
        records_before = self._store.count()

        for path in file_paths:
            try:
                logger.info("Indexing file: %s", os.path.basename(path))
                index_enriched_file(
                    file_path=path,
                    store=self._store,
                    client=client,
                    save_index=False,  # We save once at the end.
                )
                files_indexed += 1
            except Exception as e:
                msg = f"Error indexing {os.path.basename(path)}: {e}"
                logger.error(msg)
                errors.append(msg)

        records_added = self._store.count() - records_before

        # Save the index to disk.
        try:
            index_dir = config.INDEX_OUTPUT_DIR
            os.makedirs(index_dir, exist_ok=True)
            index_path = os.path.join(index_dir, "combined_index.json")
            self._store.save(index_path)
            logger.info("Index saved to %s", index_path)
        except Exception as e:
            errors.append(f"Error saving index: {e}")

        # Invalidate the cached retriever so it picks up new records.
        self._retriever = None

        elapsed_ms = round((time.time() - start) * 1000, 1)

        logger.info(
            "Indexing complete: %d files, %d records added, %.1fms",
            files_indexed, records_added, elapsed_ms,
        )

        return {
            "status": "ok" if not errors else "partial",
            "files_indexed": files_indexed,
            "records_indexed": records_added,
            "total_records": self._store.count(),
            "index_time_ms": elapsed_ms,
            "errors": errors,
        }

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: Optional[float] = None,
        action_type: Optional[str] = None,
        page_url: Optional[str] = None,
        tag: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Perform semantic search over indexed elements.

        Args:
            query: Natural-language query.
            top_k: Maximum number of results.
            min_score: Minimum similarity score threshold.
            action_type: Filter by action type.
            page_url: Filter by page URL.
            tag: Filter by HTML tag.

        Returns:
            Dict with query, matches, timing, etc.
        """
        if self._store.count() == 0:
            logger.warning("Search attempted with empty index.")
            return {
                "query": query,
                "top_k": top_k,
                "total_matches": 0,
                "search_time_ms": 0,
                "matches": [],
            }

        start = time.time()

        # Build filters dict from optional parameters.
        filters: Optional[Dict[str, Any]] = None
        if any([action_type, page_url, tag]):
            filters = {}
            if action_type:
                filters["action_type"] = action_type
            if page_url:
                filters["page_url"] = page_url
            if tag:
                filters["tag"] = tag

        # Get or create the retriever.
        retriever = self._get_retriever()

        # Run search through the retriever.
        raw_results = retriever.search(
            query=query,
            top_k=top_k,
            filters=filters,
        )

        elapsed_ms = round((time.time() - start) * 1000, 1)

        # Apply min_score filter if provided.
        matches = raw_results.get("matches", [])
        if min_score is not None:
            matches = [m for m in matches if m["score"] >= min_score]

        logger.info(
            "Search: query=%r, top_k=%d, results=%d, time=%.1fms",
            query, top_k, len(matches), elapsed_ms,
        )

        return {
            "query": query,
            "top_k": top_k,
            "total_matches": len(matches),
            "search_time_ms": elapsed_ms,
            "matches": matches,
        }

    # ------------------------------------------------------------------
    # Element lookup
    # ------------------------------------------------------------------

    def get_element(self, element_id: str) -> Optional[Dict[str, Any]]:
        """
        Look up a specific indexed element by its element_id.

        Args:
            element_id: The unique element identifier.

        Returns:
            Dict with element details, or None if not found.
        """
        # Linear scan — acceptable for MVP. Milvus would use a primary key.
        if isinstance(self._store, LocalVectorStore):
            for record in self._store._records:
                if record.element_id == element_id:
                    return {
                        "element_id": record.element_id,
                        "page_url": record.page_url,
                        "selector": record.selector,
                        "tag": record.tag,
                        "action_type": record.action_type,
                        "semantic_text": record.semantic_text,
                        "retrieval_text": record.retrieval_text,
                        "context_summary": record.context_summary,
                        "keywords": record.keywords,
                        "confidence_hint": record.confidence_hint,
                        "embedding_text": record.embedding_text,
                        "metadata": record.metadata,
                    }
        return None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_embeddings_client(self) -> EmbeddingsClient:
        """Get or lazily create the embeddings client."""
        if self._client is None:
            self._client = EmbeddingsClient()
        return self._client

    def _get_retriever(self) -> Retriever:
        """Get or lazily create the retriever."""
        if self._retriever is None:
            self._retriever = Retriever(
                store=self._store,
                client=self._get_embeddings_client(),
            )
        return self._retriever

    def _try_load_latest_index(self) -> None:
        """Attempt to load the latest index from the default directory."""
        index_dir = config.INDEX_OUTPUT_DIR
        if not os.path.isdir(index_dir):
            logger.info("No index directory found at %s", index_dir)
            return

        json_files = [
            os.path.join(index_dir, f)
            for f in os.listdir(index_dir)
            if f.endswith(".json")
        ]
        if not json_files:
            logger.info("No index files found in %s", index_dir)
            return

        latest = max(json_files, key=os.path.getmtime)
        try:
            self._store.load(latest)
            logger.info(
                "Auto-loaded index: %s (%d records)",
                os.path.basename(latest),
                self._store.count(),
            )
        except Exception as e:
            logger.warning("Failed to auto-load index %s: %s", latest, e)
