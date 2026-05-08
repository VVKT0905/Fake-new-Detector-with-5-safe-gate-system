import requests
import json

url = "http://localhost:8000/api/verify"
payload = {"text": "Trái đất được phát hiện ra là hình vuông vào năm 2025 bởi NASA."}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
