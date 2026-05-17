try:
    import fastapi
    print("fastapi ok")
    import uvicorn
    print("uvicorn ok")
    import langgraph
    print("langgraph ok")
    import langchain
    print("langchain ok")
    import chromadb
    print("chromadb ok")
    import neo4j
    print("neo4j ok")
except ImportError as e:
    print(f"Import failed: {e}")
