import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_step2():
    # 1. Ingest a specific fact
    fact = "The secret code for the Soma vault is 998877. This code was created by Dr. Aris in 1995."
    print(f"Ingesting fact: {fact}")
    
    ingest_payload = {"text": fact}
    requests.post(f"{BASE_URL}/ingest", json=ingest_payload)
    
    # Wait a moment for Chroma to sync (usually instant but good for safety)
    time.sleep(1)
    
    # 2. Ask a question about the fact
    query = "What is the secret code for the vault and who created it?"
    print(f"Asking: {query}")
    
    query_payload = {"text": query}
    response = requests.post(f"{BASE_URL}/query", json=query_payload)
    
    print("\n--- Response from Soma ---")
    data = response.json()
    print(data.get("response"))
    print(f"\nSources: {data.get('sources')}")

if __name__ == "__main__":
    test_step2()
