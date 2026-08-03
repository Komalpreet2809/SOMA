import sys
import os
import asyncio

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

async def main():
    print("Testing neocortex on Komal fact...")
    
    # Check driver
    if not neo4j_db.driver:
        from app.core.config import settings
        neo4j_db.connect(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)

    fact = "Komal likes playing cricket."
    triples = extract_and_store_knowledge(fact, "komal")
    print(f"Extracted count: {triples}")
    
    if neo4j_db.driver:
        print("\nCurrent DB Nodes for User 'komal':")
        res = neo4j_db.query("MATCH (n) WHERE n.user_id = 'komal' RETURN n.name as name LIMIT 10")
        for r in res:
            print(r)

if __name__ == "__main__":
    asyncio.run(main())
