import logging
import time
from typing import Any, Dict, List, Optional
from app.core.milvus import milvus_manager
from app.services.embeddings import embeddings_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class SearchService:
    """
    Service for local semantic search within the backend.
    Directly connects to Milvus and utilizes EmbeddingsService.
    """

    def __init__(self, collection_name: str = settings.MILVUS_COLLECTION):
        self.collection_name = collection_name

    def search(
        self,
        query: str,
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        min_score: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Perform semantic search over indexed elements.
        """
        start = time.time()
        
        # 1. Generate query embedding
        query_vector = embeddings_service.embed_one(query)
        if not query_vector:
            logger.error("Failed to generate embedding for query.")
            return {
                "query": query,
                "matches": [],
                "search_time_ms": 0,
            }

        # 2. Build Milvus boolean expression from filters
        expr = None
        if filters:
            conditions = []
            for k, v in filters.items():
                if k in ["action_type", "page_url", "domain", "route", "tag"]:
                    sanitized_v = str(v).replace("'", "\\'")
                    conditions.append(f"{k} == '{sanitized_v}'")
            if conditions:
                expr = " and ".join(conditions)

        # 3. Perform Milvus search
        try:
            client = milvus_manager.client
            results = client.search(
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
                    score = float(hit.get("distance", 0.0))
                    
                    if min_score is not None and score < min_score:
                        continue
                        
                    payload = hit.get("entity", {}).get("payload", {})
                    matches.append({
                        **payload,
                        "score": score
                    })
                    
            elapsed_ms = round((time.time() - start) * 1000, 1)
            
            logger.info(f"Search complete: query='{query}', matches={len(matches)}, time={elapsed_ms}ms")
            
            return {
                "query": query,
                "top_k": top_k,
                "total_matches": len(matches),
                "search_time_ms": elapsed_ms,
                "matches": matches,
            }

        except Exception as e:
            logger.error(f"Milvus search error: {e}")
            return {
                "query": query,
                "matches": [],
                "search_time_ms": 0,
                "error": str(e)
            }

# Singleton instance
search_service = SearchService()
