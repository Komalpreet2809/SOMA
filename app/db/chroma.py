import chromadb
from chromadb.config import Settings
from app.core.config import settings

def get_chroma_client():
    return chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)

def get_collection(name: str = "soma_sensory_memory"):
    client = get_chroma_client()
    return client.get_or_create_collection(name=name)


def search_memories(query: str, user_id: str, limit: int = 10):
    """Semantic search for memories belonging to a user."""
    try:
        collection = get_collection()
        results = collection.query(
            query_texts=[query],
            n_results=limit,
            where={"user_id": user_id}
        )
        return results
    except Exception as e:
        print(f"ChromaDB search error: {e}")
        return None


def clear_user_vectors(user_id: str):
    """Delete all ChromaDB documents belonging to a user."""
    try:
        collection = get_collection()
        results = collection.get(where={"user_id": user_id})
        if results and results["ids"]:
            collection.delete(ids=results["ids"])
    except Exception as e:
        print(f"ChromaDB clear error: {e}")

def delete_vector(memory_id: str, user_id: str):
    """Delete a specific document from ChromaDB."""
    try:
        collection = get_collection()
        collection.delete(ids=[memory_id], where={"user_id": user_id})
        return True
    except Exception as e:
        print(f"ChromaDB delete error: {e}")
        return False
