"""
client.py — Embeddings API client for the Alem embeddings service.

Sends text to the Alem embeddings API and returns vector representations.
The API key is read from the ALEM_EMBEDDINGS_API_KEY environment variable.

Supports:
    - Embedding a single text string.
    - Embedding a batch of texts in one call (if API supports list input).
    - Basic error handling and retries.

The client is designed to be easily replaceable — any service that
takes text and returns float vectors can be swapped in.

Configuration:
    ALEM_EMBEDDINGS_API_KEY  — required environment variable
    ALEM_EMBEDDINGS_BASE_URL — optional (default: https://llm.alem.ai/v1)
    ALEM_EMBEDDINGS_MODEL    — optional (default: text-1024)
"""

from __future__ import annotations

import os
import time
import logging
from typing import List, Optional

import requests

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Defaults (overridable via environment)
# ---------------------------------------------------------------------------

_DEFAULT_BASE_URL = "https://llm.alem.ai/v1"
_DEFAULT_MODEL = "text-1024"
_MAX_RETRIES = 3
_RETRY_DELAY_SECONDS = 2.0

# Maximum number of texts to send in a single batch request.
# Keeps payloads manageable and avoids timeouts.
_BATCH_SIZE = 32


class EmbeddingsClient:
    """
    A thin client for the Alem embeddings API.

    Usage:
        client = EmbeddingsClient()
        vector = client.embed_one("Hello, world!")
        vectors = client.embed_batch(["Hello", "World"])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize the embeddings client.

        Args:
            api_key:  API key.  Falls back to ALEM_EMBEDDINGS_API_KEY env var.
            base_url: API base URL.  Falls back to ALEM_EMBEDDINGS_BASE_URL.
            model:    Model name.  Falls back to ALEM_EMBEDDINGS_MODEL.
        """
        self.api_key = api_key or os.environ.get("ALEM_EMBEDDINGS_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "Embeddings API key is required. "
                "Set the ALEM_EMBEDDINGS_API_KEY environment variable."
            )

        self.base_url = (
            base_url
            or os.environ.get("ALEM_EMBEDDINGS_BASE_URL", _DEFAULT_BASE_URL)
        ).rstrip("/")

        self.model = model or os.environ.get(
            "ALEM_EMBEDDINGS_MODEL", _DEFAULT_MODEL
        )

        self.endpoint = f"{self.base_url}/embeddings"

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def embed_one(self, text: str) -> List[float]:
        """
        Embed a single text string.

        Args:
            text: The text to embed.

        Returns:
            A list of floats representing the embedding vector.
        """
        result = self._request(text)
        return result[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of texts, automatically chunking into API-safe batches.

        Args:
            texts: List of text strings.

        Returns:
            List of embedding vectors, one per input text, in the same order.
        """
        all_vectors: List[List[float]] = []

        for start in range(0, len(texts), _BATCH_SIZE):
            chunk = texts[start : start + _BATCH_SIZE]
            vectors = self._request(chunk)
            all_vectors.extend(vectors)

        return all_vectors

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _request(self, input_data: str | List[str]) -> List[List[float]]:
        """
        Make a POST request to the embeddings endpoint.

        Args:
            input_data: A single string or list of strings to embed.

        Returns:
            List of embedding vectors.

        Raises:
            RuntimeError: If the API call fails after retries.
        """
        payload = {
            "model": self.model,
            "input": input_data,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                response = requests.post(
                    self.endpoint,
                    json=payload,
                    headers=headers,
                    timeout=60,
                )
                response.raise_for_status()

                data = response.json()
                # The OpenAI-compatible response shape:
                # { "data": [{ "embedding": [...], "index": 0 }, ...] }
                embeddings = data.get("data", [])

                # Sort by index to ensure correct order.
                embeddings.sort(key=lambda x: x.get("index", 0))

                return [item["embedding"] for item in embeddings]

            except requests.exceptions.RequestException as e:
                last_error = e
                logger.warning(
                    "Embeddings API request failed (attempt %d/%d): %s",
                    attempt,
                    _MAX_RETRIES,
                    e,
                )
                if attempt < _MAX_RETRIES:
                    time.sleep(_RETRY_DELAY_SECONDS * attempt)

        raise RuntimeError(
            f"Embeddings API call failed after {_MAX_RETRIES} attempts: "
            f"{last_error}"
        )
