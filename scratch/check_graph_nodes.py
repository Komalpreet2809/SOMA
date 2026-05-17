from app.db.neo4j_driver import neo4j_db

def check_nodes():
    if not neo4j_db.driver:
        print("Neo4j driver is not active.")
        return
        
    try:
        query = "MATCH (n:Entity) RETURN n.name AS name, n.user_id AS user_id"
        results = neo4j_db.query(query)
        print("Nodes found in Neo4j:")
        for r in results:
            print(f"- Name: '{r['name']}', User ID: '{r['user_id']}'")
    except Exception as e:
        print(f"Error querying Neo4j: {e}")

if __name__ == "__main__":
    check_nodes()
