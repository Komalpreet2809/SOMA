"""Test meaning-based entity resolution: synonyms merge, related-but-different things don't."""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

TEST_USER = "test_semantic"


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

    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})

    print("=== Step 1: 'I love soccer and I live in Delhi' ===")
    extract_and_store_knowledge("I love soccer and I live in Delhi", TEST_USER)
    show_graph("Graph")

    print("=== Step 2: 'I hate football' (synonym! should hit the SOCCER node) ===")
    extract_and_store_knowledge("I hate football", TEST_USER)
    show_graph("Graph")

    print("=== Step 3: 'I like pasta' (related to nothing — must be a NEW node) ===")
    extract_and_store_knowledge("I like pasta", TEST_USER)
    show_graph("Graph")

    print("=== Step 4: 'I moved to Mumbai' (must NOT merge with Delhi, must replace LIVES_IN) ===")
    extract_and_store_knowledge("I moved to Mumbai", TEST_USER)
    show_graph("Graph")

    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})
    print("Test nodes cleaned up.")


if __name__ == "__main__":
    main()
