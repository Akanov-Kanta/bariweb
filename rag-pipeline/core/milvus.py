from pymilvus import MilvusClient
import config
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
        if not getattr(config, "MILVUS_SERVER", None):
            logger.warning("MILVUS_SERVER is not configured. Milvus client will not be initialized.")
            return

        try:
            # Construct URI from server and port if available
            uri = config.MILVUS_SERVER
            if getattr(config, "MILVUS_PORT", None):
                # Remove trailing slash if present before appending port
                uri = uri.rstrip('/') + f":{config.MILVUS_PORT}"
            
            logger.info(f"Connecting to Milvus at {uri}")
            
            self._client = MilvusClient(
                uri=uri,
                user=getattr(config, "MILVUS_USER", ""),
                password=getattr(config, "MILVUS_PASSWORD", ""),
                db_name=getattr(config, "MILVUS_DB", "")
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
