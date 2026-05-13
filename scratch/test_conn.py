import socket

host = "d65ff6c7.databases.neo4j.io"
port = 7687

try:
    print(f"Resolving {host}...")
    ip = socket.gethostbyname(host)
    print(f"Resolved to {ip}")
    
    print(f"Connecting to {host}:{port}...")
    with socket.create_connection((host, port), timeout=5) as sock:
        print("Successfully connected!")
except Exception as e:
    print(f"Failed: {e}")
