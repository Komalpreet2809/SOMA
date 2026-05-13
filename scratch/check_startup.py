from app.core.config import settings
print("Settings loaded")
from app.db.neo4j_driver import neo4j_db
print("Neo4j driver initialized")
from app.main import app
print("FastAPI app created")
