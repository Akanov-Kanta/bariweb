"""
milvus_store.py — Vector store backend for the project's Milvus cluster.

Connects to the real Milvus pipeline as specified in Step 5.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from pymilvus import DataType, MilvusClient

from vectorstore.base import SearchResult, VectorStoreBase
from embeddings.schema import IndexedRecord
from core.milvus import get_milvus_client
import config
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class MilvusVectorStore(VectorStoreBase):
    """
    Production-grade vector store backed by Milvus.
    """

    def __init__(self, collection_name: str = config.MILVUS_COLLECTION):
        self.collection_name = collection_name
        self.dimension = config.ALEM_EMBEDDINGS_DIMENSION
        
        self._init_collection()

    @property
    def _client(self) -> MilvusClient:
        return get_milvus_client()

    def _init_collection(self):
        """Create or load the collection in Milvus."""
        try:
            # Try to see if it exists. If this fails due to permissions, we'll try to just load it.
            exists = False
            try:
                exists = self._client.has_collection(collection_name=self.collection_name)
            except Exception as e:
                logger.warning(f"Could not check existence of collection {self.collection_name}: {e}. Assuming it might exist.")
                exists = True # Assume it exists and try to load it anyway

            if exists:
                try:
                    self._client.load_collection(collection_name=self.collection_name)
                    logger.info("Loaded existing Milvus collection: %s", self.collection_name)
                except Exception as e:
                    logger.error(f"Failed to load collection {self.collection_name}: {e}")
            else:
                # Only try to create if we are SURE it doesn't exist and we didn't hit a permission error checking it
                logger.info("Collection %s does not exist, attempting creation...", self.collection_name)
                schema = MilvusClient.create_schema(
                    auto_id=False,
                    enable_dynamic_field=False,
                )
                
                schema.add_field(field_name="element_id", datatype=DataType.VARCHAR, is_primary=True, max_length=256)
                schema.add_field(field_name="action_type", datatype=DataType.VARCHAR, max_length=128)
                schema.add_field(field_name="page_url", datatype=DataType.VARCHAR, max_length=2048)
                schema.add_field(field_name="domain", datatype=DataType.VARCHAR, max_length=512)
                schema.add_field(field_name="route", datatype=DataType.VARCHAR, max_length=1024)
                schema.add_field(field_name="tag", datatype=DataType.VARCHAR, max_length=128)
                schema.add_field(field_name="vector", datatype=DataType.FLOAT_VECTOR, dim=self.dimension)
                schema.add_field(field_name="payload", datatype=DataType.JSON, description="Full serialized record")
                
                index_params = self._client.prepare_index_params()
                index_params.add_index(
                    field_name="vector",
                    metric_type="COSINE",
                    index_type="IVF_FLAT",
                    index_name="vector_index",
                    params={"nlist": 1024}
                )
                
                self._client.create_collection(
                    collection_name=self.collection_name,
                    schema=schema,
                    index_params=index_params
                )
                self._client.load_collection(self.collection_name)
                logger.info("Created new Milvus collection: %s", self.collection_name)
        except Exception as e:
            logger.error(f"Fatal error initializing Milvus (continuing anyway): {e}")

    def add(self, records: List[IndexedRecord]) -> int:
        """Insert records into Milvus."""
        if not records:
            return 0

        data_to_insert = []
        for record in records:
            eid = record.element_id or str(uuid.uuid4())
            rec_dict = record.to_dict()
            rec_dict.pop("embedding", None)
            
            url = record.page_url or ""
            parsed_url = urlparse(url)
            
            data_to_insert.append({
                "element_id": eid,
                "action_type": record.action_type or "",
                "page_url": url,
                "domain": parsed_url.netloc or "",
                "route": parsed_url.path or "/",
                "tag": record.tag or "",
                "vector": record.embedding,
                "payload": rec_dict
            })

        try:
            insert_result = self._client.insert(
                collection_name=self.collection_name,
                data=data_to_insert
            )
            
            added_count = insert_result.get('insert_count', len(data_to_insert))
            logger.info("Inserted %d records to Milvus.", added_count)
            return added_count
        except Exception as e:
            logger.error("Error inserting into Milvus: %s", e)
            return 0

    def search(
        self,
        query_vector: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        query_text: Optional[str] = None,
    ) -> List[SearchResult]:
        """Search Milvus for the most similar vectors."""

        # Build Milvus boolean expression from filters
        expr = None
        if filters:
            conditions = []
            for k, v in filters.items():
                if k in ["action_type", "page_url", "domain", "route", "tag"]:
                    sanitized_v = v.replace("'", "\\'")
                    conditions.append(f"{k} == '{sanitized_v}'")
            if conditions:
                expr = " and ".join(conditions)

        try:
            results = self._client.search(
                collection_name=self.collection_name,
                data=[query_vector],
                anns_field="vector",
                search_params={"metric_type": "COSINE", "params": {"nprobe": 10}},
                limit=top_k,
                filter=expr,
                output_fields=["payload"],
            )

            matches = []
            for hits in results:
                for hit in hits:
                    payload = hit.get("entity", {}).get("payload")
                    record = IndexedRecord.from_dict(payload)
                    score = float(hit.get("distance", 0.0))
                    matches.append(SearchResult(record=record, score=score))
                    
            return matches
            
        except Exception as e:
            logger.error("Milvus search error: %s", e)
            return []

    def count(self) -> int:
        try:
            # If we don't have permission to get stats, just return 0
            stats = self._client.get_collection_stats(collection_name=self.collection_name)
            return stats.get("row_count", 0)
        except Exception as e:
            logger.warning("Could not get Milvus row count (continuing with 0): %s", e)
            return 0

    def clear(self) -> None:
        try:
            if self._client.has_collection(collection_name=self.collection_name):
                self._client.drop_collection(collection_name=self.collection_name)
                self._init_collection()
        except Exception as e:
            logger.error("Error clearing Milvus collection: %s", e)

    def save(self, path: str) -> None:
        pass

    def load(self, path: str) -> None:
        pass
