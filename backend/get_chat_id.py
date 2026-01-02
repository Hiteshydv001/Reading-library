"""
Helper script to get your Telegram Chat ID
Run this after sending a message to your bot
"""
import requests
import os
from dotenv import load_dotenv
import json

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    print("❌ TELEGRAM_BOT_TOKEN not found in .env file")
    exit(1)

print("🤖 Getting your Telegram Chat ID...\n")
print("Steps:")
print("1. Open Telegram and search for your bot")
print(f"2. Send any message to the bot (e.g., /start or 'Hello')")
print("3. Press Enter here to fetch your chat ID\n")

input("Press Enter after you've sent a message to your bot...")

try:
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        if not data.get("ok"):
            print(f"❌ Error: {data}")
            exit(1)
        
        updates = data.get("result", [])
        
        if not updates:
            print("❌ No messages found. Please send a message to your bot first.")
            exit(1)
        
        print("\n✅ Found chat IDs:\n")
        
        # Display all unique chat IDs
        chat_ids = set()
        for update in updates:
            message = update.get("message", {})
            chat = message.get("chat", {})
            chat_id = chat.get("id")
            chat_type = chat.get("type", "")
            chat_title = chat.get("title", "")
            first_name = chat.get("first_name", "")
            username = chat.get("username", "")
            
            if chat_id and chat_id not in chat_ids:
                chat_ids.add(chat_id)
                
                if chat_type == "private":
                    print(f"👤 Personal Chat")
                    print(f"   Chat ID: {chat_id}")
                    print(f"   Name: {first_name}")
                    if username:
                        print(f"   Username: @{username}")
                elif chat_type in ["group", "supergroup"]:
                    print(f"👥 Group Chat")
                    print(f"   Chat ID: {chat_id}")
                    print(f"   Name: {chat_title}")
                
                print()
        
        print("\n📝 To enable notifications:")
        print(f"1. Copy your desired Chat ID")
        print(f"2. Add it to your .env file:")
        print(f"   NOTIFICATION_CHAT_ID=<your_chat_id>")
        print(f"3. Restart your backend server")
        print(f"\n💡 Use your personal chat ID for private notifications")
        print(f"💡 Use group chat ID to notify everyone in the group")
        
    else:
        print(f"❌ HTTP Error {response.status_code}: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
