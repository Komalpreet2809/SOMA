from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.db.chroma import get_collection
from typing import List

# Initialize the embedding model (Soma's sensory receptors)
# This will download the model on the first run (about 100MB)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

import uuid

def ingest_text(text: str, metadata: dict = None, user_id: str = "default_user"):
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
