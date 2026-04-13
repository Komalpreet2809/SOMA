from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import json
import asyncio
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.orchestrator import orchestrator
from app.services.memory import ingest_text
from app.db.session import get_recent_messages, add_message, get_recent_sparks
from app.services.hippocampus import consolidate_memory
from app.services.neocortex import extract_and_store_knowledge
from app.services.sleep_cycle import run_sleep_cycle
from app.db.neo4j_driver import neo4j_db
from app.services.vitals import get_brain_vitals
from app.auth.auth import get_current_user

router = APIRouter()


# ── Background memory builder ────────────────────────────────────

async def _build_memory(exchange_text: str, user_id: str):
    """Ingest a chat exchange into sensory + semantic memory in the background."""
    try:
        await asyncio.to_thread(ingest_text, exchange_text, {"type": "chat_exchange"}, user_id)
        await asyncio.to_thread(extract_and_store_knowledge, exchange_text, user_id)
    except Exception as e:
        print(f"Background memory build error: {e}")


# ── Brain Vitals ─────────────────────────────────────────────────

@router.get("/brain/vitals")
async def fetch_brain_vitals(current_user: str = Depends(get_current_user)):
    return get_brain_vitals(current_user)


@router.get("/brain/sparks")
async def fetch_neural_sparks(limit: int = 5, current_user: str = Depends(get_current_user)):
    return get_recent_sparks(user_id=current_user, limit=limit)


# ── Knowledge Graph ───────────────────────────────────────────────

@router.get("/graph")
async def get_knowledge_graph(current_user: str = Depends(get_current_user)):
    if not neo4j_db.driver:
        return {"nodes": [], "edges": [], "status": "offline"}

    try:
        node_query = """
        MATCH (n:Entity)
        WHERE n.user_id = $user_id OR n.user_id IS NULL
        OPTIONAL MATCH (n)-[r]-()
        RETURN n.name AS id, count(r) AS connections
        ORDER BY connections DESC
        """
        node_results = neo4j_db.query(node_query, {"user_id": current_user}) or []

        edge_query = """
        MATCH (s:Entity)-[r]->(t:Entity)
        WHERE (s.user_id = $user_id OR s.user_id IS NULL)
          AND (t.user_id = $user_id OR t.user_id IS NULL)
        RETURN s.name AS source, type(r) AS label, t.name AS target
        """
        edge_results = neo4j_db.query(edge_query, {"user_id": current_user}) or []

        nodes = [{"id": r["id"], "label": r["id"], "connections": r["connections"]} for r in node_results]
        edges = [{"source": r["source"], "target": r["target"], "label": r["label"]} for r in edge_results]

        return {"nodes": nodes, "edges": edges, "status": "online"}
    except Exception as e:
        return {"nodes": [], "edges": [], "status": "error", "detail": str(e)}


@router.get("/graph/stats")
async def get_graph_stats(current_user: str = Depends(get_current_user)):
    if not neo4j_db.driver:
        return {"node_count": 0, "edge_count": 0, "top_entities": [], "status": "offline"}

    try:
        count_query = """
        MATCH (n:Entity)
        WHERE n.user_id = $user_id OR n.user_id IS NULL
        OPTIONAL MATCH (n)-[r]->()
        RETURN count(DISTINCT n) AS nodes, count(DISTINCT r) AS edges
        """
        counts = neo4j_db.query(count_query, {"user_id": current_user})
        node_count = counts[0]["nodes"] if counts else 0
        edge_count = counts[0]["edges"] if counts else 0

        top_query = """
        MATCH (n:Entity)-[r]-()
        WHERE n.user_id = $user_id OR n.user_id IS NULL
        RETURN n.name AS entity, count(r) AS connections
        ORDER BY connections DESC
        LIMIT 5
        """
        top_results = neo4j_db.query(top_query, {"user_id": current_user}) or []
        top_entities = [{"entity": r["entity"], "connections": r["connections"]} for r in top_results]

        return {"node_count": node_count, "edge_count": edge_count, "top_entities": top_entities, "status": "online"}
    except Exception as e:
        return {"node_count": 0, "edge_count": 0, "top_entities": [], "status": "error", "detail": str(e)}


# ── Request / Response Models ─────────────────────────────────────

class QueryRequest(BaseModel):
    text: str

class QueryResponse(BaseModel):
    response: str
    sources: List[str] = []

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[Dict] = None

class IngestResponse(BaseModel):
    message: str
    chunks: int

class ConsolidateRequest(BaseModel):
    pass  # user_id now comes from token


# ── Consolidate ───────────────────────────────────────────────────

@router.post("/consolidate", response_model=IngestResponse)
async def process_consolidation(current_user: str = Depends(get_current_user)):
    try:
        chunks, msg = consolidate_memory(current_user)
        if chunks > 0:
            history = get_recent_messages(current_user, exchanges=50)
            doc = "\n".join([f"{m['role']}: {m['content']}" for m in history])
            triples = extract_and_store_knowledge(doc, current_user)
            msg += f" Extracted {triples} graph relations."
        return IngestResponse(message=msg, chunks=chunks)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Sleep ─────────────────────────────────────────────────────────

@router.post("/sleep")
async def process_sleep_cycle(current_user: str = Depends(get_current_user)):
    try:
        report = run_sleep_cycle(keep_recent=10)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Ingest ────────────────────────────────────────────────────────

@router.post("/ingest", response_model=IngestResponse)
async def process_ingest(request: IngestRequest, current_user: str = Depends(get_current_user)):
    try:
        num_chunks = ingest_text(request.text, request.metadata, current_user)
        triples = extract_and_store_knowledge(request.text, current_user)
        return IngestResponse(
            message=f"Sensory data ingested. Extracted {triples} graph relations.",
            chunks=num_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Stream Query ──────────────────────────────────────────────────

@router.post("/query/stream")
async def process_query_stream(request: QueryRequest, current_user: str = Depends(get_current_user)):
    async def event_generator():
        try:
            history = get_recent_messages(current_user, exchanges=5)
            state_input = {
                "input": request.text,
                "user_id": current_user,
                "chat_history": history,
                "context": [],
                "graph_context": [],
                "reflection": "",
                "response": ""
            }

            perception_msg = f"Processing query: {request.text[:50]}..."
            yield f"event: trace\ndata: {json.dumps({'phase': 'perception', 'message': perception_msg})}\n\n"
            await asyncio.sleep(0.1)

            for output in orchestrator.stream(state_input):
                for node_name, node_output in output.items():
                    if node_name == "reflect":
                        reflection = node_output.get("reflection", "")
                        yield f"event: reflection\ndata: {json.dumps({'message': reflection})}\n\n"
                        await asyncio.sleep(0.3)

                    elif node_name == "retrieve":
                        trace_data = node_output.get("trace_data", {})
                        recall_msg = f"Found {trace_data.get('sensory_count')} sensory memories."
                        assoc_msg = f"Extracted {trace_data.get('graph_count')} graph relations."
                        yield f"event: trace\ndata: {json.dumps({'phase': 'recall', 'message': recall_msg, 'data': node_output.get('context')})}\n\n"
                        await asyncio.sleep(0.2)
                        yield f"event: trace\ndata: {json.dumps({'phase': 'association', 'message': assoc_msg, 'data': node_output.get('graph_context'), 'touched': trace_data.get('touched')})}\n\n"
                        await asyncio.sleep(0.2)

                    elif node_name == "call_model":
                        reason_msg = "Synthesizing final response via Cortex Node..."
                        yield f"event: trace\ndata: {json.dumps({'phase': 'reasoning', 'message': reason_msg})}\n\n"
                        await asyncio.sleep(0.1)

                        final_response = node_output.get("response", "")
                        add_message(current_user, "user", request.text)
                        add_message(current_user, "assistant", final_response)

                        # Auto-build neural mesh: ingest exchange into
                        # sensory memory (ChromaDB) and semantic memory (Neo4j)
                        exchange_text = f"User: {request.text}\nSoma: {final_response}"
                        asyncio.create_task(_build_memory(exchange_text, current_user))

                        yield f"event: final_result\ndata: {json.dumps({'response': final_response})}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── History ───────────────────────────────────────────────────────

@router.get("/history")
async def fetch_chat_history(current_user: str = Depends(get_current_user)):
    try:
        history = get_recent_messages(current_user, exchanges=20)
        return {"messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
