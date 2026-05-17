import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pydantic import BaseModel, Field
from typing import List
from langchain_groq import ChatGroq
from app.core.config import settings

class RelationshipTriple(BaseModel):
    subject: str = Field(description="The subject entity (1-3 words, UPPERCASE concept)")
    relation: str = Field(description="The relationship verb/action, e.g. LIKES, LIVES_IN, PLAYS")
    object: str = Field(description="The object entity (1-3 words, UPPERCASE concept)")

class KnowledgeGraphExtraction(BaseModel):
    triples: List[RelationshipTriple] = Field(description="List of extracted concept relationships")

def test_structured_output():
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    try:
        structured_llm = llm.with_structured_output(KnowledgeGraphExtraction)
        print("Success: ChatGroq.with_structured_output is fully supported!")
        
        # Test it on a simple prompt
        result = structured_llm.invoke("My dog Baxter likes chasing tennis balls in Delhi")
        print("Result object:", result)
        print("Extracted triples:")
        for t in result.triples:
            print(f"- {t.subject} --{t.relation}--> {t.object}")
    except Exception as e:
        print("Failed to run structured output:", e)

if __name__ == "__main__":
    test_structured_output()
