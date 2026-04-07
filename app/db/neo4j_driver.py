from neo4j import GraphDatabase
from app.core.config import settings

class Neo4jConnection:
    def __init__(self):
        self.uri = settings.NEO4J_URI
        self.user = settings.NEO4J_USER
        self.pwd = settings.NEO4J_PASSWORD
        self.database = settings.NEO4J_DATABASE
        self.driver = None
        
        if self.uri and self.user and self.pwd:
            try:
                self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.pwd))
                print(f"Neo4j driver created for {self.uri}")
            except Exception as e:
                print(f"Failed to create Neo4j driver: {e}")
        else:
            print("Neo4j credentials not found in environment.")

    def close(self):
        if self.driver:
            self.driver.close()

    def query(self, query, parameters=None):
        if not self.driver:
            return None
        with self.driver.session(database=self.database) as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

neo4j_db = Neo4jConnection()
