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
from app.services.brain_trace import build_brain_event, predict_intent, route_signal, score_attention

router = APIRouter()


def sse_event(event_type: str, payload: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"



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
        WHERE n.user_id = $user_id
        OPTIONAL MATCH (n)-[r]-()
        RETURN n.name AS id, count(r) AS connections
        ORDER BY connections DESC
        """
        node_results = neo4j_db.query(node_query, {"user_id": current_user}) or []

        edge_query = """
        MATCH (s:Entity)-[r]->(t:Entity)
        WHERE (s.user_id = $user_id )
          AND (t.user_id = $user_id )
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
        WHERE n.user_id = $user_id
        OPTIONAL MATCH (n)-[r]->()
        RETURN count(DISTINCT n) AS nodes, count(DISTINCT r) AS edges
        """
        counts = neo4j_db.query(count_query, {"user_id": current_user})
        node_count = counts[0]["nodes"] if counts else 0
        edge_count = counts[0]["edges"] if counts else 0

        top_query = """
        MATCH (n:Entity)-[r]-()
        WHERE n.user_id = $user_id
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
            user_msgs = [m['content'] for m in history if m['role'] == 'user']
            doc = "\n".join(user_msgs)
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

@router.post("/analyze")
async def analyze_text(request: QueryRequest, current_user: str = Depends(get_current_user)):
    """
    Analyzes text to preview potential semantic links and cognitive metrics.
    Checks existing graph to find potential overlaps.
    """
    try:
        from langchain_groq import ChatGroq
        from langchain_core.messages import HumanMessage
        from app.core.config import settings
        
        api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
        llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
        
        # 1. Extract potential entities
        prompt = f"Extract 5-8 key entities (names, concepts, places) from this text as a comma-separated list. Return ONLY the list: {request.text}"
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        entities = [e.strip() for e in response.content.split(',') if e.strip()]
        
        # 2. Check for existing overlaps in Neo4j
        existing_links = []
        if neo4j_db.driver:
            # Look for entities that already exist for this user
            check_query = """
            MATCH (n:Entity)
            WHERE n.user_id = $user_id AND toLower(n.name) IN $entities
            RETURN n.name AS name, count{(n)--()} AS connections
            """
            overlaps = neo4j_db.query(check_query, {
                "user_id": current_user, 
                "entities": [e.lower() for e in entities]
            }) or []
            existing_links = [{"name": o["name"], "connections": o["connections"]} for o in overlaps]

        # 3. Calculate metrics
        char_count = len(request.text)
        chunk_count = (char_count // 500) + 1
        
        return {
            "entities": entities,
            "existing_links": existing_links,
            "metrics": {
                "density": min(char_count / 2000, 1.0),
                "chunks": chunk_count,
                "estimated_links": len(entities) * 1.5,
                "reinforcement_index": len(existing_links) / max(len(entities), 1)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/stream")
async def process_query_stream(request: QueryRequest, current_user: str = Depends(get_current_user)):
    async def event_generator():
        try:
            history = get_recent_messages(current_user, exchanges=5)
            attention = score_attention(request.text, len(history))
            routing = route_signal(request.text, attention)
            prediction = predict_intent(request.text, attention)
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
            yield sse_event("brain_trace", build_brain_event(
                "perception",
                58,
                "Raw language input reached the sensory intake layer.",
                next_regions=["thalamus"],
                inputs_used=["user_input"],
                data={"query": request.text}
            ))
            yield sse_event("trace", {"phase": "perception", "message": perception_msg, "data": {"query": request.text}})
            await asyncio.sleep(0.4)

            yield sse_event("brain_trace", build_brain_event(
                "attention",
                attention["salience"],
                "Attention scoring estimated urgency, emotion, memory relevance, complexity, and novelty.",
                next_regions=["thalamus", "prefrontal_cortex"],
                inputs_used=["user_input", "recent_history"],
                data=attention
            ))
            yield sse_event("trace", {
                "phase": "attention",
                "message": f"Attention salience computed at {attention['salience']}%.",
                "data": attention
            })
            await asyncio.sleep(0.4)

            if attention["emotional_intensity"] >= 70:
                yield sse_event("brain_trace", build_brain_event(
                    "emotion",
                    attention["emotional_intensity"],
                    f"Detected elevated emotional salience associated with {attention['emotion_label']}.",
                    next_regions=["hippocampus", "prefrontal_cortex"],
                    inputs_used=["user_input"],
                    data={"emotion": attention["emotion_label"]}
                ))
                yield sse_event("trace", {
                    "phase": "emotion",
                    "message": f"Amygdala analogue flagged {attention['emotion_label']} salience.",
                    "data": {"emotion": attention["emotion_label"]}
                })
                await asyncio.sleep(0.4)

            yield sse_event("brain_trace", build_brain_event(
                "routing",
                66,
                routing["reason"],
                next_regions=routing["regions"],
                inputs_used=["attention_scores", "user_input"],
                data={"regions": routing["regions"]}
            ))
            yield sse_event("trace", {
                "phase": "routing",
                "message": f"Routed cognition through {', '.join(routing['regions'])}.",
                "data": {"regions": routing["regions"]}
            })
            await asyncio.sleep(0.4)

            yield sse_event("brain_trace", build_brain_event(
                "prediction",
                prediction["confidence"],
                f"Predicted intent: {prediction['intent']}",
                next_regions=["working_memory", "prefrontal_cortex"],
                inputs_used=["user_input", "attention_scores"],
                data=prediction
            ))
            yield sse_event("trace", {
                "phase": "prediction",
                "message": prediction["intent"],
                "data": prediction
            })
            await asyncio.sleep(0.4)

            yield sse_event("brain_trace", build_brain_event(
                "working_memory",
                52 + min(len(history) * 4, 24),
                f"Loaded {len(history)} recent messages into working memory.",
                next_regions=["hippocampus", "prefrontal_cortex"],
                inputs_used=["recent_history"],
                data={"history_count": len(history)}
            ))
            yield sse_event("trace", {
                "phase": "working_memory",
                "message": f"Loaded {len(history)} recent messages into working memory.",
                "data": {"history_count": len(history)}
            })
            await asyncio.sleep(0.4)

            for output in orchestrator.stream(state_input):
                for node_name, node_output in output.items():
                    if node_name == "reflect":
                        reflection = node_output.get("reflection", "")
                        yield sse_event("reflection", {"message": reflection})
                        yield sse_event("brain_trace", build_brain_event(
                            "reflection",
                            76,
                            "Prefrontal planning layer formed an internal intent map.",
                            next_regions=["hippocampus", "neocortex"],
                            inputs_used=["user_input", "working_memory"],
                            data={"reflection": reflection}
                        ))
                        yield sse_event("trace", {"phase": "reflection", "message": "Intent map formed.", "data": {"reflection": reflection}})
                        await asyncio.sleep(0.4)

                    elif node_name == "retrieve":
                        trace_data = node_output.get("trace_data", {})
                        recall_msg = f"Found {trace_data.get('sensory_count')} sensory memories."
                        assoc_msg = f"Extracted {trace_data.get('graph_count')} graph relations."
                        yield sse_event("brain_trace", build_brain_event(
                            "recall",
                            72,
                            f"Hippocampal recall recovered {trace_data.get('sensory_count', 0)} sensory memories.",
                            next_regions=["neocortex", "prefrontal_cortex"],
                            inputs_used=["vector_memory", "working_memory"],
                            data={
                                "memories": node_output.get("context"),
                                "count": trace_data.get("sensory_count", 0),
                            }
                        ))
                        yield sse_event("trace", {"phase": "recall", "message": recall_msg, "data": node_output.get("context")})
                        await asyncio.sleep(0.4)

                        suppressed_sensory = trace_data.get("suppressed_sensory", 0)
                        suppressed_graph = trace_data.get("suppressed_graph", 0)
                        yield sse_event("brain_trace", build_brain_event(
                            "inhibition",
                            61,
                            f"Suppressed {suppressed_sensory} weak sensory recalls and {suppressed_graph} weak graph associations.",
                            next_regions=["neocortex", "prefrontal_cortex"],
                            inputs_used=["retrieved_memories", "graph_candidates"],
                            data={
                                "suppressed_sensory": suppressed_sensory,
                                "suppressed_graph": suppressed_graph,
                            }
                        ))
                        yield sse_event("trace", {
                            "phase": "inhibition",
                            "message": f"Suppressed {suppressed_sensory + suppressed_graph} low-salience recalls.",
                            "data": {
                                "suppressed_sensory": suppressed_sensory,
                                "suppressed_graph": suppressed_graph,
                            }
                        })
                        await asyncio.sleep(0.4)

                        yield sse_event("brain_trace", build_brain_event(
                            "association",
                            74,
                            f"Neocortical association found {trace_data.get('graph_count', 0)} semantic links.",
                            next_regions=["prefrontal_cortex", "language_cortex"],
                            inputs_used=["graph_memory", "retrieved_memories"],
                            data={
                                "graph_context": node_output.get("graph_context"),
                                "touched": trace_data.get("touched"),
                            }
                        ))
                        yield sse_event("trace", {"phase": "association", "message": assoc_msg, "data": node_output.get("graph_context"), "touched": trace_data.get("touched")})
                        await asyncio.sleep(0.4)

                    elif node_name == "call_model":
                        reason_msg = "Synthesizing final response via Cortex Node..."
                        yield sse_event("brain_trace", build_brain_event(
                            "reasoning",
                            82,
                            "Prefrontal reasoning integrated memory, associations, and user intent into a response plan.",
                            next_regions=["language_cortex"],
                            inputs_used=["working_memory", "retrieved_memories", "graph_memory", "reflection"],
                            data={"prediction": prediction["intent"]}
                        ))
                        yield sse_event("trace", {"phase": "reasoning", "message": reason_msg})
                        await asyncio.sleep(0.4)

                        final_response = node_output.get("response", "")
                        add_message(current_user, "user", request.text)
                        add_message(current_user, "assistant", final_response)

                        yield sse_event("brain_trace", build_brain_event(
                            "language",
                            88,
                            "Language generation layer converted the response plan into natural language.",
                            next_regions=["memory_consolidation"],
                            inputs_used=["response_plan"],
                            data={"response_preview": final_response[:120]}
                        ))
                        yield sse_event("trace", {"phase": "language", "message": "Generating natural language output."})
                        yield sse_event("final_result", {"response": final_response})

                        # Build neural mesh AFTER streaming the response so
                        # the user sees the reply immediately, then the graph
                        # refreshes once knowledge extraction finishes.
                        exchange_text = f"User: {request.text}\nSoma: {final_response}"
                        try:
                            yield sse_event("brain_trace", build_brain_event(
                                "memory",
                                68,
                                "The completed exchange is being written into episodic and sensory memory.",
                                next_regions=["neocortex"],
                                inputs_used=["conversation_exchange"],
                            ))
                            yield sse_event("trace", {
                                "phase": "memory",
                                "message": "Writing this exchange into episodic and sensory memory."
                            })
                            stored_chunks = await asyncio.to_thread(
                                ingest_text,
                                exchange_text,
                                {"type": "chat_exchange"},
                                current_user
                            )
                            yield sse_event("trace", {
                                "phase": "memory",
                                "message": f"Stored {stored_chunks} sensory chunks from this exchange.",
                                "data": {"chunks": stored_chunks}
                            })

                            yield sse_event("trace", {
                                "phase": "graph",
                                "message": "Extracting relationships for semantic memory."
                            })
                            triples = await asyncio.to_thread(extract_and_store_knowledge, request.text, current_user)
                            yield sse_event("brain_trace", build_brain_event(
                                "graph",
                                71,
                                f"Semantic cortex encoded {triples} new graph relations from the exchange.",
                                next_regions=[],
                                inputs_used=["conversation_exchange", "semantic_extraction"],
                                data={"triples": triples, "chunks": stored_chunks}
                            ))
                            yield sse_event("trace", {
                                "phase": "graph",
                                "message": f"Updated the knowledge graph with {triples} new relations.",
                                "data": {"triples": triples}
                            })
                            yield sse_event("graph_updated", {"triples": triples, "chunks": stored_chunks})
                        except Exception as e:
                            print(f"Memory build error: {e}")
                            yield sse_event("trace", {
                                "phase": "graph",
                                "message": f"Memory writeback degraded: {str(e)}"
                            })
                            yield sse_event("graph_updated", {"triples": 0, "chunks": 0})

        except Exception as e:
            yield sse_event("error", {"detail": str(e)})

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Memory Explorer ─────────────────────────────────────────────

@router.get("/memory/search")
async def process_memory_search(q: str, current_user: str = Depends(get_current_user)):
    try:
        from app.db.chroma import search_memories
        results = search_memories(q, current_user)
        
        memories = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            ids = results["ids"][0]
            metadatas = results["metadatas"][0] if results["metadatas"] else []
            distances = results["distances"][0] if results["distances"] else []
            
            for i in range(len(docs)):
                memories.append({
                    "id": ids[i],
                    "content": docs[i],
                    "metadata": metadatas[i] if i < len(metadatas) else {},
                    "similarity": round(1 - distances[i], 2) if i < len(distances) else 0
                })
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memory/sensory")
async def get_sensory_memories(current_user: str = Depends(get_current_user)):
    try:
        from app.db.chroma import get_collection
        collection = get_collection()
        results = collection.get(where={"user_id": current_user})
        
        memories = []
        if results and "documents" in results:
            for i in range(len(results["documents"])):
                memories.append({
                    "id": results["ids"][i],
                    "content": results["documents"][i],
                    "metadata": results["metadatas"][i] if results["metadatas"] else {}
                })
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/memory/{memory_id}")
async def purge_memory_chunk(memory_id: str, current_user: str = Depends(get_current_user)):
    try:
        from app.db.chroma import delete_vector
        success = delete_vector(memory_id, current_user)
        if not success:
            raise HTTPException(status_code=404, detail="Memory chunk not found or unauthorized.")
        return {"message": "Memory chunk purged successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── History ───────────────────────────────────────────────────────

@router.get("/history")
async def fetch_chat_history(current_user: str = Depends(get_current_user)):
    try:
        history = get_recent_messages(current_user, exchanges=20)
        return {"messages": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Visitor Analytics ─────────────────────────────────────────────

class HitRequest(BaseModel):
    visitor_id: str

@router.post("/analytics/hit")
async def record_visitor_hit(request: HitRequest, current_user: str = Depends(get_current_user)):
    try:
        from app.services.analytics import analytics_manager
        success = analytics_manager.record_hit(request.visitor_id)
        return {"success": success, "message": "Hit recorded successfully" if success else "Hit recorded in local simulation fallback."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/stats")
async def get_visitor_stats(current_user: str = Depends(get_current_user)):
    try:
        from app.services.analytics import analytics_manager
        stats = analytics_manager.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
