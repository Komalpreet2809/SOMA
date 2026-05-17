import asyncio
from app.services.orchestrator import orchestrator
from app.core.config import settings

async def test_query():
    state_input = {
        "input": "hey",
        "user_id": "test_user",
        "chat_history": [],
        "context": [],
        "graph_context": [],
        "reflection": "",
        "response": ""
    }
    
    print("Starting stream...")
    try:
        async for output in orchestrator.astream(state_input):
            print(f"Output: {output}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_query())
