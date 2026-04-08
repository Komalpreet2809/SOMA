import random
import asyncio
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from app.db.neo4j_driver import neo4j_db
from app.db.session import add_spark
from app.core.config import settings

async def idle_brain_cycle():
    """
    Background loop that generates spontaneous neural sparks.
    Runs every 60 seconds if the system is idle.
    """
    print("Neural Spark System: Online.")
    while True:
        try:
            await asyncio.sleep(60) # Dream every minute
            await generate_neural_spark()
        except Exception as e:
            print(f"Neural Spark Error: {e}")
            await asyncio.sleep(10)

async def generate_neural_spark():
    """Pick 2 random nodes and find a connection."""
    if not neo4j_db.driver:
        return
        
    # 1. Fetch 2 random entities belonging to the SAME random user
    cypher = """
    MATCH (n:Entity)
    WITH COLLECT(DISTINCT n.user_id) AS users
    WITH users[toInteger(rand() * size(users))] AS selected_user
    MATCH (e:Entity {user_id: selected_user})
    RETURN e.name AS name, selected_user AS user_id
    ORDER BY rand() LIMIT 2
    """
    results = neo4j_db.query(cypher)
    
    if len(results) < 2:
        return
        
    entities = [res["name"] for res in results]
    user_id = results[0]["user_id"]
    
    # 2. Ask LLM for an insight
    api_key = settings.GROQ_API_KEY if settings.GROQ_API_KEY else "dummy_key"
    llm = ChatGroq(model="llama-3.1-8b-instant", api_key=api_key)
    
    prompt = f"""
    You are the subconscious of Soma, a cognitive AI.
    You are dreaming about two connected concepts in your neural mesh: {entities[0]} and {entities[1]}.
    
    Spontaneously generate a brief 'Neural Spark'—a potential connection, observation, or insight 
    linking these two entities. Keep it cryptic, creative, and under 20 words.
    
    NEURAL SPARK:"""
    
    try:
        response = await asyncio.to_thread(llm.invoke, [HumanMessage(content=prompt)])
        content = response.content.strip()
        
        # 3. Save to DB
        add_spark(content, entities, user_id=user_id)
        print(f"Neural Spark Generated for {user_id}: {entities[0]} <-> {entities[1]}")
    except Exception as e:
        print(f"Failed to generate spark: {e}")
