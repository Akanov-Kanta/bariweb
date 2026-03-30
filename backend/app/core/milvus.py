from pymilvus import MilvusClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class MilvusManager:
    """
    Manager for Milvus connection using MilvusClient.
    Follows a singleton-like pattern via a global instance.
    """
    def __init__(self):
        self._client = None

    @property
    def client(self) -> MilvusClient:
        """
        Returns the MilvusClient instance. Initializes it if it doesn't exist.
        """
        if self._client is None:
            self.initialize()
        return self._client

    def initialize(self):
        """
        Initializes the MilvusClient using settings.
        """
        if not settings.MILVUS_SERVER:
            logger.warning("MILVUS_SERVER is not configured. Milvus client will not be initialized.")
            return

        try:
            # Construct URI from server and port if available
            uri = settings.MILVUS_SERVER
            if settings.MILVUS_PORT:
                # Remove trailing slash if present before appending port
                uri = uri.rstrip('/') + f":{settings.MILVUS_PORT}"
            
            logger.info(f"Connecting to Milvus at {uri}")
            
            self._client = MilvusClient(
                uri=uri,
                user=settings.MILVUS_USER or "",
                password=settings.MILVUS_PASSWORD or "",
                db_name=settings.MILVUS_DB or ""
            )
            logger.info("Milvus client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Milvus client: {e}")
            raise

# Global instance for easy access
milvus_manager = MilvusManager()

def get_milvus_client() -> MilvusClient:
    """
    Utility function to get the global MilvusClient instance.
    """
    return milvus_manager.client
