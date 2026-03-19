from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class QueryRequest(BaseModel):
    text: str
    user_id: str = "default_user"

class QueryResponse(BaseModel):
    response: str
    sources: List[str] = []

@router.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    # This will eventually call the cognitive orchestrator
    # For now, it's a placeholder for Phase 1 verification
    return QueryResponse(
        response=f"Brain received: {request.text}. Phase 1: Foundation is active.",
        sources=["Phase 1: Foundation"]
    )
