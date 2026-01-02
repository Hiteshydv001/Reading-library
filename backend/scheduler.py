"""
Background scheduler to check for scheduled readings and send notifications
"""
import asyncio
import logging
from datetime import datetime, timedelta
from database import collection
from telegram import Bot
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# The chat ID where you want to receive notifications (your personal chat or group)
NOTIFICATION_CHAT_ID = os.getenv("NOTIFICATION_CHAT_ID")

bot = Bot(token=TELEGRAM_BOT_TOKEN) if TELEGRAM_BOT_TOKEN else None


async def send_telegram_notification(chat_id: str, message: str):
    """Send a notification via Telegram"""
    try:
        if not bot:
            logger.error("Telegram bot not configured")
            return False
        
        await bot.send_message(chat_id=chat_id, text=message, parse_mode="HTML")
        logger.info(f"Notification sent to {chat_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
        return False


async def check_scheduled_readings():
    """Check for readings scheduled and send notifications (1 hour before and at scheduled time)"""
    try:
        now = datetime.utcnow()
        
        # Find all unread scheduled readings
        scheduled_links = await collection.find({
            "scheduled_at": {"$exists": True, "$ne": None},
            "is_read": False
        }).to_list(length=100)
        
        logger.info(f"⏰ Checking {len(scheduled_links)} scheduled readings at {now.strftime('%H:%M:%S UTC')}")
        
        if not scheduled_links:
            return
        
        if not NOTIFICATION_CHAT_ID:
            logger.warning("NOTIFICATION_CHAT_ID not set, skipping notifications")
            return
        
        for link in scheduled_links:
            scheduled_time = link.get("scheduled_at")
            if not scheduled_time:
                continue
            
            # Calculate time difference
            time_until = scheduled_time - now
            minutes_until = time_until.total_seconds() / 60
            
            # Check if we should send a notification
            notification_1hr_sent = link.get("notification_1hr_sent", False)
            notification_now_sent = link.get("notification_now_sent", False)
            
            title = link.get("title", "Untitled")[:50]
            url = link.get("url", "")
            reading_time = link.get("reading_time", 0)
            
            # DEBUG: Log each reading
            logger.info(f"📖 '{title}' - Scheduled: {scheduled_time} UTC, Minutes until: {minutes_until:.1f}, 1hr_sent: {notification_1hr_sent}, now_sent: {notification_now_sent}")
            
            # Send 1-hour before notification (between 55-65 minutes before)
            if 55 <= minutes_until <= 65 and not notification_1hr_sent:
                logger.info(f"⏰ Sending 1-hour reminder for: {title}")
                message = f"""
⏰ <b>Upcoming Reading Reminder!</b>

🔖 <b>{title}</b>

📅 Scheduled in: <b>1 hour</b>
⏱️ Reading time: ~{reading_time} min

🔗 {url}

<i>Get ready! 📚</i>
"""
                success = await send_telegram_notification(NOTIFICATION_CHAT_ID, message)
                if success:
                    await collection.update_one(
                        {"_id": link["_id"]},
                        {"$set": {"notification_1hr_sent": True}}
                    )
                    logger.info(f"1-hour reminder sent for: {title}")
            
            # Send notification at scheduled time (within 2 minutes)
            elif -2 <= minutes_until <= 2 and not notification_now_sent:
                logger.info(f"🚨 Sending NOW reminder for: {title}")
                message = f"""
🚨 <b>Time to Read NOW!</b>

🔖 <b>{title}</b>

⏰ Scheduled: <b>{scheduled_time.strftime('%I:%M %p')}</b>
⏱️ Reading time: ~{reading_time} min

🔗 {url}

<i>Start reading now! 📖🔥</i>
"""
                success = await send_telegram_notification(NOTIFICATION_CHAT_ID, message)
                if success:
                    await collection.update_one(
                        {"_id": link["_id"]},
                        {"$set": {"notification_now_sent": True}}
                    )
                    logger.info(f"NOW reminder sent for: {title}")
        
    except Exception as e:
        logger.error(f"Error checking scheduled readings: {e}")


async def notification_loop():
    """Background loop that checks for scheduled readings every minute"""
    logger.info("🔔 Notification loop started - will check every 60 seconds")
    
    while True:
        try:
            logger.info("🔍 Checking for scheduled readings...")
            await check_scheduled_readings()
            logger.info("✅ Check complete, sleeping for 60 seconds")
            # Wait 1 minute before checking again
            await asyncio.sleep(60)
        except Exception as e:
            logger.error(f"❌ Error in notification loop: {e}")
            await asyncio.sleep(60)


def start_notification_scheduler():
    """Start the notification scheduler in the background"""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, notifications disabled")
        return None
    
    if not NOTIFICATION_CHAT_ID:
        logger.warning("NOTIFICATION_CHAT_ID not set, notifications disabled")
        logger.info("To enable notifications, add your Telegram chat ID to .env")
        return None
    
    logger.info(f"Starting scheduler with CHAT_ID: {NOTIFICATION_CHAT_ID[:3]}...{NOTIFICATION_CHAT_ID[-3:]}")
    
    # Create background task - use asyncio.create_task for better compatibility
    try:
        task = asyncio.create_task(notification_loop())
        logger.info("✅ Notification scheduler started successfully!")
        return task
    except Exception as e:
        logger.error(f"Failed to start notification scheduler: {e}")
        return None
