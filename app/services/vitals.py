from app.db.chroma import get_collection
from app.db.neo4j_driver import neo4j_db
from app.db.session import get_message_count
from app.core.config import settings

def get_brain_vitals(user_id: str = "default_user"):
    """
    Collect metrics across all cognitive layers.
    """
    vitals = {
        "sensory": 0,
        "semantic": {"nodes": 0, "edges": 0},
        "working": 0,
        "status": "synaptic_handshake"
    }
    
    # 1. Sensory Memory (ChromaDB)
    try:
        collection = get_collection()
        vitals["sensory"] = collection.count()
    except Exception as e:
        print(f"Vitals: Sensory fetch failed: {e}")
        
    # 2. Semantic Memory (Neo4j)
    if neo4j_db.driver:
        try:
            count_query = "MATCH (n:Entity) OPTIONAL MATCH ()-[r]->() RETURN count(DISTINCT n) AS nodes, count(DISTINCT r) AS edges"
            counts = neo4j_db.query(count_query)
            if counts:
                vitals["semantic"] = {
                    "nodes": counts[0]["nodes"],
                    "edges": counts[0]["edges"]
                }
        except Exception as e:
            print(f"Vitals: Semantic fetch failed: {e}")
            
    # 3. Working Memory (SQLite)
    try:
        vitals["working"] = get_message_count(user_id)
    except Exception as e:
        print(f"Vitals: Working fetch failed: {e}")
        
    return vitals
