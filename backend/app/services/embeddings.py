import time
import logging
from typing import List, Optional, Union

import requests
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingsService:
    """
    Service for interacting with the Alem embeddings API.
    Aadapted from the RAG-pipeline client.
    """

    def __init__(self):
        self.api_key = settings.ALEM_EMBEDDINGS_API_KEY
        self.base_url = settings.ALEM_EMBEDDINGS_BASE_URL.rstrip("/")
        self.model = settings.ALEM_EMBEDDINGS_MODEL
        self.endpoint = f"{self.base_url}/embeddings"
        
        self._max_retries = 3
        self._retry_delay = 2.0
        self._batch_size = 32

    def embed_one(self, text: str) -> List[float]:
        """Embed a single text string."""
        if not self.api_key:
            logger.error("ALEM_EMBEDDINGS_API_KEY is not configured.")
            return []
            
        result = self._request(text)
        return result[0] if result else []

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of texts with batching."""
        if not self.api_key:
            logger.error("ALEM_EMBEDDINGS_API_KEY is not configured.")
            return []

        all_vectors: List[List[float]] = []
        for start in range(0, len(texts), self._batch_size):
            chunk = texts[start : start + self._batch_size]
            vectors = self._request(chunk)
            all_vectors.extend(vectors)
        return all_vectors

    def _request(self, input_data: Union[str, List[str]]) -> List[List[float]]:
        payload = {
            "model": self.model,
            "input": input_data,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error = None
        for attempt in range(1, self._max_retries + 1):
            try:
                response = requests.post(
                    self.endpoint,
                    json=payload,
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()
                
                embeddings = data.get("data", [])
                embeddings.sort(key=lambda x: x.get("index", 0))
                return [item["embedding"] for item in embeddings]

            except Exception as e:
                last_error = e
                logger.warning(f"Embeddings API attempt {attempt} failed: {e}")
                if attempt < self._max_retries:
                    time.sleep(self._retry_delay * attempt)

        logger.error(f"Embeddings API failed after retries: {last_error}")
        return []

# Singleton instance
embeddings_service = EmbeddingsService()
