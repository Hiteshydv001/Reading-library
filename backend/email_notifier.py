"""
Email notification system for scheduled readings
Sends one daily email with all readings scheduled for today
Call via external cron service (cron-job.org) once per day
"""
import os
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from database import collection

logger = logging.getLogger(__name__)

# Email configuration from environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
RECIPIENT_EMAIL = os.getenv("RECIPIENT_EMAIL")

# IST timezone offset (UTC+5:30)
IST_OFFSET = timedelta(hours=5, minutes=30)

async def send_email(subject: str, body: str, html_body: str = None):
    """Send an email notification"""
    if not all([SMTP_USER, SMTP_PASSWORD, RECIPIENT_EMAIL]):
        logger.warning("Email credentials not configured. Skipping email notification.")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = SMTP_USER
        message["To"] = RECIPIENT_EMAIL
        message["Subject"] = subject
        
        # Add plain text version
        text_part = MIMEText(body, "plain")
        message.attach(text_part)
        
        # Add HTML version if provided
        if html_body:
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
        
        # Send email
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        
        logger.info(f"📧 Email sent successfully to {RECIPIENT_EMAIL}: {subject}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email: {e}")
        return False

def get_ist_time():
    """Get current time in IST"""
    return datetime.utcnow() + IST_OFFSET

async def get_todays_readings():
    """Get all scheduled readings for today (IST date)"""
    ist_now = get_ist_time()
    ist_date = ist_now.date()
    
    # Convert to UTC range for database query
    start_of_day_utc = datetime.combine(ist_date, datetime.min.time()) - IST_OFFSET
    end_of_day_utc = datetime.combine(ist_date, datetime.max.time()) - IST_OFFSET
    
    readings = await collection.find({
        "scheduled_at": {
            "$gte": start_of_day_utc,
            "$lte": end_of_day_utc
        }
    }).to_list(length=None)
    
    return readings

def create_reading_digest_html(readings: list, time_of_day: str):
    """Create HTML email body for reading digest"""
    ist_now = get_ist_time()
    
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                       color: white; padding: 20px; border-radius: 10px; text-align: center; }}
            .reading-card {{ background: #f8f9fa; border-left: 4px solid #667eea; 
                            padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .time {{ color: #667eea; font-weight: bold; font-size: 14px; }}
            .title {{ font-size: 18px; font-weight: bold; margin: 5px 0; }}
            .description {{ color: #666; margin: 10px 0; }}
            .url {{ color: #764ba2; text-decoration: none; font-weight: bold; }}
            .footer {{ margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; 
                      text-align: center; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📚 Your Reading Schedule for Today</h1>
            <p>{ist_now.strftime("%A, %B %d, %Y")}</p>
        </div>
        
        <div style="padding: 20px;">
            <p>Hello! 👋</p>
            <p><strong>You have {len(readings)} article(s) scheduled to read today:</strong></p>
            
            {"".join([f'''
            <div class="reading-card">
                <div class="time">🕐 Scheduled: {(datetime.fromisoformat(str(r['scheduled_at'])) + IST_OFFSET).strftime("%I:%M %p IST")}</div>
                <div class="title">{r['title']}</div>
                <div class="description">{r.get('description', '')[:300] if r.get('description') else 'No description available'}...</div>
                <a href="{r['url']}" class="url">📖 Read Now →</a>
            </div>
            ''' for r in readings])}
            
            <p style="margin-top: 30px; padding: 15px; background: #f0f7ff; border-radius: 5px;">
                <strong>📅 Total readings for today: {len(readings)}</strong><br>
                <span style="color: #666; font-size: 14px;">Plan your day and complete these readings!</span>
            </p>
        </div>
        
        <div class="footer">
            <p>🎯 Stay focused • 📚 Keep reading • 🚀 Keep growing</p>
            <p>Reading Library - Your personal knowledge curator</p>
        </div>
    </body>
    </html>
    """
    return html

def create_reading_digest_text(readings: list, time_of_day: str):
    """Create plain text email body for reading digest"""
    ist_now = get_ist_time()
    
    text = f"""
📚 Your Reading Schedule for Today
{ist_now.strftime("%A, %B %d, %Y")}
{'=' * 50}

Hello! 👋

You have {len(readings)} article(s) scheduled to read today:

"""
    
    for idx, r in enumerate(readings, 1):
        scheduled_time = datetime.fromisoformat(str(r['scheduled_at'])) + IST_OFFSET
        text += f"""
{idx}. 🕐 {scheduled_time.strftime("%I:%M %p IST")}
   📖 {r['title']}
   {r.get('description', 'No description available')[:300]}...
   🔗 {r['url']}
{'-' * 50}
"""
    
    text += f"""
📅 Total readings for today: {len(readings)}
Plan your day and complete these readings!

🎯 Stay focused • 📚 Keep reading • 🚀 Keep growing
Reading Library - Your personal knowledge curator
"""
    return text

async def send_daily_digest(time_of_day: str):
    """Send daily reading digest with all readings scheduled for today"""
    if not all([SMTP_USER, SMTP_PASSWORD, RECIPIENT_EMAIL]):
        logger.warning("Email credentials not configured")
        return {"status": "error", "message": "Email not configured"}
    
    try:
        readings = await get_todays_readings()
        
        if not readings:
            logger.info(f"📧 No readings scheduled for today")
            return {"status": "success", "message": "No readings scheduled", "count": 0}
        
        ist_now = get_ist_time()
        subject = f"📚 Today's Reading Plan - {len(readings)} Articles ({ist_now.strftime('%b %d, %Y')})"
        
        text_body = create_reading_digest_text(readings, time_of_day)
        html_body = create_reading_digest_html(readings, time_of_day)
        
        success = await send_email(subject, text_body, html_body)
        
        if success:
            logger.info(f"✅ Daily digest sent successfully with {len(readings)} readings")
            return {"status": "success", "message": f"Email sent with {len(readings)} readings", "count": len(readings)}
        else:
            return {"status": "error", "message": "Failed to send email", "count": len(readings)}
        
    except Exception as e:
        logger.error(f"❌ Failed to send daily digest: {e}")
        return {"status": "error", "message": str(e)}

def is_email_configured():
    """Check if email credentials are configured"""
    return all([SMTP_USER, SMTP_PASSWORD, RECIPIENT_EMAIL])
