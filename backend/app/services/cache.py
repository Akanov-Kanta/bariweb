import logging
import json
import time
from typing import Optional, Dict, Any
from app.core.milvus import milvus_manager
from app.services.embeddings import embeddings_service
from app.core.config import settings

logger = logging.getLogger(__name__)

# Use a specific collection for Semantic Cache
CACHE_COLLECTION = "semantic_cache"

class SemanticCacheService:
    """
    Semantic Cache for BariWeb.
    Stores query+fingerprint embeddings to avoid redundant LLM calls.
    """

    def __init__(self):
        self._init_collection()

    def _init_collection(self):
        """Ensures the cache collection exists in Milvus."""
        try:
            client = milvus_manager.client
            if not client: return

            if not client.has_collection(CACHE_COLLECTION):
                # Basic schema: id (pk), vector (emb), payload (json string)
                client.create_collection(
                    collection_name=CACHE_COLLECTION,
                    dimension=settings.ALEM_EMBEDDINGS_DIMENSION, # 1024
                    metric_type="COSINE"
                )
                logger.info(f"Created Milvus collection: {CACHE_COLLECTION}")
        except Exception as e:
            logger.error(f"Failed to init Semantic Cache collection: {e}")

    def get_cached_action(self, query: str, fingerprint: str, client_id: str) -> Optional[Dict[str, Any]]:
        """
        Looks up a matching action plan in the cache.
        Similarity threshold: 0.9
        """
        try:
            client = milvus_manager.client
            if not client: return None

            query_vector = embeddings_service.embed_one(query)
            if not query_vector: return None

            # Search with fingerprint filter to ensure same screen context
            expr = f"client_id == '{client_id}' and fingerprint == '{fingerprint}'"
            
            results = client.search(
                collection_name=CACHE_COLLECTION,
                data=[query_vector],
                anns_field="vector",
                limit=1,
                filter=expr,
                output_fields=["action_json", "similarity"]
            )

            if results and results[0]:
                match = results[0][0]
                # Milvus Python SDK distance for COSINE is similarity
                similarity = match.get("distance", 0)
                
                if similarity > 0.9:
                    logger.info(f"Semantic Cache HIT (sim={similarity:.4f}) for query='{query[:30]}...'")
                    return json.loads(match["entity"]["action_json"])
            
            return None
        except Exception as e:
            logger.error(f"Semantic Cache lookup error: {e}")
            return None

    def set_cached_action(self, query: str, fingerprint: str, client_id: str, action: Dict[str, Any]):
        """Stores a successful LLM results in the cache."""
        try:
            client = milvus_manager.client
            if not client: return

            query_vector = embeddings_service.embed_one(query)
            if not query_vector: return

            client.insert(
                collection_name=CACHE_COLLECTION,
                data=[{
                    "vector": query_vector,
                    "query": query,
                    "fingerprint": fingerprint,
                    "client_id": client_id,
                    "action_json": json.dumps(action),
                    "created_at": int(time.time())
                }]
            )
        except Exception as e:
            logger.error(f"Failed to update Semantic Cache: {e}")

semantic_cache = SemanticCacheService()
