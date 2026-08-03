"""Test the belief reconciliation pipeline end-to-end:
ADD new facts, SKIP known ones, REPLACE contradicted ones, canonicalize spelling variants."""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge, _canonicalize_nodes
from app.db.neo4j_driver import neo4j_db

TEST_USER = "test_reconcile"


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

    # Start clean
    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})

    print("=== Step 1: 'I love pizza and I live in Delhi' (all new -> ADD) ===")
    extract_and_store_knowledge("I love pizza and I live in Delhi", TEST_USER)
    show_graph("Graph")

    print("=== Step 2: 'I hate pizza' (contradiction -> REPLACE) ===")
    extract_and_store_knowledge("I hate pizza", TEST_USER)
    show_graph("Graph")

    print("=== Step 3: 'I really hate pizza' (already known -> SKIP, no duplicates) ===")
    extract_and_store_knowledge("I really hate pizza", TEST_USER)
    show_graph("Graph")

    print("=== Step 4: 'I moved to Mumbai' (updates home city -> REPLACE + orphan cleanup) ===")
    extract_and_store_knowledge("I moved to Mumbai", TEST_USER)
    show_graph("Graph")

    print("=== Step 5: entity resolution unit check ===")
    fake = [{"subject": "TEST_RECONCILE", "relation": "ENJOYS", "object": "MUM_BAI"}]
    fixed = _canonicalize_nodes(fake, TEST_USER)
    print(f"  'MUM_BAI' canonicalized to: {fixed[0]['object']} (expected MUMBAI)")

    # Clean up
    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})
    print("\nTest nodes cleaned up.")


if __name__ == "__main__":
    main()
