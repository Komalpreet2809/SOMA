import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_step5():
    # 1. Provide an isolated fact to trigger learning (Knowledge Extraction)
    print("--- 1. Ingesting Semantic Fact ---")
    fact = "Dr. Aris is the creator of the Soma Project. The Soma Project is an advanced cognitive architecture."
    
    print(f"Fact: {fact}")
    ingest_res = requests.post(f"{BASE_URL}/ingest", json={"text": fact})
    print(f"Ingest Result: {ingest_res.json()}")
    
    # 2. Give Neo4j a second to process the MERGE statements
    time.sleep(2)
    
    # 3. Query the graph using LangGraph's new context retrieval
    print("\n--- 2. Testing Neocortex (Knowledge Graph) Recall ---")
    query = "Who is the creator of the Soma Project, and what is the Soma Project?"
    print(f"User: {query}")
    
    # Using a unique user ID so working memory doesn't help
    query_res = requests.post(f"{BASE_URL}/query", json={"text": query, "user_id": "graph_tester_01"})
    print(f"\nSoma: {query_res.json().get('response')}")

if __name__ == "__main__":
    test_step5()
