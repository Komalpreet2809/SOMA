from datetime import datetime
from app.db.session import get_recent_messages
from app.services.memory import ingest_text

def consolidate_memory(user_id: str, limit: int = 50):
    """
    The Hippocampus function.
    Reads recent working memory and saves it to sensory memory (ChromaDB)
    as a permanent 'episodic' memory.
    """
    # 1. Fetch the recent conversation for this user
    history = get_recent_messages(user_id, exchanges=limit)
    
    if not history:
        return 0, "No memory to consolidate."
        
    # 2. Format it into a single coherent "document"
    # We add a timestamp so the AI knows WHEN this happened
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    document_lines = [f"Conversation Memory from {current_time}:"]
    for msg in history:
        prefix = "User" if msg["role"] == "user" else "Soma"
        document_lines.append(f"{prefix}: {msg['content']}")
        
    episodic_document = "\n".join(document_lines)
    
    # 3. Create metadata
    metadata = {
        "type": "episodic_memory",
        "user_id": user_id,
        "timestamp": current_time
    }
    
    # 4. Ingest into ChromaDB
    chunks_created = ingest_text(episodic_document, metadata=metadata)
    
    return chunks_created, "Memory consolidated successfully."
