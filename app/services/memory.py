from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.chroma import get_collection
from typing import List
import uuid
import os

# Lazy-load the embedding model to avoid startup hangs
_embeddings = None
_embeddings_failed = False

def get_embeddings():
    """Lazy-load embeddings on first use. Falls back gracefully if unavailable."""
    global _embeddings, _embeddings_failed

    # If we already failed, don't retry
    if _embeddings_failed:
        return None

    # If already loaded, return it
    if _embeddings is not None:
        return _embeddings

    # Try to load with offline mode enabled (for HF Spaces)
    try:
        os.environ["HF_HUB_OFFLINE"] = "0"  # Try online first
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"trust_remote_code": True}
        )
        print("✓ Embeddings model loaded successfully")
        return _embeddings
    except Exception as e:
        print(f"⚠ Failed to load embeddings from HF Hub: {e}")
        print("⚠ Continuing without embeddings (sensory memory will be limited)")
        _embeddings_failed = True
        return None

def ingest_text(text: str, metadata: dict = None, user_id: str = "default_user"):
    embeddings = get_embeddings()
    if embeddings is None:
        print(f"⚠ Skipping sensory memory ingestion (embeddings unavailable)")
        return 0

    # Step 1: Chunk the text (Soma's parsing)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = text_splitter.split_text(text)

    # Step 2: Prepare for Chroma
    collection = get_collection()

    # Generate unique, safe IDs
    ids = [str(uuid.uuid4()) for _ in chunks]

    # Ensure metadatas is a list of dicts, including user_id
    base_meta = metadata or {}
    base_meta["user_id"] = user_id
    metadatas = [base_meta.copy() for _ in chunks]

    # Embed chunks
    vector_embeddings = embeddings.embed_documents(chunks)
    
    collection.add(
        ids=ids,
        embeddings=vector_embeddings,
        documents=chunks,
        metadatas=metadatas
    )
    
    return len(chunks)

def retrieve_context(query: str, user_id: str = "default_user", n_results: int = 3):
    embeddings = get_embeddings()
    if embeddings is None:
        print(f"⚠ Cannot retrieve context (embeddings unavailable)")
        return []

    collection = get_collection()
    print(f"DEBUG: Retrieving context for query: {query}")
    query_vector = embeddings.embed_query(query)
    
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=n_results,
        where={"user_id": user_id}
    )
    
    # Flatten the documents into a context string
    documents = results.get("documents", [[]])[0]
    print(f"DEBUG: Found {len(documents)} documents in sensory memory.")
    for i, doc in enumerate(documents):
        print(f"DEBUG: Doc {i}: {doc[:50]}...")
    return documents
