from neo4j import GraphDatabase

user = "d65ff6c7"
pwd = "f033nIBNG1lfOgFoSXygoYYM5TJhyH6dpL-QugS6mmA"
db = "d65ff6c7"

# Test with neo4j+ssc:// (skip cert verification)
for scheme in ["neo4j+s", "neo4j+ssc"]:
    uri = f"{scheme}://d65ff6c7.databases.neo4j.io"
    print(f"\n--- Testing {scheme}:// ---")
    try:
        driver = GraphDatabase.driver(uri, auth=(user, pwd))
        driver.verify_connectivity()
        print(f"SUCCESS with {scheme}!")
        
        with driver.session(database=db) as session:
            result = session.run("RETURN 1 as test")
            for record in result:
                print(f"Query Result: {record['test']}")
        driver.close()
        break
    except Exception as e:
        print(f"Failed: {type(e).__name__}: {e}")
