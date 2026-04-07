import requests
import time

BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 120  # 2 minutes per request (LLM + embedding calls are heavy)

def test_step6():
    # 1. Populate Working Memory with a few conversations
    print("--- Phase 1: Populating Working Memory ---")
    users = {
        "sleep_user_A": [
            "I love programming in Python. My favorite framework is FastAPI.",
            "I'm building an AI project called Soma.",
        ],
        "sleep_user_B": [
            "My cat's name is Luna and she is a British Shorthair.",
            "Luna loves sleeping on my keyboard.",
        ],
    }
    
    for user_id, messages in users.items():
        for msg in messages:
            print(f"  [{user_id}]: {msg}")
            res = requests.post(f"{BASE_URL}/query", json={"text": msg, "user_id": user_id}, timeout=TIMEOUT)
            print(f"    -> OK ({res.status_code})")
    
    time.sleep(1)
    
    # 2. Trigger the Sleep Cycle
    print("\n--- Phase 2: Triggering Sleep Cycle ---")
    sleep_res = requests.post(f"{BASE_URL}/sleep", timeout=TIMEOUT)
    report = sleep_res.json()
    
    print(f"  Status: {report.get('message')}")
    print(f"  Sessions processed: {report.get('sessions_processed')}")
    print(f"  Summaries created: {report.get('summaries_created')}")
    print(f"  Graph relations extracted: {report.get('graph_relations_extracted')}")
    print(f"  Messages pruned: {report.get('messages_pruned')}")
    
    if report.get("details"):
        print("\n  Session Details:")
        for d in report["details"]:
            print(f"    - {d['session_id']}: {d['messages_before']} msgs -> {d['messages_after']} msgs (pruned {d['pruned']}), {d['graph_triples']} triples")
    
    # 3. Verify the summarized knowledge persists
    print("\n--- Phase 3: Verifying Deep Recall After Sleep ---")
    query = "What is the name of the cat and what breed is she?"
    print(f"  User (new session): {query}")
    
    res = requests.post(f"{BASE_URL}/query", json={"text": query, "user_id": "post_sleep_tester"}, timeout=TIMEOUT)
    data = res.json()
    print(f"  Soma: {data.get('response')}")

if __name__ == "__main__":
    test_step6()
