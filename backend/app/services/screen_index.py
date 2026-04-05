"""
MilvusScreenService — indexes confirmed TrainedScreen records into Milvus
for use by the chat RAG pipeline.

Collection schema must include:
  - id: VARCHAR (screen UUID)
  - vector: FLOAT_VECTOR (embedding)
  - payload: JSON { client_id, fingerprint, label, description, page_url }
"""
import logging
from typing import Optional
from app.core.milvus import milvus_manager
from app.services.embeddings import embeddings_service
from app.core.config import settings

logger = logging.getLogger(__name__)

SCREEN_COLLECTION = "bariweb_screens"


def _ensure_screen_collection():
    """Create the bariweb_screens collection if it doesn't exist."""
    try:
        client = milvus_manager.client
        existing = client.list_collections()
        if SCREEN_COLLECTION in existing:
            return True

        # Determine vector dimension from a test embedding
        test_vec = embeddings_service.embed_one("test")
        if not test_vec:
            logger.error("Cannot determine embedding dimension — skipping collection creation")
            return False

        dim = len(test_vec)

        from pymilvus import DataType
        schema = client.create_schema(auto_id=False, enable_dynamic_field=False)
        schema.add_field("id", DataType.VARCHAR, max_length=64, is_primary=True)
        schema.add_field("vector", DataType.FLOAT_VECTOR, dim=dim)
        schema.add_field("client_id", DataType.VARCHAR, max_length=64)
        schema.add_field("fingerprint", DataType.VARCHAR, max_length=256)
        schema.add_field("label", DataType.VARCHAR, max_length=512)
        schema.add_field("description", DataType.VARCHAR, max_length=2048)
        schema.add_field("page_url", DataType.VARCHAR, max_length=1024)

        index_params = client.prepare_index_params()
        index_params.add_index(
            field_name="vector",
            index_type="HNSW",
            metric_type="COSINE",
            params={"M": 16, "efConstruction": 200},
        )

        client.create_collection(
            collection_name=SCREEN_COLLECTION,
            schema=schema,
            index_params=index_params,
        )
        logger.info(f"Created Milvus collection '{SCREEN_COLLECTION}' dim={dim}")
        return True
    except Exception as e:
        logger.error(f"Failed to ensure screen collection: {e}")
        return False


def index_screen(
    screen_id: str,
    client_id: str,
    fingerprint: str,
    label: str,
    description: Optional[str],
    page_url: str,
) -> bool:
    """
    Upsert a confirmed screen into Milvus.
    Called after admin confirms a draft in the dashboard.
    
    The text embedded = label + description (richer semantic signal).
    """
    try:
        if not _ensure_screen_collection():
            return False

        # Build text to embed
        text_parts = [label]
        if description:
            text_parts.append(description)
        if page_url:
            text_parts.append(page_url)
        text_to_embed = " | ".join(text_parts)

        vector = embeddings_service.embed_one(text_to_embed)
        if not vector:
            logger.error(f"Failed to embed screen {screen_id}")
            return False

        client = milvus_manager.client

        # Upsert (delete old + insert new) so re-confirming updates the index
        try:
            client.delete(
                collection_name=SCREEN_COLLECTION,
                filter=f"id == '{screen_id}'",
            )
        except Exception:
            pass  # First time, nothing to delete

        client.insert(
            collection_name=SCREEN_COLLECTION,
            data=[{
                "id": screen_id,
                "vector": vector,
                "client_id": client_id,
                "fingerprint": fingerprint,
                "label": label,
                "description": description or "",
                "page_url": page_url or "",
            }],
        )
        logger.info(f"Indexed screen '{label}' ({screen_id}) into Milvus")
        return True

    except Exception as e:
        logger.error(f"Milvus indexing error for screen {screen_id}: {e}")
        return False


def search_screen_by_fingerprint(fingerprint: str, client_id: str) -> Optional[dict]:
    """
    Lookup a confirmed screen by exact fingerprint + client_id.
    Used by the chat agent to get context for the current page.
    """
    try:
        client = milvus_manager.client
        results = client.query(
            collection_name=SCREEN_COLLECTION,
            filter=f"client_id == '{client_id}' and fingerprint == '{fingerprint}'",
            output_fields=["id", "label", "description", "page_url"],
            limit=1,
        )
        if results:
            return results[0]
        return None
    except Exception as e:
        logger.error(f"Milvus fingerprint lookup error: {e}")
        return None
