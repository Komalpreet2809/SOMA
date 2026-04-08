import sqlite3
from app.core.config import settings

DB_PATH = settings.SQLITE_DB_PATH

def init_session_db():
    with sqlite3.connect(DB_PATH) as db:
        db.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                role TEXT,
                content TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        db.execute('''
            CREATE TABLE IF NOT EXISTS neural_sparks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT,
                entities TEXT,
                user_id TEXT DEFAULT 'default_user',
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        # Migration: add user_id to existing databses gracefully
        try:
            db.execute("ALTER TABLE neural_sparks ADD COLUMN user_id TEXT DEFAULT 'default_user'")
        except sqlite3.OperationalError:
            pass
        db.commit()

def add_message(session_id: str, role: str, content: str):
    """Save a single message to the Working Memory."""
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
            (session_id, role, content)
        )
        db.commit()

def get_recent_messages(session_id: str, exchanges: int = 5):
    """
    Retrieve the last N exchanges (user + AI pairs) from Working Memory.
    'exchanges' = 5 means the last 10 messages total.
    """
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.execute(
            'SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
            (session_id, exchanges * 2)
        )
        rows = cursor.fetchall()
    
    # Reverse to put them in chronological order
    rows.reverse()
    return [{"role": r[0], "content": r[1]} for r in rows]

def get_all_session_ids():
    """Return a list of all unique session IDs."""
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.execute('SELECT DISTINCT session_id FROM messages')
        return [row[0] for row in cursor.fetchall()]

def get_message_count(session_id: str):
    """Return total message count for a session."""
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.execute(
            'SELECT COUNT(*) FROM messages WHERE session_id = ?',
            (session_id,)
        )
        return cursor.fetchone()[0]

def prune_old_messages(session_id: str, keep_recent: int = 10):
    """
    Delete old messages, keeping only the most recent N messages.
    This is the 'forgetting' mechanism of the Sleep Cycle.
    """
    with sqlite3.connect(DB_PATH) as db:
        db.execute('''
            DELETE FROM messages WHERE session_id = ? AND id NOT IN (
                SELECT id FROM messages WHERE session_id = ?
                ORDER BY timestamp DESC LIMIT ?
            )
        ''', (session_id, session_id, keep_recent))
        db.commit()
        
        
    return get_message_count(session_id)

def add_spark(content: str, entities: list, user_id: str = "default_user"):
    """Save a spontaneous neural spark."""
    import json
    with sqlite3.connect(DB_PATH) as db:
        db.execute(
            'INSERT INTO neural_sparks (content, entities, user_id) VALUES (?, ?, ?)',
            (content, json.dumps(entities), user_id)
        )
        db.commit()

def get_recent_sparks(user_id: str = "default_user", limit: int = 5):
    """Retrieve the latest neural sparks."""
    import json
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.execute(
            'SELECT content, entities, timestamp FROM neural_sparks WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
            (user_id, limit)
        )
        rows = cursor.fetchall()
    
    return [
        {
            "content": r[0], 
            "entities": json.loads(r[1]), 
            "timestamp": r[2]
        } for r in rows
    ]
