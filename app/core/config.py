from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if it exists
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "Soma"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Working Memory (Redis)
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    
    # Episodic Memory (ChromaDB)
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", os.path.join(os.getcwd(), "data", "chroma_db"))
    
    # Semantic Memory (Neo4j)
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    NEO4J_DATABASE: str = os.getenv("NEO4J_DATABASE", "neo4j")
    
    # SQLite Path
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", os.path.join(os.getcwd(), "data", "soma_sessions.db"))

    # Database — if set, uses Supabase Postgres; otherwise falls back to SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Auth
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-in-production-please")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 30

    model_config = SettingsConfigDict(case_sensitive=True)

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
