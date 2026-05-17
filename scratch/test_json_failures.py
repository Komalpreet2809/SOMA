import sys
import os
import json
import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings

def extract_and_inspect():
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    owner = "KOMAL"
    inp = "My dog Baxter likes chasing tennis balls in Delhi"
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
{inp}

Return ONLY a JSON array of simple connections: [{{"subject": "NODE", "relation": "VERB", "object": "NODE"}}]
No facts? Return: []"""

    # We do 5 calls to see if it ever generates invalid JSON
    for i in range(5):
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        print(f"\n--- Run {i+1} Output ---")
        print(content)
        
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                json.loads(json_str)
                print("Valid JSON: Yes")
            except Exception as e:
                print(f"Valid JSON: No (Error: {e})")
                print(f"Extracted string: {json_str!r}")

extract_and_inspect()
