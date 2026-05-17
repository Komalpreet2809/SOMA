import sys
import os
import json
import asyncio

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set dummy env vars for import if needed
os.environ["GROQ_API_KEY"] = "dummy"

from app.services.neocortex import extract_and_store_knowledge

# Test direct extraction (mocking settings/groq if needed, but let's see what happens)
async def main():
    print("Testing neocortex on clean input...")
    # Let's inspect what happens with some inputs
    test_inputs = [
        "I live in Delhi",
        "My dog Baxter loves tennis balls",
        "I like cricket",
        "hello",
    ]
    for inp in test_inputs:
        print(f"\nInput: '{inp}'")
        # Since we might not have settings loaded properly in scratch script without proper env,
        # let's just inspect neocortex logic or run it if credentials are set.
        try:
            # We can view what neocortex does
            pass
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
