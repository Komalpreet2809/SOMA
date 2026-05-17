import sys
import os
import json
import re

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings

def extract_and_print(text: str, user_id: str = "default_user"):
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    owner = user_id.upper()
    prompt = f"""You are a child's brain learning about the world. Read the text and pick out SIMPLE facts as connections between concepts.

Think like a child drawing a mind-map:
- "{owner}" is the person speaking. If they say "I like X" → {owner} --LIKES--> X
- Extract only SHORT concept names (1-3 words). Never use full sentences as names.
- Focus on: people, places, things, hobbies, foods, animals, feelings, skills, jobs

RULES:
1. Nodes must be 1-3 word concept names, ALL CAPS. Example: "CRICKET", "DELHI", "MOM", "CODING"
2. Relations must be simple verbs: LIKES, IS_A, LIVES_IN, PLAYS, WORKS_AT, HAS, KNOWS, STUDIES, etc.
3. "I" or "my" in the text refers to "{owner}" — always use "{owner}" as the node name for the speaker.
4. DO NOT create nodes named "USER", "SOMA", "AI", "ASSISTANT", or any chat/bot terms.
5. If the text is just greetings or small talk with zero factual content, return: []

Text:
{text}

Return ONLY a JSON array of simple connections: [{{"subject": "NODE", "relation": "VERB", "object": "NODE"}}]
No facts? Return: []"""

    print(f"--- Prompt sent to LLM ---")
    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content.strip()
    print(f"--- LLM Output Content ---")
    print(content)
    print(f"--------------------------")

extract_and_print("My dog Baxter likes chasing tennis balls in Delhi", "komal")
