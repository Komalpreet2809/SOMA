import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
TEST_USER = "soma_tester_001"

def test_step3():
    # 1. Send first message (establishing context)
    msg1 = "Hi Soma, my name is Captain Alex."
    print(f"User: {msg1}")
    
    payload1 = {"text": msg1, "user_id": TEST_USER}
    response1 = requests.post(f"{BASE_URL}/query", json=payload1)
    print(f"Soma: {response1.json().get('response')}\n")
    
    time.sleep(1) # just to ensure timestamp ordering
    
    # 2. Send second message (testing working memory)
    msg2 = "What did I just say my name was?"
    print(f"User: {msg2}")
    
    payload2 = {"text": msg2, "user_id": TEST_USER}
    response2 = requests.post(f"{BASE_URL}/query", json=payload2)
    
    data2 = response2.json()
    print(f"Soma: {data2.get('response')}")
    print(f"\nSources for response 2: {data2.get('sources')}")

if __name__ == "__main__":
    test_step3()
