import json
import re
from typing import List
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.db.neo4j_driver import neo4j_db

# ── Models ──
# Extraction runs on every message, so it gets the fast small model.
# Judgment calls (same-entity matching, contradiction detection) need
# precision — the 8B model over-merges and over-deletes — so they get the
# bigger free-tier model, with automatic fallback if it's unavailable.
FAST_MODEL = "llama-3.1-8b-instant"
JUDGE_MODEL = "llama-3.3-70b-versatile"


def _llm_complete(prompt: str, model: str) -> str:
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model=model, api_key=api_key)
    return llm.invoke([HumanMessage(content=prompt)]).content


def _judge_complete(prompt: str) -> str:
    try:
        return _llm_complete(prompt, JUDGE_MODEL)
    except Exception as e:
        print(f"Neocortex: judge model unavailable ({e}), falling back to {FAST_MODEL}.")
        return _llm_complete(prompt, FAST_MODEL)


# ── Blocked meta-nodes that should never become graph entities ──
BLOCKED_NODES = {
    "USER", "SOMA", "AI", "ASSISTANT", "BOT", "HUMAN", "SYSTEM",
    "CHATBOT", "NEURAL CORE", "COGNITIVE CONSOLE", "BRAIN",
    "QUESTION", "ANSWER", "RESPONSE", "MESSAGE", "CHAT",
    "CONVERSATION", "HELLO", "HI", "HEY", "THANKS", "THANK YOU",
    "YES", "NO", "OK", "OKAY",
}

# ── Pydantic Models for Structured LLM Output ──
class RelationshipTriple(BaseModel):
    subject: str = Field(description="The subject entity (1-3 words, short CAPITALIZED concept, e.g. KOMAL, BAXTER, CRICKET)")
    relation: str = Field(description="The relationship verb/action, e.g. LIKES, LIVES_IN, PLAYS, HAS, OWNS")
    object: str = Field(description="The object entity (1-3 words, short CAPITALIZED concept, e.g. DELHI, DOG, CRICKET)")

class KnowledgeGraphExtraction(BaseModel):
    triples: List[RelationshipTriple] = Field(description="List of simple extracted concept relationships")


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


def _extract_json(content: str, required_key: str) -> dict:
    """
    Pull the first valid JSON object containing `required_key` out of an LLM
    response. Small models often wrap JSON in prose or emit several blocks,
    so a bare regex-then-parse is not reliable.
    """
    decoder = json.JSONDecoder()
    for m in re.finditer(r'\{', content):
        try:
            obj, _ = decoder.raw_decode(content[m.start():])
        except Exception:
            continue
        if isinstance(obj, dict) and required_key in obj:
            return obj
    return {}


def _sanitize_relation(rel: str) -> str:
    """Clean a relation name for Neo4j compatibility."""
    rel = rel.upper().strip()
    rel = re.sub(r'[^A-Z0-9_]', '_', rel)  # Only alphanumeric + underscore
    rel = re.sub(r'_+', '_', rel).strip('_')  # Collapse multiple underscores
    return rel or "RELATED_TO"


# ── Belief reconciliation ──
# New facts are never written blindly: they are first compared against what
# the graph already believes, so contradictions replace old beliefs instead
# of piling up next to them.

def _normalize_name(name: str) -> str:
    """
    Spelling-insensitive matching form: 'READING_BOOKS' and 'READING BOOKS'
    match, and so do singular/plural variants like 'LILY' and 'LILIES'.
    Only used for comparing names — never stored.
    """
    n = re.sub(r'[^A-Z0-9]', '', name.upper())
    if n.endswith('IES') and len(n) > 4:
        n = n[:-3] + 'Y'
    elif n.endswith('S') and not n.endswith('SS') and len(n) > 3:
        n = n[:-1]
    return n


def _canonicalize_nodes(triples: list, user_id: str) -> list:
    """
    Entity resolution: if a new node name is just a different spelling of an
    entity already in the graph, reuse the existing spelling so duplicates
    like READING_BOOKS next to READING BOOKS are never created.
    """
    rows = neo4j_db.query(
        "MATCH (n:Entity) WHERE n.user_id = $u RETURN n.name AS name LIMIT 300",
        {"u": user_id},
    ) or []
    by_norm = {}
    for r in rows:
        by_norm.setdefault(_normalize_name(r["name"]), r["name"])
    for t in triples:
        t["subject"] = by_norm.get(_normalize_name(t["subject"]), t["subject"])
        t["object"] = by_norm.get(_normalize_name(t["object"]), t["object"])
    return triples


def _verify_alias(name_a: str, name_b: str) -> bool:
    """
    Yes/no double-check before merging two entity names. The matcher can
    over-merge, and a wrong merge corrupts two facts at once — so every
    match must survive this gate. Denies on any error.
    """
    q = (
        f'Answer with exactly one word, YES or NO. Are "{name_a}" and "{name_b}" '
        f'two names for the exact same thing? (Two different foods, cities, '
        f'sports, people or hobbies are NO, even if similar.)'
    )
    try:
        return _judge_complete(q).strip().upper().startswith("YES")
    except Exception:
        return False


def _can_coexist(new_fact: dict, edge: dict) -> bool:
    """
    Final safety gate before deleting a memory. Deleting is destructive,
    so the judge must explicitly confirm the two facts cannot both be true.
    Any doubt or error keeps the old belief.
    """
    q = (
        f'Fact A: "{edge["s"]} {edge["rel"]} {edge["o"]}". '
        f'Fact B: "{new_fact["subject"]} {new_fact["relation"]} {new_fact["object"]}". '
        f'Can both facts be true at the same time? Answer with exactly one word: YES or NO. '
        f'(Opposite feelings about the same thing, or two current home cities, cannot both be true. '
        f'Facts about different topics can.)'
    )
    try:
        return _judge_complete(q).strip().upper().startswith("YES")
    except Exception:
        return True


def _semantic_canonicalize(triples: list, user_id: str) -> list:
    """
    Meaning-based entity resolution: map a new node name onto an existing
    entity when both refer to the SAME real-world thing in different words
    (FOOTBALL -> SOCCER, MOM -> MOTHER, NYC -> NEW YORK).

    An LLM does the matching instead of string or embedding similarity,
    because similarity confuses "related" with "same" — DELHI and MUMBAI
    are highly similar but must never merge. Falls back to no mapping on
    any failure, which just means a new node is created (old behavior).
    """
    rows = neo4j_db.query(
        "MATCH (n:Entity) WHERE n.user_id = $u RETURN n.name AS name LIMIT 150",
        {"u": user_id},
    ) or []
    existing = [r["name"] for r in rows]
    if not existing:
        return triples

    existing_set = set(existing)
    new_names = sorted({
        name for t in triples for name in (t["subject"], t["object"])
        if name not in existing_set
    })
    if not new_names:
        return triples

    prompt = f"""You maintain a person's memory graph. These entities already exist in it:
{", ".join(existing)}

These NEW entity names just appeared:
{", ".join(new_names)}

For each NEW name, check if it means THE SAME real-world thing as ONE existing entity — a synonym, alias, nickname, abbreviation or translation. Examples: FOOTBALL = SOCCER, MOM = MOTHER, NYC = NEW YORK.

STRICT RULE: related is NOT the same. Different cities (DELHI vs MUMBAI), different foods (PIZZA vs PASTA), different sports (CRICKET vs BADMINTON) are NOT matches — two names merely in the same category are different things. When unsure, do NOT match.

Return ONLY JSON: {{"matches": {{"NEW_NAME": "EXISTING_NAME"}}}}. If nothing matches, return {{"matches": {{}}}}."""

    try:
        data = _extract_json(_judge_complete(prompt), "matches")
        raw = data.get("matches", {}) or {}

        mapping = {}
        for new_name, old_name in raw.items():
            new_name, old_name = str(new_name).upper(), str(old_name).upper()
            # Only trust mappings between names we actually presented,
            # and only after they survive the yes/no verification gate.
            if new_name in new_names and old_name in existing_set and _verify_alias(new_name, old_name):
                mapping[new_name] = old_name

        if mapping:
            print(f"Neocortex: semantic aliases resolved: {mapping}")
        for t in triples:
            t["subject"] = mapping.get(t["subject"], t["subject"])
            t["object"] = mapping.get(t["object"], t["object"])
        return triples
    except Exception as e:
        print(f"Neocortex: semantic canonicalization failed ({e}), keeping new names.")
        return triples


def _fetch_related_beliefs(names: list, user_id: str, limit: int = 30) -> list:
    """Existing edges that touch any entity mentioned in the new facts."""
    rows = neo4j_db.query(
        """
        MATCH (n:Entity)-[r]->(m:Entity)
        WHERE n.user_id = $u AND m.user_id = $u
          AND (n.name IN $names OR m.name IN $names)
        RETURN n.name AS s, type(r) AS rel, m.name AS o
        LIMIT $limit
        """,
        {"u": user_id, "names": names, "limit": limit},
    ) or []
    return [{"s": r["s"], "rel": r["rel"], "o": r["o"]} for r in rows]


def _reconcile(new_triples: list, existing: list) -> tuple:
    """
    One LLM call decides, for each new fact: ADD (genuinely new), SKIP
    (already known), or REPLACE (contradicts existing beliefs, which get
    deleted). Falls back to storing everything if the call fails, so a
    flaky LLM can never lose new information.
    Returns (triples_to_store, deletions) where each deletion pairs the
    edge with the new fact that contradicts it: {"edge": ..., "new": ...}.
    """
    e_lines = "\n".join(f"E{i+1}: {e['s']} {e['rel']} {e['o']}" for i, e in enumerate(existing))
    n_lines = "\n".join(f"N{i+1}: {t['subject']} {t['relation']} {t['object']}" for i, t in enumerate(new_triples))

    prompt = f"""You maintain a person's memory. Compare each NEW fact against the EXISTING beliefs.

EXISTING beliefs:
{e_lines}

NEW facts:
{n_lines}

For each NEW fact choose exactly ONE action:
- "ADD": new information not covered by any existing belief.
- "SKIP": same meaning as an existing belief (already known).
- "REPLACE": contradicts or updates existing belief(s). Put those belief ids in "deletes".

Two facts conflict when they cannot both be true at once: opposite feelings about the same thing (LOVES vs HATES), a new home city, a changed job or status. Facts about different topics never conflict.
Treat singular/plural or spelling variants of a name as the SAME thing: "LILY" and "LILIES" are one concept, so LIKES LILY conflicts with HATES LILIES.

Return ONLY JSON in this exact format:
{{"decisions": [{{"fact": "N1", "action": "REPLACE", "deletes": ["E2"]}}, {{"fact": "N2", "action": "ADD", "deletes": []}}]}}"""

    to_store, to_delete = [], []
    try:
        data = _extract_json(_judge_complete(prompt), "decisions")

        decisions = {}
        for d in data.get("decisions", []):
            fact_id = str(d.get("fact", "")).upper().replace("N", "")
            if fact_id.isdigit():
                decisions[int(fact_id) - 1] = d

        for i, t in enumerate(new_triples):
            d = decisions.get(i, {})
            action = str(d.get("action", "ADD")).upper()
            if action == "SKIP":
                continue
            if action == "REPLACE":
                for e_id in d.get("deletes", []) or []:
                    e_idx = str(e_id).upper().replace("E", "")
                    if e_idx.isdigit() and 0 < int(e_idx) <= len(existing):
                        to_delete.append({"edge": existing[int(e_idx) - 1], "new": t})
            to_store.append(t)
        return to_store, to_delete
    except Exception as e:
        print(f"Neocortex: reconciliation failed ({e}), storing all new facts.")
        return new_triples, []


def extract_and_store_knowledge(text: str, user_id: str = "default_user", context: str = ""):
    """
    Child-brain knowledge extraction with 100% structurally guaranteed JSON output.

    Reads a conversation and extracts simple, clean concept associations —
    the way a child's brain naturally builds connections between ideas.

    `context` is the assistant message the user was replying to. With it,
    short answers like "umm tomato" become extractable facts, because the
    question ("What's your favorite topping?") supplies the missing meaning.
    """
    if not neo4j_db.driver:
        print("Knowledge Graph disabled (No DB connection).")
        return 0

    clean = _clean_text(text)
    ctx = _clean_text(context)[-500:] if context else ""

    # Without context, a fact needs at least 3 words ("I like apples").
    # With context, even a one-word reply can carry a fact.
    min_words = 1 if ctx else 3
    if len(clean.split()) < min_words:
        print(f"Neocortex: Input too short ({len(clean.split())} words), skipping.")
        return 0

    owner = user_id.upper()

    if ctx:
        text_block = f'Soma asked: "{ctx}"\n{owner} replied: "{clean}"'
        context_rule = f"""
6. The reply may be a short answer to Soma's question. Combine the question and the reply to infer the fact. Example: if Soma asked "What's your favorite topping?" and the reply is "umm tomato", extract {owner} --LIKES--> TOMATO."""
    else:
        text_block = clean
        context_rule = ""

    prompt = f"""You are a child's brain learning about the world. Read the text and pick out SIMPLE facts as connections between concepts.

Think like a child drawing a mind-map:
- "{owner}" is the person speaking. If they say "I like X" → {owner} --LIKES--> X
- Extract only SHORT concept names (1-3 words). Never use full sentences as names.
- Focus on: people, places, things, hobbies, foods, animals, feelings, skills, jobs

RULES:
1. Nodes must be 1-3 word concept names, ALL CAPS, in SINGULAR form. Example: "CRICKET", "DELHI", "MOM", "LILY" (not "LILIES"), "BOOK" (not "BOOKS")
2. Relations must be simple verbs: LIKES, IS_A, LIVES_IN, PLAYS, WORKS_AT, HAS, KNOWS, STUDIES, etc.
3. "I" or "my" in the text refers to "{owner}" — always use "{owner}" as the node name for the speaker.
4. DO NOT create nodes named "USER", "SOMA", "AI", "ASSISTANT", or any chat/bot terms.
5. If the text is just greetings or small talk with zero factual content, return an empty triples list.{context_rule}

Text:
{text_block}

Return the extracted facts ONLY as a valid JSON block in this exact format:
{{
  "triples": [
    {{"subject": "SUBJECT", "relation": "RELATION", "object": "OBJECT"}}
  ]
}}
Do not write any other explanation or thoughts outside the JSON block. If there are no facts, return: {{"triples": []}}"""

    try:
        content = _llm_complete(prompt, FAST_MODEL).strip()

        data = _extract_json(content, "triples")
        if not data:
            print("Neocortex: No JSON block found in LLM response.")
            return 0
        triples_data = data.get("triples", [])
            
        if not triples_data:
            print("Neocortex: No triples extracted.")
            return 0
            
        # ── Validate and clean the extracted triples ──
        new_triples = []
        seen = set()
        for t in triples_data:
            subj = str(t.get("subject", "")).strip().upper()
            rel  = _sanitize_relation(str(t.get("relation", "")))
            obj  = str(t.get("object", "")).strip().upper()

            if not _is_valid_node(subj) or not _is_valid_node(obj):
                continue
            if subj == obj:  # Self-loops are meaningless
                continue
            if (subj, rel, obj) in seen:
                continue
            seen.add((subj, rel, obj))
            new_triples.append({"subject": subj, "relation": rel, "object": obj})

        if not new_triples:
            return 0

        # ── Reconcile with existing beliefs before writing ──
        new_triples = _canonicalize_nodes(new_triples, user_id)     # spelling/plural variants (free)
        new_triples = _semantic_canonicalize(new_triples, user_id)  # same meaning, different words
        names = list({n for t in new_triples for n in (t["subject"], t["object"])})
        existing = _fetch_related_beliefs(names, user_id)
        if existing:
            to_store, to_delete = _reconcile(new_triples, existing)
        else:
            to_store, to_delete = new_triples, []

        deleted = set()
        for pair in to_delete:
            edge, new_fact = pair["edge"], pair["new"]
            key = (edge["s"], edge["rel"], edge["o"])
            if key in deleted:
                continue
            if _can_coexist(new_fact, edge):
                print(f"Neocortex: kept '{edge['s']} {edge['rel']} {edge['o']}' — no real conflict with new fact.")
                continue
            neo4j_db.query(
                """
                MATCH (s:Entity {name: $s, user_id: $u})-[r]->(o:Entity {name: $o, user_id: $u})
                WHERE type(r) = $rel
                DELETE r
                """,
                {"s": edge["s"], "o": edge["o"], "rel": edge["rel"], "u": user_id},
            )
            deleted.add(key)
        if deleted:
            print(f"Neocortex: belief revision removed {len(deleted)} outdated relation(s).")

        stored_count = 0
        for t in to_store:
            cypher = f"""
            MERGE (s:Entity {{name: $subject, user_id: $user_id}})
            MERGE (o:Entity {{name: $object, user_id: $user_id}})
            MERGE (s)-[r:`{t["relation"]}`]->(o)
            """
            neo4j_db.query(cypher, {"subject": t["subject"], "object": t["object"], "user_id": user_id})
            stored_count += 1

        # Replaced edges can leave nodes with no connections — remove them so
        # the mesh doesn't show floating orphans.
        if deleted:
            neo4j_db.query(
                "MATCH (n:Entity) WHERE n.user_id = $u AND NOT (n)--() DELETE n",
                {"u": user_id},
            )

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
