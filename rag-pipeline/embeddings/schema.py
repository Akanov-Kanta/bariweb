"""
schema.py — Indexed record schema for Step 3.

Defines the canonical shape of a vector-indexed DOM element record.
An indexed record is an enriched record from Step 2 plus:
    - embedding_text:  the exact text that was embedded
    - embedding:       the float vector from the embeddings API

This schema is what the vector store persists and what search
results are built from.

Extension points:
    - Add `milvus_id` when integrating with Milvus.
    - Add `ragflow_doc_id` when integrating with RAGFlow.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class IndexedRecord:
    """
    A single DOM element record ready for vector storage.

    Contains all useful metadata copied from the enriched record
    plus the embedding vector and the text that produced it.
    """

    # --- Identity ---
    element_id: str = ""
    page_url: str = ""
    selector: str = ""
    tag: str = ""

    # --- Semantic enrichment from Step 2 ---
    action_type: str = "unknown"
    semantic_text: str = ""
    retrieval_text: str = ""
    context_summary: str = ""
    keywords: List[str] = field(default_factory=list)
    confidence_hint: str = "low"

    # --- Step 3 additions ---
    embedding_text: str = ""
    embedding: List[float] = field(default_factory=list)

    # --- Extra metadata bucket ---
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to a plain dict (for JSON storage)."""
        return {
            "element_id": self.element_id,
            "page_url": self.page_url,
            "selector": self.selector,
            "tag": self.tag,
            "action_type": self.action_type,
            "semantic_text": self.semantic_text,
            "retrieval_text": self.retrieval_text,
            "context_summary": self.context_summary,
            "keywords": self.keywords,
            "confidence_hint": self.confidence_hint,
            "embedding_text": self.embedding_text,
            "embedding": self.embedding,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "IndexedRecord":
        """Deserialize from a plain dict."""
        return cls(
            element_id=data.get("element_id", ""),
            page_url=data.get("page_url", ""),
            selector=data.get("selector", ""),
            tag=data.get("tag", ""),
            action_type=data.get("action_type", "unknown"),
            semantic_text=data.get("semantic_text", ""),
            retrieval_text=data.get("retrieval_text", ""),
            context_summary=data.get("context_summary", ""),
            keywords=data.get("keywords", []),
            confidence_hint=data.get("confidence_hint", "low"),
            embedding_text=data.get("embedding_text", ""),
            embedding=data.get("embedding", []),
            metadata=data.get("metadata", {}),
        )

    @classmethod
    def from_enriched(
        cls,
        enriched: Dict[str, Any],
        embedding_text: str = "",
        embedding: Optional[List[float]] = None,
    ) -> "IndexedRecord":
        """
        Create an IndexedRecord from a Step 2 enriched record dict.

        This bridges Step 2 → Step 3 by copying relevant fields
        and attaching the embedding data.
        """
        return cls(
            element_id=enriched.get("element_id", ""),
            page_url=enriched.get("page_url", ""),
            selector=enriched.get("selector", ""),
            tag=enriched.get("tag", ""),
            action_type=enriched.get("action_type", "unknown"),
            semantic_text=enriched.get("semantic_text", ""),
            retrieval_text=enriched.get("retrieval_text", ""),
            context_summary=enriched.get("context_summary", ""),
            keywords=enriched.get("keywords", []),
            confidence_hint=enriched.get("confidence_hint", "low"),
            embedding_text=embedding_text,
            embedding=embedding or [],
            metadata={
                "text": enriched.get("text", ""),
                "aria_label": enriched.get("aria_label"),
                "placeholder": enriched.get("placeholder"),
                "href": enriched.get("href"),
                "role": enriched.get("role"),
                "input_type": enriched.get("input_type"),
                "is_clickable": enriched.get("is_clickable", False),
                "is_form_control": enriched.get("is_form_control", False),
                "candidate_intents": enriched.get("candidate_intents", []),
            },
        )
