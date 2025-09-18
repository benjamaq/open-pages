# Email Notification System Setup Guide

## Overview
The Biostackr app now includes a comprehensive email notification system that sends daily reminders for supplements, protocols, movement, and mindfulness activities.

## Features
- ✅ Daily email reminders with personalized content
- ✅ Customizable reminder times and timezone settings
- ✅ Individual toggles for each content type (supplements, protocols, etc.)
- ✅ Test email functionality
- ✅ Missed items reminders (coming soon)
- ✅ Weekly summary emails (coming soon)
- ✅ Unsubscribe functionality
- ✅ Email delivery tracking

## Setup Instructions

### 1. Database Migration
Run the notifications database schema:
```sql
-- Run this in your Supabase SQL editor
-- File: database/notifications-schema.sql
```

The schema includes:
- `notification_preferences` - User email preferences
- `notification_queue` - Scheduled email queue
- `daily_completions` - Enhanced completion tracking
- `email_log` - Email delivery tracking

### 2. Email Service (Resend)
1. Sign up for a [Resend](https://resend.com) account
2. Get your API key from the Resend dashboard
3. Add to your environment variables:
```env
RESEND_API_KEY=re_your_api_key_here
```

4. Verify your domain in Resend (optional but recommended for production)

### 3. Environment Variables
Add these to your `.env.local`:
```env
# Email service
RESEND_API_KEY=your_resend_api_key

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Cron job security
CRON_SECRET=your_secure_random_token
```

### 4. Scheduled Jobs Setup

#### Option A: Vercel Cron (Recommended for Vercel deployments)
The `vercel.json` file is already configured to run notifications every 5 minutes:
```json
{
  "crons": [
    {
      "path": "/api/notifications/send-daily",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Option B: External Cron Service
Use services like:
- GitHub Actions (free)
- Uptime Robot (free tier available)
- Cronhooks
- EasyCron

Set up a POST request to:
```
POST https://yourdomain.com/api/notifications/send-daily
Authorization: Bearer YOUR_CRON_SECRET
```

### 5. Testing the System

1. **Access Settings**: Go to `/dash/settings` in your app
2. **Configure Preferences**: Set up your notification preferences
3. **Send Test Email**: Use the "Send Test Email" button
4. **Check Email**: Verify you receive the test email

### 6. Email Templates

The system includes beautiful, responsive email templates:
- **Daily Reminders**: Personalized with user's items
- **Missed Items**: Gentle reminders for incomplete items
- **Professional Design**: Mobile-responsive with Biostackr branding

## Usage

### For Users
1. Visit Dashboard → Settings
2. Configure email preferences:
   - Enable/disable email notifications
   - Set reminder time and timezone
   - Choose which content to include
   - Toggle additional options

### For Developers
The system provides these server actions:
- `getNotificationPreferences()` - Get user preferences
- `updateNotificationPreferences()` - Update preferences
- `sendTestEmail()` - Send test email
- `queueDailyReminders()` - Queue reminders (cron job)
- `processNotificationQueue()` - Process queued emails

## API Endpoints

### Daily Reminder Cron
```
POST /api/notifications/send-daily
Authorization: Bearer CRON_SECRET
```

### Health Check
```
GET /api/notifications/send-daily
```

## Database Tables

### notification_preferences
Stores user email preferences and settings.

### notification_queue
Queues scheduled emails for processing.

### daily_completions
Enhanced completion tracking with reminder flags.

### email_log
Tracks all sent emails for monitoring and analytics.

## Customization

### Email Templates
Edit templates in `src/lib/email/resend.ts`:
- `generateDailyReminderHTML()` - Daily reminder template
- `generateMissedItemsHTML()` - Missed items template

### Scheduling
Modify the cron schedule in `vercel.json` or your external cron service.

### Content Filtering
Customize what content appears in emails by modifying the server actions in `src/lib/actions/notifications.ts`.

## Monitoring

### Email Delivery
- All sent emails are logged in the `email_log` table
- Track delivery status and errors
- Monitor bounce rates and failures

### Cron Job Health
- Health check endpoint: `GET /api/notifications/send-daily`
- Monitor cron job execution
- Check for failed email sends

## Security

- **Cron Protection**: API endpoint protected with `CRON_SECRET`
- **RLS Policies**: Database access controlled with Row Level Security
- **Email Validation**: User email addresses validated
- **Unsubscribe**: Easy unsubscribe functionality

## Troubleshooting

### Emails Not Sending
1. Check Resend API key is correct
2. Verify domain is configured in Resend
3. Check cron job is running
4. Review email logs in database

### Wrong Times
1. Verify timezone settings in user preferences
2. Check server timezone configuration
3. Ensure cron runs frequently enough (every 5 minutes recommended)

### Database Errors
1. Ensure migration was run successfully
2. Check RLS policies are enabled
3. Verify Supabase service role key has correct permissions

## Production Checklist

- [ ] Database migration completed
- [ ] Resend account set up and domain verified
- [ ] Environment variables configured
- [ ] Cron job scheduled and running
- [ ] Test emails working
- [ ] Unsubscribe page functional
- [ ] Email delivery monitoring in place

## Support

For issues with the email system:
1. Check the email logs in your database
2. Verify all environment variables are set
3. Test the API endpoints directly
4. Review the Resend dashboard for delivery status

The email notification system is now ready to help users stay consistent with their health routines! 🎉
