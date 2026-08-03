import sys
import os
import json
import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from typing import List

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

class RelationshipTriple(BaseModel):
    subject: str
    relation: str
    object: str

class KnowledgeGraphExtraction(BaseModel):
    triples: List[RelationshipTriple]

def extract_knowledge_robust(text: str, user_id: str = "default_user"):
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
5. If the text is just greetings or small talk with zero factual content, return an empty triples list.

Text:
{text}

Return the extracted facts ONLY as a valid JSON block in this exact format:
{{
  "triples": [
    {{"subject": "SUBJECT", "relation": "RELATION", "object": "OBJECT"}}
  ]
}}
Do not write any other explanation or thoughts outside the JSON block. If there are no facts, return: {{"triples": []}}"""

    response = llm.invoke([HumanMessage(content=prompt)])
    content = response.content.strip()
    
    print("\n--- Raw LLM Response ---")
    print(content)
    
    # Extract JSON block using regex
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            data = json.loads(json_str)
            triples = []
            for t in data.get("triples", []):
                triples.append(RelationshipTriple(
                    subject=t.get("subject", ""),
                    relation=t.get("relation", ""),
                    object=t.get("object", "")
                ))
            return triples
        except Exception as e:
            print("Failed to parse JSON:", e)
            return []
    else:
        print("No JSON block found.")
        return []

def main():
    print("Testing robust extraction method...")
    test_text = "Dr. Aris is the creator of the Soma Project. The Soma Project is an advanced cognitive architecture."
    triples = extract_knowledge_robust(test_text, "komal")
    print("\n--- Extracted Triples ---")
    for t in triples:
        print(f"- {t.subject} --{t.relation}--> {t.object}")

if __name__ == "__main__":
    main()
