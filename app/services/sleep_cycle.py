"""
The Sleep Cycle — Soma's background consolidation process.

This script mimics what the brain does during deep sleep:
1. Replay: Read all recent conversations (Working Memory).
2. Summarize: Use the LLM to compress raw chats into high-level knowledge.
3. Store: Save the summaries into Sensory Memory (ChromaDB) and extract
   entities/relationships into the Knowledge Graph (Neo4j).
4. Prune: Delete old raw messages to keep Working Memory lean.

Can be run as:
  - A standalone script:  python -m app.services.sleep_cycle
  - A FastAPI background task via the /sleep endpoint
"""

from datetime import datetime
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.db.session import (
    get_all_session_ids,
    get_recent_messages,
    get_message_count,
    prune_old_messages,
)
from app.services.memory import ingest_text
from app.services.neocortex import extract_and_store_knowledge


def _summarize_conversation(conversation_text: str) -> str:
    """Use Llama 3 to compress a raw conversation into key facts."""
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)

    prompt = f"""You are the memory consolidation center of a brain.
Read the following conversation and produce a concise summary of the KEY FACTS learned.
Focus on: names, preferences, relationships, decisions, and any factual statements.
Write the summary as bullet points. Be concise.

CONVERSATION:
{conversation_text}

SUMMARY:"""

    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip()


def run_sleep_cycle(keep_recent: int = 10):
    """
    Execute one full Sleep Cycle across all sessions.

    Args:
        keep_recent: Number of recent messages to keep per session after pruning.

    Returns:
        A report dict with stats.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sessions = get_all_session_ids()

    report = {
        "timestamp": timestamp,
        "sessions_processed": 0,
        "summaries_created": 0,
        "graph_relations_extracted": 0,
        "messages_pruned": 0,
        "details": [],
    }

    if not sessions:
        report["message"] = "No sessions found. Nothing to consolidate."
        return report

    for session_id in sessions:
        msg_count = get_message_count(session_id)

        # Skip sessions with very few messages (nothing meaningful to summarize)
        if msg_count < 4:
            continue

        # --- Phase 1: REPLAY ---
        history = get_recent_messages(session_id, exchanges=50)
        conversation_text = "\n".join(
            [f"{'User' if m['role'] == 'user' else 'Soma'}: {m['content']}" for m in history]
        )

        # --- Phase 2: SUMMARIZE ---
        try:
            summary = _summarize_conversation(conversation_text)
        except Exception as e:
            print(f"Sleep Cycle: Failed to summarize session {session_id}: {e}")
            continue

        # --- Phase 3: STORE ---
        # 3a. Save summary as an episodic memory in ChromaDB
        summary_doc = f"Sleep Cycle Summary ({timestamp}) for session {session_id}:\n{summary}"
        metadata = {
            "type": "sleep_summary",
            "session_id": session_id,
            "timestamp": timestamp,
        }
        chunks = ingest_text(summary_doc, metadata=metadata)
        report["summaries_created"] += 1

        # 3b. Extract knowledge graph triples from the summary
        triples = extract_and_store_knowledge(summary)
        report["graph_relations_extracted"] += triples

        # --- Phase 4: PRUNE ---
        before_count = msg_count
        after_count = prune_old_messages(session_id, keep_recent=keep_recent)
        pruned = before_count - after_count
        report["messages_pruned"] += pruned

        report["sessions_processed"] += 1
        report["details"].append({
            "session_id": session_id,
            "messages_before": before_count,
            "messages_after": after_count,
            "pruned": pruned,
            "summary_chunks": chunks,
            "graph_triples": triples,
        })

        print(f"  Sleep Cycle: Session {session_id} — summarized, {triples} triples, pruned {pruned} messages.")

    report["message"] = f"Sleep Cycle complete. Processed {report['sessions_processed']} sessions."
    return report


# Allow running as a standalone script
if __name__ == "__main__":
    print("=" * 60)
    print("Soma Sleep Cycle — Starting consolidation...")
    print("=" * 60)
    result = run_sleep_cycle()
    print(f"\n{'=' * 60}")
    print(f"Result: {result['message']}")
    print(f"Sessions processed: {result['sessions_processed']}")
    print(f"Summaries created: {result['summaries_created']}")
    print(f"Graph relations: {result['graph_relations_extracted']}")
    print(f"Messages pruned: {result['messages_pruned']}")
    print("=" * 60)
