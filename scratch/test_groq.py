import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"Testing Groq API with key: {api_key[:10]}...")

try:
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    response = llm.invoke("Hello, are you there?")
    print(f"Success! Response: {response.content}")
except Exception as e:
    print(f"Error: {e}")
