# Email Notifications Setup Guide

## 📧 Overview
One daily email with ALL articles scheduled for today.
Sent once per day at your preferred time (e.g., 5 AM IST).

Uses **external cron job** to save Render free tier hours.

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

## 3️⃣ Setup Cron Job (cron-job.org)

1. Go to https://cron-job.org
2. Create cron job:
   - URL: `https://reading-library.onrender.com/api/email/send/daily`
   - Schedule: `30 23 * * *` (5:00 AM IST daily)
   - Method: POST

## 4️⃣ Test

```bash
curl -X POST https://reading-library.onrender.com/api/email/send/daily
```

**Benefits:** Only 1 API call/day, server sleeps rest of the time, one email with all readings.
