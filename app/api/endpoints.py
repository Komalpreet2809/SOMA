from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse
import json
import asyncio
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.orchestrator import orchestrator
from app.services.memory import ingest_text
from app.db.session import get_recent_messages, add_message
from app.services.hippocampus import consolidate_memory
from app.services.neocortex import extract_and_store_knowledge
from app.services.sleep_cycle import run_sleep_cycle
from app.db.neo4j_driver import neo4j_db

from app.services.vitals import get_brain_vitals

router = APIRouter()

@router.get("/brain/vitals")
async def fetch_brain_vitals(user_id: str = "default_user"):
    """Return metrics for Sensory, Semantic, and Working Memory layers."""
    return get_brain_vitals(user_id)


# ── Knowledge Graph Endpoints ────────────────────────────────────

@router.get("/graph")
async def get_knowledge_graph():
    """Return all nodes and edges from the Knowledge Graph for visualization."""
    if not neo4j_db.driver:
        return {"nodes": [], "edges": [], "status": "offline"}

    try:
        # Fetch all nodes with their connection counts
        node_query = """
        MATCH (n:Entity)
        OPTIONAL MATCH (n)-[r]-()
        RETURN n.name AS id, count(r) AS connections
        ORDER BY connections DESC
        """
        node_results = neo4j_db.query(node_query) or []

        # Fetch all edges
        edge_query = """
        MATCH (s:Entity)-[r]->(t:Entity)
        RETURN s.name AS source, type(r) AS label, t.name AS target
        """
        edge_results = neo4j_db.query(edge_query) or []

        nodes = [
            {"id": r["id"], "label": r["id"], "connections": r["connections"]}
            for r in node_results
        ]
        edges = [
            {"source": r["source"], "target": r["target"], "label": r["label"]}
            for r in edge_results
        ]

        return {"nodes": nodes, "edges": edges, "status": "online"}
    except Exception as e:
        return {"nodes": [], "edges": [], "status": "error", "detail": str(e)}


@router.get("/graph/stats")
async def get_graph_stats():
    """Return aggregate stats about the Knowledge Graph."""
    if not neo4j_db.driver:
        return {"node_count": 0, "edge_count": 0, "top_entities": [], "status": "offline"}

    try:
        count_query = """
        MATCH (n:Entity)
        OPTIONAL MATCH ()-[r]->()
        RETURN count(DISTINCT n) AS nodes, count(DISTINCT r) AS edges
        """
        counts = neo4j_db.query(count_query)
        node_count = counts[0]["nodes"] if counts else 0
        edge_count = counts[0]["edges"] if counts else 0

        top_query = """
        MATCH (n:Entity)-[r]-()
        RETURN n.name AS entity, count(r) AS connections
        ORDER BY connections DESC
        LIMIT 5
        """
        top_results = neo4j_db.query(top_query) or []
        top_entities = [{"entity": r["entity"], "connections": r["connections"]} for r in top_results]

        return {
            "node_count": node_count,
            "edge_count": edge_count,
            "top_entities": top_entities,
            "status": "online"
        }
    except Exception as e:
        return {"node_count": 0, "edge_count": 0, "top_entities": [], "status": "error", "detail": str(e)}

class QueryRequest(BaseModel):
    text: str
    user_id: str = "default_user"

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
    user_id: str

@router.post("/consolidate", response_model=IngestResponse)
async def process_consolidation(request: ConsolidateRequest):
    try:
        chunks, msg = consolidate_memory(request.user_id)
        # Assuming consolidate_memory returns chunks > 0 if there was memory
        if chunks > 0:
            history = get_recent_messages(request.user_id, exchanges=50)
            doc = "\n".join([f"{m['role']}: {m['content']}" for m in history])
            triples = extract_and_store_knowledge(doc)
            msg += f" Extracted {triples} graph relations."
            
        return IngestResponse(
            message=msg,
            chunks=chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sleep")
async def process_sleep_cycle():
    """Trigger one full Sleep Cycle — summarize, store, and prune."""
    try:
        report = run_sleep_cycle(keep_recent=10)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest", response_model=IngestResponse)
async def process_ingest(request: IngestRequest):
    try:
        num_chunks = ingest_text(request.text, request.metadata)
        triples = extract_and_store_knowledge(request.text)
        return IngestResponse(
            message=f"Sensory data ingested. Extracted {triples} graph relations.",
            chunks=num_chunks
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query/stream")
async def process_query_stream(request: QueryRequest):
    """
    Stream the cognitive process and finally the response as Server-Sent Events.
    """
    async def event_generator():
        try:
            # Step 1: Initial State
            history = get_recent_messages(request.user_id, exchanges=5)
            state_input = {
                "input": request.text,
                "chat_history": history,
                "context": [],
                "graph_context": [],
                "reflection": "",
                "response": ""
            }

            # Send Initial Perception Trace
            perception_msg = f"Processing query: {request.text[:50]}..."
            yield f"event: trace\ndata: {json.dumps({'phase': 'perception', 'message': perception_msg})}\n\n"
            await asyncio.sleep(0.1)

            # Step 2: Stream LangGraph Execution
            # orchestrator.stream is a sync iterator, so we use it in a thread or just run it if it's fast enough
            # For simplicity in this demo, we use the stream directly
            for output in orchestrator.stream(state_input):
                for node_name, node_output in output.items():
                    if node_name == "reflect":
                        # Send Internal Reflection Trace
                        reflection = node_output.get("reflection", "")
                        yield f"event: reflection\ndata: {json.dumps({'message': reflection})}\n\n"
                        await asyncio.sleep(0.3)  # Give user time to read the 'thought'
                    
                    elif node_name == "retrieve":
                        # Send Recall & Association Trace
                        trace_data = node_output.get("trace_data", {})
                        recall_msg = f"Found {trace_data.get('sensory_count')} sensory memories."
                        assoc_msg = f"Extracted {trace_data.get('graph_count')} graph relations."
                        
                        yield f"event: trace\ndata: {json.dumps({'phase': 'recall', 'message': recall_msg, 'data': node_output.get('context')})}\n\n"
                        await asyncio.sleep(0.2)
                        yield f"event: trace\ndata: {json.dumps({'phase': 'association', 'message': assoc_msg, 'data': node_output.get('graph_context')})}\n\n"
                        await asyncio.sleep(0.2)
                    
                    elif node_name == "call_model":
                        # Send Reasoning & Final Trace
                        reason_msg = "Synthesizing final response via Cortex Node..."
                        yield f"event: trace\ndata: {json.dumps({'phase': 'reasoning', 'message': reason_msg})}\n\n"
                        await asyncio.sleep(0.1)
                        
                        final_response = node_output.get("response", "")
                        # Save to Working Memory
                        add_message(request.user_id, "user", request.text)
                        add_message(request.user_id, "assistant", final_response)
                        
                        yield f"event: final_result\ndata: {json.dumps({'response': final_response})}\n\n"

        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    try:
        # Step 3: Working Memory - Load the last 5 exchanges
        history = get_recent_messages(request.user_id, exchanges=5)
        
        # Step 2: Sensory Memory Logic - invoke the retrieval-augmented graph
        state_input = {
            "input": request.text,
            "chat_history": history,
            "context": [],
            "graph_context": [],
            "response": ""
        }
        
        # Run the graph
        result = orchestrator.invoke(state_input)
        final_response = result.get("response", "No response generated.")
        
        # Step 3 (cont): Save the new exchange to Working Memory
        add_message(request.user_id, "user", request.text)
        add_message(request.user_id, "assistant", final_response)
        
        return QueryResponse(
            response=final_response,
            sources=["Step 2: Sensory Memory (ChromaDB)", "Step 3: Working Memory (SQLite)"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
