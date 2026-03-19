from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, List
import operator

class AgentState(TypedDict):
    input: str
    chat_history: List[dict]
    context: List[str]
    response: str

def call_model(state: AgentState):
    # Simplified logic for Phase 1
    # Will be expanded with memory layers in later phases
    return {"response": f"Orchestrator processed: {state['input']}"}

def create_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("call_model", call_model)
    
    # Set entry point
    workflow.set_entry_point("call_model")
    
    # Add edges
    workflow.add_edge("call_model", END)
    
    return workflow.compile()

orchestrator = create_graph()
