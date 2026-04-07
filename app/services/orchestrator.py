from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.services.memory import retrieve_context
from app.services.neocortex import retrieve_graph_context

class AgentState(TypedDict):
    input: str
    chat_history: List[dict]
    context: List[str]
    graph_context: List[str]
    response: str

def retrieve(state: AgentState):
    # Phase 1: Perception (Implicit in state["input"])
    
    # Phase 2: Recall (Sensory Memory)
    context = retrieve_context(state["input"])
    
    # Phase 3: Association (Semantic Memory)
    graph_context = retrieve_graph_context(state["input"])
    
    return {
        "context": context, 
        "graph_context": graph_context,
        "trace_data": {
            "sensory_count": len(context),
            "graph_count": len(graph_context),
            "query": state["input"]
        }
    }

def call_model(state: AgentState):
    # Initialize the LLM
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=api_key
    )
    
    # Format the chat history into a string
    history_lines = []
    for msg in state["chat_history"]:
        prefix = "User" if msg["role"] == "user" else "Soma"
        history_lines.append(f"{prefix}: {msg['content']}")
    history_str = "\n".join(history_lines) if history_lines else "No previous conversation."

    # Construct prompt with context & history
    context_str = "\n\n".join(state["context"])
    graph_str = "\n".join(state["graph_context"]) if state["graph_context"] else "No related knowledge graph entities found."
    
    prompt = f"""You are Soma, a brain-inspired AI.
Use the following memories to answer the user's question.
If the memory doesn't help, use your general knowledge.

WORKING MEMORY (Recent Conversation):
{history_str}

SEMANTIC MEMORY (Knowledge Graph):
{graph_str}

SENSORY MEMORY (Retrieved Facts):
{context_str}

USER QUESTION:
{state["input"]}"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        response_text = response.content
    except Exception as e:
        response_text = f"LLM Connection Error: {str(e)}"
        
    return {"response": response_text}

def create_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("call_model", call_model)
    
    # Set entry point
    workflow.set_entry_point("retrieve")
    
    # Add edges
    workflow.add_edge("retrieve", "call_model")
    workflow.add_edge("call_model", END)
    
    return workflow.compile()

orchestrator = create_graph()
