import sys
import os

# Add the project root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.analytics import AnalyticsManager

def test_analytics_fallback():
    print("Testing AnalyticsManager local fallback/simulation mechanism...")
    
    # Instantiate a clean manager
    manager = AnalyticsManager()
    
    # 1. Assert initial state is not connected
    assert manager._connected is False, "Initially manager should not be marked connected"
    
    # 2. Get client (should try to connect and if REDIS_URL/REDIS_HOST are invalid or offline, fail gracefully returning None)
    client = manager.get_client()
    
    # If client is None, it means fallback to offline/simulation is active
    if client is None:
        print("[Offline Check] No active Redis client found (expected fallback mode).")
        assert manager._connected is False, "State should be marked disconnected"
        
        # Test record_hit in offline state (should return False and print offline skip, but NOT crash)
        success = manager.record_hit("test_visitor_123")
        assert success is False, "Hit record should be False when offline"
        
        # Test get_stats in offline state (should return status offline with 0s)
        stats = manager.get_stats()
        assert stats["status"] == "offline", "Status should be offline"
        assert stats["total_visitors"] == 0
        assert stats["unique_visitors"] == 0
        print("[Offline Check] Fallback works perfectly with zero crashes.")
    else:
        print("[Online Check] Active Redis client found! Testing live operations...")
        assert manager._connected is True, "State should be marked connected"
        
        # We have an active connection, so let's run actual Redis commands
        visitor_id = "test_visitor_789"
        
        # Record hit
        success = manager.record_hit(visitor_id)
        assert success is True, "Hit should be recorded successfully"
        
        # Retrieve stats
        stats = manager.get_stats()
        assert stats["status"] == "online", "Status should be online"
        assert stats["total_visitors"] >= 1, "Total visitors should be incremented"
        assert stats["unique_visitors"] >= 1, "Unique visitors set size should be at least 1"
        print("[Online Check] Real Redis connection and commands work perfectly!")

if __name__ == "__main__":
    try:
        test_analytics_fallback()
        print("\nSUCCESS: All visitor analytics unit/integration tests passed successfully!")
    except AssertionError as e:
        print(f"\nFAILURE: Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nFAILURE: Unexpected error occurred: {e}")
        sys.exit(1)
