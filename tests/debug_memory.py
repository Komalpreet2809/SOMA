import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.memory import ingest_text, retrieve_context

def debug_memory():
    fact = "The secret code for the Soma vault is 998877. This code was created by Dr. Aris in 1995."
    print(f"STEP 1: Ingesting fact...")
    chunks = ingest_text(fact)
    print(f"Ingested {chunks} chunks.")
    
    query = "What is the secret code for the vault?"
    print(f"\nSTEP 2: Retrieving context for: {query}")
    context = retrieve_context(query)
    
    print(f"\nSTEP 3: Resulting context:")
    if not context:
        print("EMPTY CONTEXT!")
    for i, doc in enumerate(context):
        print(f"[{i}] {doc}")

if __name__ == "__main__":
    debug_memory()
