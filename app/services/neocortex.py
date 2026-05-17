import json
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.db.neo4j_driver import neo4j_db

def extract_and_store_knowledge(text: str, user_id: str = "default_user"):
    """
    The Neocortex extraction.
    Takes plain text, finds logical triples, and stores them in Neo4j.
    """
    if not neo4j_db.driver:
        print("Knowledge Graph disabled (No DB connection).")
        return 0
        
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    # Strip conversational prefixes so the LLM sees clean text, not chat format.
    import re as _re
    clean_text = _re.sub(r'^(User|Soma|Assistant|AI|Human):\s*', '', text, flags=_re.MULTILINE).strip()

    # Skip extraction for very short inputs (e.g. just a name) — not enough
    # content to contain meaningful relationships.
    if len(clean_text.split()) < 5:
        print(f"Neocortex: Input too short for extraction ({len(clean_text.split())} words), skipping.")
        return 0

    prompt = f"""Extract real-world knowledge entities and their factual relationships from the text below.

You must extract ONLY concrete knowledge — people, places, organizations, concepts, skills, events, and their relationships.

STRICT RULES:
1. DO NOT create nodes for conversational actors (e.g. "USER", "SOMA", "AI", "ASSISTANT", "BOT").
2. DO NOT create relationships about who said what, who asked whom, or who responded to whom.
3. ONLY extract factual, real-world knowledge that someone would put in an encyclopedia or knowledge base.
4. Entity names must be SHORT (1-3 words max), CAPITALIZED, and represent real concepts — NOT sentences or phrases.
5. If the text is just casual chat with no real knowledge content, return an empty array: []

Text:
{clean_text}

Return ONLY a valid JSON array: [{{"subject": "ENTITY", "relation": "RELATION", "object": "ENTITY"}}]
If no real-world knowledge exists, return: []"""

    # Nodes to block — meta-conversational entities that pollute the graph
    BLOCKED_NODES = {
        "USER", "SOMA", "AI", "ASSISTANT", "BOT", "HUMAN", "SYSTEM",
        "CHATBOT", "NEURAL CORE", "COGNITIVE CONSOLE", "BRAIN",
    }

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # Use regex to find the JSON array in case the LLM added conversational text
        import re
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if not match:
            print("No JSON array found in LLM response.")
            return 0
            
        json_str = match.group(0)
        triples = json.loads(json_str)
        stored_count = 0
        
        for t in triples:
            subj = str(t.get("subject", "")).strip().upper()
            rel = str(t.get("relation", "")).strip().upper()
            obj = str(t.get("object", "")).strip().upper()
            
            # Neo4j relation names can't have spaces or special non-alphanumeric chars
            rel = rel.replace(" ", "_").replace("-", "_")
            
            # Block meta-conversational nodes and overly long node names
            if subj in BLOCKED_NODES or obj in BLOCKED_NODES:
                continue
            if len(subj) > 50 or len(obj) > 50:  # Node names shouldn't be sentences
                continue
            
            if subj and rel and obj:
                cypher = f"""
                MERGE (s:Entity {{name: $subject, user_id: $user_id}})
                MERGE (o:Entity {{name: $object, user_id: $user_id}})
                MERGE (s)-[r:`{rel}`]->(o)
                """
                neo4j_db.query(cypher, {"subject": subj, "object": obj, "user_id": user_id})
                stored_count += 1
                
        return stored_count
    except Exception as e:
        print(f"Error in Neocortex extraction: {e}")
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
