from app.db.neo4j_driver import neo4j_db

res = neo4j_db.query("""
MATCH (s)-[r]->(o)
WHERE toLower(s.name) = 'soma' OR toLower(o.name) = 'soma'
RETURN s.name as subject, type(r) as relation, o.name as object
""")
print("SOMA Relations:")
for r in res:
    print(f"  {r['subject']} --[{r['relation']}]--> {r['object']}")
