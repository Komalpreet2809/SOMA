import redis
from app.core.config import settings
import logging
import time

logger = logging.getLogger("soma.analytics")

class AnalyticsManager:
    def __init__(self):
        self._client = None
        self._connected = False
        self._last_attempt = 0.0
        self._cooldown = 30.0  # seconds to wait before trying to reconnect if offline

    def get_client(self):
        # Return existing connection if still healthy
        if self._client is not None:
            try:
                self._client.ping()
                self._connected = True
                return self._client
            except Exception:
                logger.warning("Redis connection lost, re-establishing...")
                self._client = None
                self._connected = False

        # If we failed to connect recently, don't block the request; return None (fallback) fast.
        now = time.time()
        if now - self._last_attempt < self._cooldown:
            return None

        self._last_attempt = now

        # 1. Try REDIS_URL first (Upstash URL format)
        if settings.REDIS_URL:
            try:
                print(f"Analytics: Connecting to Upstash Redis...")
                # Note: socket_timeout/socket_connect_timeout are small to prevent FastAPI from hanging
                self._client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_timeout=3.0,
                    socket_connect_timeout=3.0,
                    retry_on_timeout=False
                )
                self._client.ping()
                self._connected = True
                print("Analytics: Connected to Upstash Redis successfully!")
                return self._client
            except Exception as e:
                print(f"Analytics: Failed to connect to Upstash via REDIS_URL: {e}")
                self._client = None
                self._connected = False
 
        # 2. Try default REDIS_HOST / REDIS_PORT (Local fallback)
        if settings.REDIS_HOST:
            try:
                print(f"Analytics: Connecting to local Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}...")
                self._client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    decode_responses=True,
                    socket_timeout=2.0,
                    socket_connect_timeout=2.0,
                    retry_on_timeout=False
                )
                self._client.ping()
                self._connected = True
                print("Analytics: Connected to local Redis successfully!")
                return self._client
            except Exception as e:
                print(f"Analytics: Failed to connect to local Redis: {e}")
                self._client = None
                self._connected = False

        return None

    def record_hit(self, visitor_id: str) -> bool:
        """
        Record a visit hit.
        Increments the total visits count and adds the visitor_id to the unique set.
        Optimized for Upstash Free Tier limits by being called exactly once per session.
        """
        client = self.get_client()
        if client is None:
            print("Analytics: Redis is offline, skipping hit.")
            return False

        try:
            # 1. Increment total visits
            client.incr("soma:analytics:total_visits")
            
            # 2. Add visitor_id to unique visitors set
            client.sadd("soma:analytics:unique_visitors", visitor_id)
            return True
        except Exception as e:
            print(f"Analytics: Failed to record hit in Redis: {e}")
            return False

    def get_stats(self) -> dict:
        """
        Retrieve stats (total visitors, unique visitors) from Redis.
        Returns mock/offline status if Redis connection fails, ensuring zero crashes.
        """
        client = self.get_client()
        if client is None or not self._connected:
            return {
                "total_visitors": 0,
                "unique_visitors": 0,
                "status": "offline"
            }

        try:
            # Fetch total visits
            total_val = client.get("soma:analytics:total_visits")
            total = int(total_val) if total_val else 0

            # Fetch cardinality of unique set
            unique = client.scard("soma:analytics:unique_visitors") or 0

            return {
                "total_visitors": total,
                "unique_visitors": unique,
                "status": "online"
            }
        except Exception as e:
            print(f"Analytics: Failed to query stats: {e}")
            return {
                "total_visitors": 0,
                "unique_visitors": 0,
                "status": "error",
                "detail": str(e)
            }

analytics_manager = AnalyticsManager()
