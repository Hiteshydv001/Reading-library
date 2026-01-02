"""
Script to set up Telegram webhook for the bot
Run this after deploying your backend to receive Telegram messages
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

def set_webhook(webhook_url: str):
    """
    Set the webhook URL for your Telegram bot
    
    Args:
        webhook_url: Your backend webhook URL (e.g., https://your-domain.com/webhooks/telegram)
    """
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook"
    
    data = {
        "url": webhook_url,
        "max_connections": 40,
        "allowed_updates": ["message"]
    }
    
    print(f"Setting webhook to: {webhook_url}")
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            print("✅ Webhook set successfully!")
            print(f"Response: {result}")
        else:
            print(f"❌ Failed to set webhook: {result}")
    else:
        print(f"❌ HTTP Error {response.status_code}: {response.text}")

def get_webhook_info():
    """Get current webhook information"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo"
    
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            info = result.get("result", {})
            print("\n📋 Current Webhook Info:")
            print(f"   URL: {info.get('url', 'Not set')}")
            print(f"   Pending updates: {info.get('pending_update_count', 0)}")
            if info.get('last_error_message'):
                print(f"   ⚠️  Last error: {info.get('last_error_message')}")
                print(f"   Last error date: {info.get('last_error_date')}")
        else:
            print(f"❌ Failed to get webhook info: {result}")
    else:
        print(f"❌ HTTP Error {response.status_code}: {response.text}")

def delete_webhook():
    """Delete the webhook (useful for local testing)"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook"
    
    response = requests.post(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get("ok"):
            print("✅ Webhook deleted successfully!")
        else:
            print(f"❌ Failed to delete webhook: {result}")
    else:
        print(f"❌ HTTP Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    print("🤖 Telegram Webhook Setup Tool\n")
    
    if not TELEGRAM_BOT_TOKEN:
        print("❌ TELEGRAM_BOT_TOKEN not found in .env file")
        exit(1)
    
    print("Choose an option:")
    print("1. Set webhook (production - requires public HTTPS URL)")
    print("2. Delete webhook (for local testing)")
    print("3. Get webhook info")
    
    choice = input("\nEnter choice (1/2/3): ").strip()
    
    if choice == "1":
        webhook_url = input("Enter your webhook URL (e.g., https://your-domain.com/webhooks/telegram): ").strip()
        set_webhook(webhook_url)
        get_webhook_info()
    elif choice == "2":
        confirm = input("Are you sure you want to delete the webhook? (yes/no): ").strip().lower()
        if confirm == "yes":
            delete_webhook()
            get_webhook_info()
    elif choice == "3":
        get_webhook_info()
    else:
        print("Invalid choice")
