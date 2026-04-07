import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = "episodic_tester_999"

def test_step4():
    # 1. Talk to Soma (This goes into Working Memory)
    print("--- 1. Creating a memory in Working Memory ---")
    msg1 = "I just bought a new dog named Baxter."
    print(f"User: {msg1}")
    requests.post(f"{BASE_URL}/query", json={"text": msg1, "user_id": TEST_USER})
    
    msg2 = "He is a golden retriever and he loves tennis balls."
    print(f"User: {msg2}")
    requests.post(f"{BASE_URL}/query", json={"text": msg2, "user_id": TEST_USER})
    
    time.sleep(1) # simulate time passing
    
    # 2. Trigger Consolidation (Hippocampus running during "sleep" or session end)
    print("\n--- 2. Triggering Hippocampus (Consolidation) ---")
    consolidation_res = requests.post(f"{BASE_URL}/consolidate", json={"user_id": TEST_USER})
    print(f"Consolidation result: {consolidation_res.json()}")
    
    time.sleep(2) # Give ChromaDB a moment to process the embeddings
    
    # 3. Simulate a NEW session (with a clean working memory slate)
    # We'll use a slightly different user ID just to avoid the local SQLite working memory,
    # forcing Soma to rely entirely on the ChromaDB Sensory/Episodic pull.
    # We will pass the query and it should pull the Baxter memory because of ChromaDB.
    NEW_USER = "episodic_tester_999_new_session"
    
    target_query = "What kind of dog do I have, and what is his name?"
    print(f"\n--- 3. Testing Deep Recall (New Session) ---")
    print(f"User: {target_query}")
    
    final_response = requests.post(f"{BASE_URL}/query", json={"text": target_query, "user_id": NEW_USER})
    data = final_response.json()
    
    print(f"\nSoma: {data.get('response')}")
    print(f"Sources: {data.get('sources')}")

if __name__ == "__main__":
    test_step4()
