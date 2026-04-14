from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, field_validator
import re

from app.auth.auth import hash_password, create_token, get_current_user
from app.db.session import create_user, get_user, clear_user_messages
from app.db.chroma import clear_user_vectors
from app.db.neo4j_driver import clear_user_graph

router = APIRouter(prefix="/auth", tags=["auth"])


_DEFAULT_PASSWORD = "soma_default_pass"


class AuthRequest(BaseModel):
    username: str
    password: str = _DEFAULT_PASSWORD

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not 3 <= len(v) <= 30:
            raise ValueError("Username must be 3–30 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v.lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


def _reset_user_memory(username: str):
    """Wipe all prior data so every session starts with a clean slate."""
    clear_user_messages(username)
    clear_user_vectors(username)
    clear_user_graph(username)


@router.post("/enter", response_model=TokenResponse)
async def enter(req: AuthRequest):
    """Single entry point: auto-creates account if new, logs in if existing (name only)."""
    row = get_user(req.username)
    if not row:
        # New user — auto-register with default password
        hashed = hash_password(_DEFAULT_PASSWORD)
        created = create_user(req.username, hashed)
        if not created:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Could not create account"
            )
    _reset_user_memory(req.username)
    token = create_token(req.username)
    return TokenResponse(access_token=token, username=req.username)


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
