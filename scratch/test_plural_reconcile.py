"""Test that singular/plural variants resolve to one node and contradictions still replace."""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge, _normalize_name
from app.db.neo4j_driver import neo4j_db

TEST_USER = "test_lily"


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
    print("Unit check: normalize('LILIES') == normalize('LILY') ->",
          _normalize_name("LILIES") == _normalize_name("LILY"))
    print("Unit check: normalize('BOOKS') == normalize('BOOK')   ->",
          _normalize_name("BOOKS") == _normalize_name("BOOK"))
    print("Unit check: 'GLASS' unharmed ->", _normalize_name("GLASS") == "GLASS")
    print()

    if not neo4j_db.driver:
        from app.core.config import settings
        neo4j_db.connect(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)

    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})

    print("=== Step 1: 'I love lily' ===")
    extract_and_store_knowledge("I love lily", TEST_USER)
    show_graph("Graph")

    print("=== Step 2: 'I hate lilies' (plural! should still REPLACE, one node) ===")
    extract_and_store_knowledge("I hate lilies", TEST_USER)
    show_graph("Graph")

    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})
    print("Test nodes cleaned up.")


if __name__ == "__main__":
    main()
