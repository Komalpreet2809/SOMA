from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, field_validator
import re

from app.auth.auth import hash_password, verify_password, create_token, get_current_user
from app.db.session import create_user, get_user, clear_user_messages
from app.db.chroma import clear_user_vectors
from app.db.neo4j_driver import clear_user_graph

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not 3 <= len(v) <= 30:
            raise ValueError("Username must be 3–30 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


def _reset_user_memory(username: str):
    """Wipe all prior data so every session starts with a clean slate."""
    clear_user_messages(username)
    clear_user_vectors(username)
    clear_user_graph(username)


@router.post("/register", response_model=TokenResponse)
async def register(req: AuthRequest):
    hashed = hash_password(req.password)
    created = create_user(req.username, hashed)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )
    _reset_user_memory(req.username)
    token = create_token(req.username)
    return TokenResponse(access_token=token, username=req.username)


@router.post("/login", response_model=TokenResponse)
async def login(req: AuthRequest):
    row = get_user(req.username)
    if not row or not verify_password(req.password, row[1]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    _reset_user_memory(req.username)
    token = create_token(req.username)
    return TokenResponse(access_token=token, username=req.username)


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
