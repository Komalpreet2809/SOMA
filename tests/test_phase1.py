import requests
import json

url = "http://localhost:8000/api/v1/query"
payload = {
    "text": "Hello Soma!",
    "user_id": "test_user"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
