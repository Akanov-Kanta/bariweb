"""
ragflow_milvus_store.py — Dual-Backend Integration for RAGFlow + Milvus.

This store wraps MilvusVectorStore for secure metadata storage (Step 5)
and delegates semantic ingestion and retrieval to RAGFlow.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
import time
from typing import Any, Dict, List, Optional

from embeddings.schema import IndexedRecord
from vectorstore.base import SearchResult, VectorStoreBase
from vectorstore.milvus_store import MilvusVectorStore
from vectorstore.ragflow_client import RagflowClient
import config

logger = logging.getLogger(__name__)


class RagflowMilvusStore(VectorStoreBase):
    """
    Dual-Backend vector store:
    - Stores complete elements in Milvus via MilvusVectorStore.
    - Sends texts to RAGFlow for embeddings and retrieval.
    """

    def __init__(self):
        logger.info("Initializing RagflowMilvusStore integration...")
        self.milvus_store = MilvusVectorStore()
        self.ragflow_client = RagflowClient()
        self.dataset_id = config.RAGFLOW_DATASET_ID

        if not self.dataset_id:
            logger.info("No RAGFLOW_DATASET_ID found. Attempting to locate or create one.")
            self._ensure_dataset()

    def _ensure_dataset(self):
        """Ensure a RAGFlow dataset exists for ArifAlta DOM Elements."""
        dataset_name = "ArifAlta DOM Elements"
        try:
            datasets = self.ragflow_client.get_datasets()
            for ds in datasets:
                if ds.get("name") == dataset_name:
                    self.dataset_id = ds.get("id")
                    logger.info("Found existing dataset: %s", self.dataset_id)
                    return

            self.dataset_id = self.ragflow_client.create_dataset(
                name=dataset_name,
                description="Auto-generated dataset for DOM element retrieval."
            )
            logger.info("Created new RAGFlow dataset: %s", self.dataset_id)
        except Exception as e:
            logger.error("Failed to initialize RAGFlow dataset: %s", e)
            raise

    def add(self, records: List[IndexedRecord]) -> int:
        """
        1. Save full records to Milvus.
        2. Upload flattened text records to RAGFlow.
        """
        if not records:
            return 0

        # Step 1: Save full metadata and vectors to Milvus
        milvus_added = self.milvus_store.add(records)
        logger.info("Added %d records to Milvus.", milvus_added)

        # Step 2: Push to RAGFlow
        try:
            # We create a JSONL/Text file mapping element_ids to semantic_text
            # We prepend the ID explicitly so it's guaranteed to be in the chunk.
            fd, tmp_path = tempfile.mkstemp(suffix=".txt", text=True)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                for r in records:
                    # Clean the text of any internal pipes or newlines
                    clean_text = r.embedding_text.replace("\n", " ").replace("|", " ")
                    # Format: ELEMENT_ID: <id> | <text>
                    # This ensures RAGFlow keeps the ID inside every chunk it produces for this line.
                    line = f"ELEMENT_ID: {r.element_id} | {clean_text}\n"
                    f.write(line)

            # Upload to RAGFlow
            filename = f"dom_elements_{int(time.time())}.txt"
            self.ragflow_client.upload_document(
                dataset_id=self.dataset_id,
                file_path=tmp_path,
                document_name=filename
            )
            logger.info("Uploaded %s to RAGFlow dataset %s", filename, self.dataset_id)
            
        except Exception as e:
            logger.error("Error uploading batch to RAGFlow: %s", e)
        finally:
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)

        return milvus_added

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        query_text: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Search RAGFlow by text, then fetch full metadata from Milvus.
        """
        if not query_text:
            logger.warning("RagflowMilvusStore requires query_text. Falling back to Milvus vector search.")
            return self.milvus_store.search(query_vector, top_k, filters)

        try:
            ragflow_chunks = self.ragflow_client.retrieve(
                dataset_id=self.dataset_id,
                query=query_text,
                top_k=top_k * 2  # Request more chunks in case of duplicates
            )
        except Exception as e:
            logger.error("RAGFlow retrieval failed: %s", e)
            return []

        # Extract element IDs from chunks
        element_ids = []
        scores = {}
        for chunk in ragflow_chunks:
            # chunk structure depends on RAGFlow, usually has 'content_with_weight' or 'content'
            content = chunk.get("content_with_weight", chunk.get("content", ""))
            
            # Simple parsing: find "ELEMENT_ID: "
            if "ELEMENT_ID:" in content:
                # Extract the ID until the next pipe or whitespace
                parts = content.split("ELEMENT_ID:")
                if len(parts) > 1:
                    eid_part = parts[1].strip()
                    end_idx = eid_part.find(" | ")
                    if end_idx != -1:
                        eid = eid_part[:end_idx].strip()
                    else:
                        eid = eid_part.split()[0]
                    
                    if eid and eid not in element_ids:
                        element_ids.append(eid)
                        # RAGFlow returns similarity score in 'similarity' or 'score'
                        scores[eid] = chunk.get("similarity", chunk.get("score", 0.0))

        if not element_ids:
            logger.info("No actionable Element IDs found in RAGFlow chunks.")
            return []

        # Fetch full records from Milvus
        # Milvus 2.x supports the 'in' operator natively.
        expr = f"element_id in {element_ids}"
        try:
            milvus_res = self.milvus_store._collection.query(
                expr=expr,
                output_fields=["payload"]
            )
        except Exception as e:
            logger.error("Milvus query failed: %s", e)
            return []

        # Reconstruct SearchResult objects
        results = []
        for hit in milvus_res:
            eid = hit.get("element_id")
            payload = hit.get("payload")
            record = IndexedRecord.from_dict(payload)
            # Apply filters if any
            if filters:
                skip = False
                for k, v in filters.items():
                    if getattr(record, k, None) != v:
                        skip = True
                        break
                if skip:
                    continue
                    
            score = float(scores.get(eid, 0.0))
            results.append(SearchResult(record=record, score=score))

        # Sort by RAGFlow score descending
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]

    def count(self) -> int:
        return self.milvus_store.count()

    def clear(self) -> None:
        self.milvus_store.clear()
        # Note: Clearing RAGFlow datasets via API might be complex. Leaving manual for now.

    def save(self, path: str) -> None:
        pass

    def load(self, path: str) -> None:
        pass
