"""
Test script to simulate Telegram webhook locally
This helps verify your webhook endpoint works before setting up the actual Telegram webhook
"""
import requests
import json

# Your local backend URL
BACKEND_URL = "http://localhost:8000/webhooks/telegram"

# Sample Telegram message with a URL
sample_message = {
    "update_id": 123456789,
    "message": {
        "message_id": 1,
        "from": {
            "id": 123456,
            "is_bot": False,
            "first_name": "Test",
            "username": "testuser"
        },
        "chat": {
            "id": -1001234567890,
            "title": "Test Group",
            "type": "supergroup"
        },
        "date": 1672531200,
        "text": "Check out this article: https://example.com/article"
    }
}

print("🧪 Testing Telegram webhook locally...\n")
print(f"Sending test message to: {BACKEND_URL}")
print(f"Message: {sample_message['message']['text']}\n")

try:
    response = requests.post(BACKEND_URL, json=sample_message)
    print(f"✅ Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Webhook endpoint is working!")
        print("Now you can set up the actual Telegram webhook.")
    else:
        print(f"\n❌ Error: {response.text}")
except Exception as e:
    print(f"❌ Error connecting to backend: {e}")
    print("Make sure your backend is running on http://localhost:8000")
