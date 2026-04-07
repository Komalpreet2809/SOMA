import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

def test_direct():
    print(f"Neo4j Connected: {neo4j_db.driver is not None}")
    fact = "Dr. Aris is the creator of the Soma Project. The Soma Project is an advanced cognitive architecture."
    
    print("Calling extract_and_store_knowledge...")
    count = extract_and_store_knowledge(fact)
    print(f"Extracted count: {count}")
    
    if neo4j_db.driver:
        print("\nCurrent DB Nodes:")
        res = neo4j_db.query("MATCH (n) RETURN n.name as name LIMIT 10")
        for r in res:
            print(r)

if __name__ == "__main__":
    test_direct()
