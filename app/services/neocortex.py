import json
import re
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.db.neo4j_driver import neo4j_db


# ── Blocked meta-nodes that should never become graph entities ──
BLOCKED_NODES = {
    "USER", "SOMA", "AI", "ASSISTANT", "BOT", "HUMAN", "SYSTEM",
    "CHATBOT", "NEURAL CORE", "COGNITIVE CONSOLE", "BRAIN",
    "QUESTION", "ANSWER", "RESPONSE", "MESSAGE", "CHAT",
    "CONVERSATION", "HELLO", "HI", "HEY", "THANKS", "THANK YOU",
    "YES", "NO", "OK", "OKAY",
}


def _clean_text(text: str) -> str:
    """Strip chat-format prefixes so the LLM sees pure content, not 'User: ...'."""
    cleaned = re.sub(r'^(User|Soma|Assistant|AI|Human):\s*', '', text, flags=re.MULTILINE)
    return cleaned.strip()


def _is_valid_node(name: str) -> bool:
    """
    STRICT validation: only allow clean, short concept names as graph nodes.
    Blocks sentences, conversational text, and anything that isn't a real concept.
    """
    if not name or name in BLOCKED_NODES:
        return False

    # Hard length limits — concepts are SHORT
    if len(name) > 30 or len(name.split()) > 3:
        return False

    # Block anything with sentence punctuation (periods, question marks, exclamation, commas)
    if re.search(r'[.!?,;:\'"()]', name):
        return False

    # Block anything that looks like a sentence/phrase (contains common filler words)
    FILLER_WORDS = {
        "THE", "A", "AN", "IS", "ARE", "WAS", "WERE", "BE", "BEEN",
        "HAVE", "HAS", "HAD", "DO", "DOES", "DID", "WILL", "WOULD",
        "COULD", "SHOULD", "MAY", "MIGHT", "SHALL", "CAN",
        "THIS", "THAT", "THESE", "THOSE", "IT", "ITS",
        "VERY", "REALLY", "JUST", "ALSO", "TOO", "SO",
        "HOW", "WHAT", "WHERE", "WHEN", "WHY", "WHO",
        "YOUR", "MY", "OUR", "THEIR", "HIS", "HER",
        "NOT", "BUT", "AND", "OR", "IF", "THEN",
        "THERE", "HERE", "NICE", "MEET", "GOING",
        "ABOUT", "WITH", "FROM", "INTO", "OVER",
    }
    words = set(name.split())
    # If more than half the words are filler, it's a sentence not a concept
    filler_count = len(words & FILLER_WORDS)
    if filler_count >= 2 or (len(words) == 1 and name in FILLER_WORDS):
        return False

    # Must contain at least one letter
    if not re.search(r'[A-Z]', name):
        return False

    return True


def _sanitize_relation(rel: str) -> str:
    """Clean a relation name for Neo4j compatibility."""
    rel = rel.upper().strip()
    rel = re.sub(r'[^A-Z0-9_]', '_', rel)  # Only alphanumeric + underscore
    rel = re.sub(r'_+', '_', rel).strip('_')  # Collapse multiple underscores
    return rel or "RELATED_TO"


def extract_and_store_knowledge(text: str, user_id: str = "default_user"):
    """
    Child-brain knowledge extraction.
    
    Reads a conversation and extracts simple, clean concept associations —
    the way a child's brain naturally builds connections between ideas.
    
    "I play cricket on Sundays" → KOMAL --PLAYS--> CRICKET, CRICKET --PLAYED_ON--> SUNDAY
    "My dog Baxter loves the park" → BAXTER --IS_A--> DOG, BAXTER --LOVES--> PARK
    """
    if not neo4j_db.driver:
        print("Knowledge Graph disabled (No DB connection).")
        return 0
        
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    clean = _clean_text(text)

    # Need at least a few words to extract anything meaningful
    if len(clean.split()) < 5:
        print(f"Neocortex: Input too short ({len(clean.split())} words), skipping.")
        return 0

    # The user's name is the identity anchor — capitalize for consistency
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
{clean}

Return ONLY a JSON array of simple connections: [{{"subject": "NODE", "relation": "VERB", "object": "NODE"}}]
No facts? Return: []"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if not match:
            print("Neocortex: No JSON array in LLM response.")
            return 0
            
        triples = json.loads(match.group(0))
        stored_count = 0
        
        for t in triples:
            subj = str(t.get("subject", "")).strip().upper()
            rel  = _sanitize_relation(str(t.get("relation", "")))
            obj  = str(t.get("object", "")).strip().upper()
            
            # Validate both nodes
            if not _is_valid_node(subj) or not _is_valid_node(obj):
                continue
            if subj == obj:  # Self-loops are meaningless
                continue
            
            cypher = f"""
            MERGE (s:Entity {{name: $subject, user_id: $user_id}})
            MERGE (o:Entity {{name: $object, user_id: $user_id}})
            MERGE (s)-[r:`{rel}`]->(o)
            """
            neo4j_db.query(cypher, {"subject": subj, "object": obj, "user_id": user_id})
            stored_count += 1
                
        return stored_count
    except Exception as e:
        print(f"Neocortex extraction error: {e}")
        return 0


def retrieve_graph_context(query: str, user_id: str = "default_user"):
    """
    Search the Knowledge Graph for entities mentioned in the query.
    Returns (context_strings, touched_entities)
    """
    if not neo4j_db.driver:
        return [], []
        
    # Naive keyword matching: if any node name is in the query, pull its connections.
    cypher = """
    MATCH (n:Entity)-[r]->(m:Entity)
    WHERE (n.user_id = $user_id)
      AND (m.user_id = $user_id)
      AND (toLower($query) CONTAINS toLower(n.name) OR toLower($query) CONTAINS toLower(m.name))
    RETURN n.name AS s, type(r) AS rel, m.name AS o
    LIMIT 15
    """
    try:
        results = neo4j_db.query(cypher, {"query": query, "user_id": user_id})
        if not results:
            return [], []
        
        context = []
        touched = set()
        for res in results:
            context.append(f"{res['s']} [{res['rel']}] {res['o']}")
            touched.add(res['s'])
            touched.add(res['o'])
            
        return context, list(touched)
    except Exception as e:
        print(f"Error retrieving from Neocortex: {e}")
        return [], []
