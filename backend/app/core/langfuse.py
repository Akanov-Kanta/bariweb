from langfuse import Langfuse
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LangfuseManager:
    """
    Manager for Langfuse connection.
    Follows a singleton-like pattern via a global instance.
    """
    def __init__(self):
        self._langfuse = None

    @property
    def client(self) -> Langfuse:
        """
        Returns the Langfuse client instance. Initializes it if it doesn't exist.
        """
        if self._langfuse is None:
            self.initialize()
        return self._langfuse

    def initialize(self):
        """
        Initializes the Langfuse client using settings.
        """
        if not settings.LANGFUSE_PUBLIC_KEY or not settings.LANGFUSE_SECRET_KEY:
            logger.warning("Langfuse keys are not fully configured. Langfuse client will not be initialized.")
            return

        try:
            logger.info(f"Initializing Langfuse client with base URL: {settings.LANGFUSE_BASE_URL}")
            self._langfuse = Langfuse(
                public_key=settings.LANGFUSE_PUBLIC_KEY,
                secret_key=settings.LANGFUSE_SECRET_KEY,
                host=settings.LANGFUSE_BASE_URL
            )
            logger.info("Langfuse client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Langfuse client: {e}")
            raise

# Global instance for easy access
langfuse_manager = LangfuseManager()

def get_langfuse_client() -> Langfuse:
    """
    Utility function to get the global Langfuse client instance.
    """
    return langfuse_manager.client
