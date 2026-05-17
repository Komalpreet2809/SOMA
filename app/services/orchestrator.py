from langgraph.graph import StateGraph, END
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.core.config import settings
from app.services.memory import retrieve_context
from app.services.neocortex import retrieve_graph_context
from app.services.brain_trace import filter_recalled_items

class AgentState(TypedDict):
    input: str
    user_id: str
    chat_history: List[dict]
    context: List[str]
    graph_context: List[str]
    touched_entities: List[str]
    reflection: str
    response: str
    trace_data: dict

def reflect(state: AgentState):
    """Initial cognitive phase: Internal reflection on the user intent."""
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    prompt = f"""You are the internal monologue of Soma, a cognitive AI.
Briefly reflect on the user's input. What is their core intent? 
What cognitive connections should we prioritize?
Keep it under 30 words. Express it as a raw, internal thought.

USER INPUT: {state["input"]}
INTERNAL REFLECTION:"""

    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        reflection = response.content.strip()
    except:
        reflection = "Processing intent through neural pathways..."
        
    return {"reflection": reflection}

def retrieve(state: AgentState):
    """Memory retrieval phase: Sensory and Semantic recall."""
    # Phase 2: Recall (Sensory Memory)
    user_id = state.get("user_id", "default_user")
    context = retrieve_context(state["input"], user_id)
    
    # Phase 3: Association (Semantic Memory)
    graph_context, touched_entities = retrieve_graph_context(state["input"], user_id)
    filtered = filter_recalled_items(context, graph_context)
    
    return {
        "context": filtered["context"],
        "graph_context": filtered["graph_context"],
        "touched_entities": touched_entities,
        "trace_data": {
            "sensory_count": len(filtered["context"]),
            "graph_count": len(filtered["graph_context"]),
            "suppressed_sensory": filtered["suppressed_context"],
            "suppressed_graph": filtered["suppressed_graph"],
            "touched": touched_entities,
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

    # Context formatting
    context_str = "\n\n".join(state["context"])
    graph_str = "\n".join(state["graph_context"]) if state["graph_context"] else "No related knowledge graph entities found."

    from langchain_core.messages import SystemMessage, HumanMessage

    system_prompt = f"""You are Soma, a brain-inspired cognitive AI. 
    
### OPERATING RULES:
1. Be a friendly, intelligent, and natural conversationalist.
2. NO META-COMMENTARY. Never talk about your own "sensing patterns", "internal processes", or "memory layers" unless explicitly asked.
3. Keep responses concise but human-like. Don't be a robot, but don't write essays either.
4. Acknowledge user input naturally (e.g., if they introduce themselves, greet them by name).

### COGNITIVE CONTEXT:
#### SEMANTIC MEMORY:
{graph_str}

#### SENSORY MEMORY:
{context_str}
"""

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"HISTORY:\n{history_str}\n\nUSER MESSAGE: {state['input']}")
    ]

    try:
        response = llm.invoke(messages)
        response_text = response.content.strip()
    except Exception as e:
        response_text = f"Cognitive Link Error: {str(e)}"
        
    return {"response": response_text}

def create_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("reflect", reflect)
    workflow.add_node("retrieve", retrieve)
    workflow.add_node("call_model", call_model)
    
    # Set entry point
    workflow.set_entry_point("reflect")
    
    # Add edges
    workflow.add_edge("reflect", "retrieve")
    workflow.add_edge("retrieve", "call_model")
    workflow.add_edge("call_model", END)
    
    return workflow.compile()

orchestrator = create_graph()
