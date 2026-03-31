"""
base.py — Abstract vector store interface.

All vector store backends must implement this interface.
This keeps the indexing and retrieval pipelines backend-agnostic.

Current implementations:
    - LocalVectorStore (local_store.py) — JSON + NumPy, for MVP/demo.

Future implementations:
    - MilvusVectorStore — production-grade vector DB.
    - RAGFlowVectorStore — integrated with RAGFlow ingestion.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from embeddings.schema import IndexedRecord


@dataclass
class SearchResult:
    """A single search result with similarity score."""
    record: IndexedRecord
    score: float

    def to_dict(self) -> Dict[str, Any]:
        """Serialize for JSON output."""
        result = {
            "element_id": self.record.element_id,
            "page_url": self.record.page_url,
            "selector": self.record.selector,
            "tag": self.record.tag,
            "action_type": self.record.action_type,
            "semantic_text": self.record.semantic_text,
            "confidence_hint": self.record.confidence_hint,
            "score": round(self.score, 4),
        }
        # Include extra metadata that might be useful.
        if self.record.metadata.get("href"):
            result["href"] = self.record.metadata["href"]
        if self.record.keywords:
            result["keywords"] = self.record.keywords[:5]
        return result


class VectorStoreBase(ABC):
    """
    Abstract interface for a vector store.

    Any backend that can store indexed records with their embeddings
    and perform similarity search should implement this.
    """

    @abstractmethod
    def add(self, records: List[IndexedRecord]) -> int:
        """
        Add indexed records to the store.

        Args:
            records: List of IndexedRecord objects with embeddings.

        Returns:
            Number of records successfully added.
        """
        ...

    @abstractmethod
    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[SearchResult]:
        """
        Search for the most similar records to a query vector.

        Args:
            query_vector: The embedding of the search query.
            top_k: Maximum number of results to return.
            filters: Optional metadata filters (e.g., page_url, action_type).

        Returns:
            List of SearchResult objects sorted by similarity (descending).
        """
        ...

    @abstractmethod
    def count(self) -> int:
        """Return the total number of records in the store."""
        ...

    @abstractmethod
    def clear(self) -> None:
        """Remove all records from the store."""
        ...

    @abstractmethod
    def save(self, path: str) -> None:
        """Persist the store to disk at the given path."""
        ...

    @abstractmethod
    def load(self, path: str) -> None:
        """Load the store from disk at the given path."""
        ...
