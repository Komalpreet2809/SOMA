import sys
import os
import json
import asyncio

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

async def main():
    print("Testing neocortex on real DB and Groq connection...")
    
    # Check driver
    if not neo4j_db.driver:
        print("Neo4j driver is not connected. Attempting connect...")
        from app.core.config import settings
        print(f"Connecting to {settings.NEO4J_URI}...")
        neo4j_db.connect(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)

    test_inputs = [
        "I love coding in Python and playing cricket on Sundays",
        "My dog Baxter likes chasing tennis balls in Delhi",
    ]
    
    for inp in test_inputs:
        print(f"\n========================================\nInput: '{inp}'")
        try:
            triples = extract_and_store_knowledge(inp, "komal")
            print(f"Result: extracted {triples} relationships successfully.")
        except Exception as e:
            print(f"Exception during execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())
