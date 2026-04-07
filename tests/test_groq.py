import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.orchestrator import orchestrator

state_input = {
    "input": "Hello Llama 3! System check, are you receiving this?",
    "chat_history": [],
    "context": [],
    "response": ""
}

try:
    print("Sending query to Groq Llama 3...")
    result = orchestrator.invoke(state_input)
    print("\n--- Response ---")
    print(result.get("response"))
except Exception as e:
    print(f"\nError: {e}")
