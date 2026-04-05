import sys
import os

# Add rag-pipeline to path
sys.path.append(os.getcwd())

from vectorstore.milvus_store import MilvusVectorStore
import config

def main():
    print(f"Dropping collection: {config.MILVUS_COLLECTION}")
    store = MilvusVectorStore()
    store.clear()
    print("✅ Collection cleared and re-created with new schema.")

if __name__ == "__main__":
    main()
