"""Test that a new sentiment (HATES) replaces the old one (LOVES) instead of coexisting."""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

TEST_USER = "test_belief_rev"


def show_graph(label):
    res = neo4j_db.query(
        "MATCH (n:Entity)-[r]->(m:Entity) WHERE n.user_id = $u AND m.user_id = $u "
        "RETURN n.name AS s, type(r) AS rel, m.name AS o",
        {"u": TEST_USER},
    )
    print(f"{label}:")
    for row in res or []:
        print(f"  {row['s']} --{row['rel']}--> {row['o']}")
    print()


def main():
    if not neo4j_db.driver:
        from app.core.config import settings
        neo4j_db.connect(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)

    print("--- Step 1: 'I love pizza' ---")
    extract_and_store_knowledge("I love pizza", TEST_USER)
    show_graph("Graph after step 1")

    print("--- Step 2: 'I hate pizza' (should REPLACE the loves edge) ---")
    extract_and_store_knowledge("I hate pizza", TEST_USER)
    show_graph("Graph after step 2")

    # Clean up test nodes
    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})
    print("Test nodes cleaned up.")


if __name__ == "__main__":
    main()
