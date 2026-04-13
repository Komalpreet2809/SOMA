import json
import sqlite3
from contextlib import contextmanager
from app.core.config import settings

# ── Backend detection ─────────────────────────────────────────────
# If DATABASE_URL is set (Supabase/Postgres), try to use psycopg2.
# Otherwise fall back to local SQLite (development).

USE_POSTGRES = bool(settings.DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    from psycopg2 import IntegrityError as DBIntegrityError
else:
    from sqlite3 import IntegrityError as DBIntegrityError
    DB_PATH = settings.SQLITE_DB_PATH


def _test_postgres_connection():
    """Test if Postgres is reachable. If not, fall back to SQLite."""
    if not USE_POSTGRES:
        return True
    try:
        conn = psycopg2.connect(settings.DATABASE_URL, connect_timeout=3)
        conn.close()
        return True
    except Exception:
        return False


# Runtime backend selection (can change after connection test)
_db_backend = "postgres" if USE_POSTGRES else "sqlite"


@contextmanager
def get_conn():
    global _db_backend

    if _db_backend == "postgres":
        conn = psycopg2.connect(settings.DATABASE_URL)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DB_PATH)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def _cursor(conn):
    """Return a dict-style cursor for Postgres, default for SQLite."""
    if _db_backend == "postgres":
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    return conn.cursor()


# ── Schema init ───────────────────────────────────────────────────

def init_session_db():
    global _db_backend

    # Test Postgres connection if configured
    if _db_backend == "postgres" and not _test_postgres_connection():
        print("⚠️  Postgres connection failed. Falling back to SQLite.")
        _db_backend = "sqlite"

    with get_conn() as conn:
        cur = conn.cursor()
        if _db_backend == "postgres":
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp TIMESTAMP DEFAULT NOW()
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS neural_sparks (
                    id SERIAL PRIMARY KEY,
                    content TEXT,
                    entities TEXT,
                    user_id TEXT DEFAULT 'default_user',
                    timestamp TIMESTAMP DEFAULT NOW()
                )
            ''')
        else:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS neural_sparks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT,
                    entities TEXT,
                    user_id TEXT DEFAULT 'default_user',
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            # SQLite migration: add user_id if missing
            try:
                cur.execute("ALTER TABLE neural_sparks ADD COLUMN user_id TEXT DEFAULT 'default_user'")
            except sqlite3.OperationalError:
                pass


# ── User helpers ──────────────────────────────────────────────────

def create_user(username: str, hashed_password: str) -> bool:
    try:
        with get_conn() as conn:
            cur = conn.cursor()
            if _db_backend == "postgres":
                cur.execute(
                    'INSERT INTO users (username, hashed_password) VALUES (%s, %s)',
                    (username, hashed_password)
                )
            else:
                cur.execute(
                    'INSERT INTO users (username, hashed_password) VALUES (?, ?)',
                    (username, hashed_password)
                )
        return True
    except DBIntegrityError:
        return False


def get_user(username: str):
    with get_conn() as conn:
        cur = _cursor(conn)
        if _db_backend == "postgres":
            cur.execute(
                'SELECT username, hashed_password FROM users WHERE LOWER(username) = LOWER(%s)',
                (username,)
            )
            row = cur.fetchone()
            return (row['username'], row['hashed_password']) if row else None
        else:
            cur.execute(
                'SELECT username, hashed_password FROM users WHERE username = ? COLLATE NOCASE',
                (username,)
            )
            return cur.fetchone()


# ── Message helpers ───────────────────────────────────────────────

def add_message(session_id: str, role: str, content: str):
    with get_conn() as conn:
        cur = conn.cursor()
        if _db_backend == "postgres":
            cur.execute(
                'INSERT INTO messages (session_id, role, content) VALUES (%s, %s, %s)',
                (session_id, role, content)
            )
        else:
            cur.execute(
                'INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)',
                (session_id, role, content)
            )


def get_recent_messages(session_id: str, exchanges: int = 5):
    with get_conn() as conn:
        cur = _cursor(conn)
        if _db_backend == "postgres":
            cur.execute(
                'SELECT role, content FROM messages WHERE session_id = %s ORDER BY timestamp DESC LIMIT %s',
                (session_id, exchanges * 2)
            )
        else:
            cur.execute(
                'SELECT role, content FROM messages WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
                (session_id, exchanges * 2)
            )
        rows = cur.fetchall()
    if _db_backend == "postgres":
        rows = [{"role": r['role'], "content": r['content']} for r in reversed(rows)]
    else:
        rows = [{"role": r[0], "content": r[1]} for r in reversed(rows)]
    return rows


def get_all_session_ids():
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute('SELECT DISTINCT session_id FROM messages')
        return [row[0] if _db_backend != "postgres" else row['session_id'] for row in cur.fetchall()]


def get_message_count(session_id: str):
    with get_conn() as conn:
        cur = conn.cursor()
        if _db_backend == "postgres":
            cur.execute(
                'SELECT COUNT(*) FROM messages WHERE session_id = %s',
                (session_id,)
            )
        else:
            cur.execute(
                'SELECT COUNT(*) FROM messages WHERE session_id = ?',
                (session_id,)
            )
        row = cur.fetchone()
        return row[0] if _db_backend != "postgres" else list(row.values())[0]


def prune_old_messages(session_id: str, keep_recent: int = 10):
    with get_conn() as conn:
        cur = conn.cursor()
        if _db_backend == "postgres":
            cur.execute('''
                DELETE FROM messages WHERE session_id = %s AND id NOT IN (
                    SELECT id FROM messages WHERE session_id = %s
                    ORDER BY timestamp DESC LIMIT %s
                )
            ''', (session_id, session_id, keep_recent))
        else:
            cur.execute('''
                DELETE FROM messages WHERE session_id = ? AND id NOT IN (
                    SELECT id FROM messages WHERE session_id = ?
                    ORDER BY timestamp DESC LIMIT ?
                )
            ''', (session_id, session_id, keep_recent))
    return get_message_count(session_id)


# ── Spark helpers ─────────────────────────────────────────────────

def add_spark(content: str, entities: list, user_id: str = "default_user"):
    with get_conn() as conn:
        cur = conn.cursor()
        if _db_backend == "postgres":
            cur.execute(
                'INSERT INTO neural_sparks (content, entities, user_id) VALUES (%s, %s, %s)',
                (content, json.dumps(entities), user_id)
            )
        else:
            cur.execute(
                'INSERT INTO neural_sparks (content, entities, user_id) VALUES (?, ?, ?)',
                (content, json.dumps(entities), user_id)
            )


def get_recent_sparks(user_id: str = "default_user", limit: int = 5):
    with get_conn() as conn:
        cur = _cursor(conn)
        if _db_backend == "postgres":
            cur.execute(
                'SELECT content, entities, timestamp FROM neural_sparks WHERE user_id = %s ORDER BY timestamp DESC LIMIT %s',
                (user_id, limit)
            )
        else:
            cur.execute(
                'SELECT content, entities, timestamp FROM neural_sparks WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
                (user_id, limit)
            )
        rows = cur.fetchall()
    if _db_backend == "postgres":
        return [{"content": r['content'], "entities": json.loads(r['entities']), "timestamp": str(r['timestamp'])} for r in rows]
    return [{"content": r[0], "entities": json.loads(r[1]), "timestamp": r[2]} for r in rows]
