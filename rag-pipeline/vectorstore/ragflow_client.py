"""
ragflow_client.py — A lightweight Python client for the RAGFlow API.

Handles HTTP interactions with RAGFlow's /api/v1 endpoints, including:
- Creating datasets.
- Uploading documents (files).
- Querying for text semantics via the retrieval API.
"""

from __future__ import annotations

import json
import logging
import os
import requests
from typing import Any, Dict, List, Optional

import config

logger = logging.getLogger(__name__)


class RagflowAPIError(Exception):
    """Exception raised when the RAGFlow API returns an error."""
    pass


class RagflowClient:
    """
    Client for interacting with RAGFlow /api/v1 endpoints.
    """

    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None):
        self.api_url = (api_url or config.RAGFLOW_API_URL).rstrip("/")
        self.api_key = api_key or config.RAGFLOW_API_KEY

        if not self.api_url or not self.api_key:
            raise ValueError(
                "RAGFlow API URL and API Key must be provided either in config or explicitly."
            )

        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
        }

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make an HTTP request to the RAGFlow API."""
        url = f"{self.api_url}{endpoint}"
        
        # Inject standard headers, but let kwargs override if necessary
        # (e.g. multipart/form-data uses content-type logic within requests)
        headers = {**self.headers}
        if "headers" in kwargs:
            headers.update(kwargs.pop("headers"))
            
        try:
            response = requests.request(method, url, headers=headers, **kwargs)
            response.raise_for_status()
            data = response.json()
            if data.get("code") != 0:
                raise RagflowAPIError(f"RAGFlow error: {data.get('message', 'Unknown')}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"RAGFlow API {method} {url} failed: {e}")
            if e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            raise RagflowAPIError(f"Request failed: {e}")

    def get_datasets(self) -> List[Dict[str, Any]]:
        """Retrieve all datasets."""
        response = self._request("GET", "/datasets")
        return response.get("data", [])

    def create_dataset(self, name: str, description: str = "") -> str:
        """Create a new dataset and return its ID."""
        payload = {
            "name": name,
            "description": description,
            # For JSON/text uploads involving specific structured text, naive chunking works fine
            "chunk_method": "naive"
        }
        response = self._request("POST", "/datasets", json=payload)
        return response.get("data", {}).get("id")

    def upload_document(self, dataset_id: str, file_path: str, document_name: Optional[str] = None) -> None:
        """
        Uploads a single file to a dataset.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Cannot upload missing file: {file_path}")

        filename = document_name or os.path.basename(file_path)
        
        # We don't specify Content-Type here; requests multipart/form-data handles it.
        with open(file_path, "rb") as f:
            files = {
                "file": (filename, f)
            }
            # Add form-data if RAGFlow requires the dataset_id explicitly, though typical RAGFlow passes it in URL.
            url = f"/datasets/{dataset_id}/documents"
            self._request("POST", url, files=files)
            
    def retrieve(self, dataset_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve chunks matching a text query in a dataset.
        Returns a list of chunks, which contain text from which we can extract element_ids.
        """
        payload = {
            "dataset_ids": [dataset_id],
            "question": query,
            "top_k": top_k
        }
        
        response = self._request("POST", "/retrieval", json=payload)
        
        # RAGFlow returns matches in the "data" array usually.
        # Format depends on RAGFlow version, but generally includes "chunks" or similar list of texts.
        return response.get("data", {}).get("chunks", [])
