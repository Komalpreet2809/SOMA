from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, field_validator
import re

from app.auth.auth import hash_password, verify_password, create_token, get_current_user
from app.db.session import create_user, get_user

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
        return v

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


@router.post("/register", response_model=TokenResponse)
async def register(req: AuthRequest):
    hashed = hash_password(req.password)
    created = create_user(req.username, hashed)
    if not created:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )
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
    token = create_token(req.username)
    return TokenResponse(access_token=token, username=req.username)


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {"username": current_user}
