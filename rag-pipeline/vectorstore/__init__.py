# vectorstore package — Pluggable vector storage backends.
#
# The abstract interface lives in base.py.
# The local NumPy-based MVP backend lives in local_store.py.
# Milvus Vector Store lives in milvus_store.py.
# Future backends (RAGFlow native) can be added as siblings.

from .base import SearchResult, VectorStoreBase
from .local_store import LocalVectorStore
from .milvus_store import MilvusVectorStore
from .ragflow_milvus_store import RagflowMilvusStore

__all__ = [
    "VectorStoreBase",
    "SearchResult",
    "LocalVectorStore",
    "MilvusVectorStore",
    "RagflowMilvusStore",
]
