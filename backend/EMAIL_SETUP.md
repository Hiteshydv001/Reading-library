# Email Notifications Setup Guide

## 📧 Overview
Three daily emails with ALL articles scheduled for today:
- **🌅 5:00 AM IST** - Morning digest
- **☀️ 12:00 PM IST** - Noon digest
- **🌆 5:00 PM IST** - Evening digest

Uses **external cron jobs** to save Render free tier hours.

## 1️⃣ Configure Gmail

1. Enable 2FA on Gmail
2. Create App Password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password

## 2️⃣ Set Environment Variables in Render

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
RECIPIENT_EMAIL=your-email@gmail.com
```

## 3️⃣ Setup Cron Jobs (cron-job.org)

1. Go to https://cron-job.org (free account)
2. Create 3 cron jobs:

**Morning Digest (5:00 AM IST = 11:30 PM UTC previous day)**
- URL: `https://reading-library.onrender.com/api/email/send/morning`
- Schedule: `30 23 * * *`
- Method: POST

**Noon Digest (12:00 PM IST = 6:30 AM UTC)**
- URL: `https://reading-library.onrender.com/api/email/send/noon`
- Schedule: `30 6 * * *`
- Method: POST

**Evening Digest (5:00 PM IST = 11:30 AM UTC)**
- URL: `https://reading-library.onrender.com/api/email/send/evening`
- Schedule: `30 11 * * *`
- Method: POST

## 4️⃣ Test

```bash
curl -X POST https://reading-library.onrender.com/api/email/send/morning
```

**Benefits:** Only 3 API calls/day, server sleeps rest of the time, get reminders throughout the day.
