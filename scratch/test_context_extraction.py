"""Test that short replies get extracted when the previous Soma question is passed as context."""
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.neocortex import extract_and_store_knowledge
from app.db.neo4j_driver import neo4j_db

TEST_USER = "test_topping_ctx"


def main():
    if not neo4j_db.driver:
        from app.core.config import settings
        neo4j_db.connect(settings.NEO4J_URI, settings.NEO4J_USER, settings.NEO4J_PASSWORD)

    soma_question = "That's awesome! I'm glad you love pizza. What's your favorite topping?"

    print("--- Case 1: 'umm tomato' WITHOUT context (old behavior, should skip) ---")
    count_no_ctx = extract_and_store_knowledge("umm tomato", TEST_USER)
    print(f"Triples stored: {count_no_ctx}\n")

    print("--- Case 2: 'umm tomato' WITH context (new behavior, should extract) ---")
    count_ctx = extract_and_store_knowledge("umm tomato", TEST_USER, context=soma_question)
    print(f"Triples stored: {count_ctx}\n")

    print(f"Graph contents for user '{TEST_USER}':")
    res = neo4j_db.query(
        "MATCH (n:Entity)-[r]->(m:Entity) WHERE n.user_id = $u AND m.user_id = $u "
        "RETURN n.name AS s, type(r) AS rel, m.name AS o",
        {"u": TEST_USER},
    )
    for row in res or []:
        print(f"  {row['s']} --{row['rel']}--> {row['o']}")

    # Clean up test nodes so they don't pollute the real graph
    neo4j_db.query("MATCH (n:Entity) WHERE n.user_id = $u DETACH DELETE n", {"u": TEST_USER})
    print("\nTest nodes cleaned up.")


if __name__ == "__main__":
    main()
