import chromadb
from chromadb.config import Settings
from app.core.config import settings

def get_chroma_client():
    return chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)

def get_collection(name: str = "soma_sensory_memory"):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)


def clear_user_vectors(user_id: str):
    """Delete all ChromaDB documents belonging to a user."""
    try:
        collection = get_collection()
        results = collection.get(where={"user_id": user_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        print(f"ChromaDB clear error: {e}")
