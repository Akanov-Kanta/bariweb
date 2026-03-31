"""
milvus_store.py — Vector store backend for the project's Milvus cluster.

Connects to the real Milvus pipeline as specified in Step 5.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any, Dict, List, Optional

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    MilvusClient,
    connections,
    utility,
)

from vectorstore.base import SearchResult, VectorStoreBase
from embeddings.schema import IndexedRecord
import config

logger = logging.getLogger(__name__)

class MilvusVectorStore(VectorStoreBase):
    """
    Production-grade vector store backed by Milvus.
    """

    def __init__(self, collection_name: str = config.MILVUS_COLLECTION):
        self.collection_name = collection_name
        self.dimension = config.ALEM_EMBEDDINGS_DIMENSION
        self._collection: Optional[Collection] = None
        
        # Build URI
        uri = config.MILVUS_SERVER
        if config.MILVUS_PORT:
            uri = uri.rstrip('/') + f":{config.MILVUS_PORT}"
            
        self.uri = uri
        
        # Connect to Milvus globally for this store
        self._connect()
        # Initialize the collection
        self._init_collection()

    def _connect(self):
        """Establish a connection to the Milvus server."""
        try:
            connections.connect(
                alias="default",
                uri=self.uri,
                user=config.MILVUS_USER,
                password=config.MILVUS_PASSWORD,
                db_name=config.MILVUS_DB,
            )
            logger.info("Connected to Milvus at %s", self.uri)
        except Exception as e:
            logger.error("Failed to connect to Milvus: %s", e)
            raise

    def _init_collection(self):
        """Create or load the collection in Milvus."""
        if utility.has_collection(self.collection_name):
            self._collection = Collection(self.collection_name)
            self._collection.load()
            logger.info("Loaded existing Milvus collection: %s", self.collection_name)
        else:
            fields = [
                FieldSchema(name="element_id", dtype=DataType.VARCHAR, is_primary=True, max_length=256),
                FieldSchema(name="action_type", dtype=DataType.VARCHAR, max_length=128),
                FieldSchema(name="page_url", dtype=DataType.VARCHAR, max_length=2048),
                FieldSchema(name="tag", dtype=DataType.VARCHAR, max_length=128),
                FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=self.dimension),
                FieldSchema(name="payload", dtype=DataType.JSON, description="Full serialized record"),
            ]
            schema = CollectionSchema(fields, description="DOM Elements for Accessibility RAG")
            self._collection = Collection(self.collection_name, schema)
            
            # Create an IVF_FLAT index for the vector field
            index_params = {
                "metric_type": "COSINE",
                "index_type": "IVF_FLAT",
                "params": {"nlist": 1024}
            }
            self._collection.create_index(field_name="vector", index_params=index_params)
            self._collection.load()
            logger.info("Created new Milvus collection: %s", self.collection_name)

    def add(self, records: List[IndexedRecord]) -> int:
        """Insert records into Milvus."""
        if not records or self._collection is None:
            return 0

        element_ids = []
        action_types = []
        page_urls = []
        tags = []
        vectors = []
        payloads = []

        for record in records:
            # Generate a stable ID if not provided. Or use the record's ID.
            # However, DOM ID might not be uniquely stable across domains if simple, but we assume it is here.
            eid = record.element_id or str(uuid.uuid4())
            element_ids.append(eid)
            action_types.append(record.action_type or "")
            page_urls.append(record.page_url or "")
            tags.append(record.tag or "")
            vectors.append(record.embedding)
            
            # Payload stores the complete serialized dict
            # Remove embedding before storing to save DB space
            rec_dict = record.to_dict()
            rec_dict.pop("embedding", None)
            payloads.append(rec_dict)

        try:
            insert_result = self._collection.insert([
                element_ids,
                action_types,
                page_urls,
                tags,
                vectors,
                payloads
            ])
            # Wait for data to be searchable
            self._collection.flush()
            
            added_count = insert_result.insert_count
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
        if self._collection is None:
            return []

        search_params = {
            "metric_type": "COSINE",
            "params": {"nprobe": 10},
        }

        # Build Milvus boolean expression from filters
        expr = None
        if filters:
            conditions = []
            for k, v in filters.items():
                if k in ["action_type", "page_url", "tag"]:
                    # Safely handle string single-quotes
                    sanitized_v = v.replace("'", "\\'")
                    conditions.append(f"{k} == '{sanitized_v}'")
            if conditions:
                expr = " and ".join(conditions)

        try:
            results = self._collection.search(
                data=[query_vector],
                anns_field="vector",
                param=search_params,
                limit=top_k,
                expr=expr,
                output_fields=["payload"],
            )

            matches = []
            for hits in results:
                for hit in hits:
                    payload = hit.entity.get("payload")
                    record = IndexedRecord.from_dict(payload)
                    # Milvus cosine distance is actually similarity if normalized, 
                    # but depending on metric it might be raw distance. 
                    # Assuming higher is better for COSINE.
                    score = float(hit.distance)
                    matches.append(SearchResult(record=record, score=score))
                    
            return matches
            
        except Exception as e:
            logger.error("Milvus search error: %s", e)
            return []

    def count(self) -> int:
        if self._collection:
            return self._collection.num_entities
        return 0

    def clear(self) -> None:
        if utility.has_collection(self.collection_name):
            utility.drop_collection(self.collection_name)
            self._init_collection()

    def save(self, path: str) -> None:
        # Milvus persists automatically, this is a no-op API compatibility stub
        pass

    def load(self, path: str) -> None:
        # Milvus is already loaded globally via cluster connection
        pass
