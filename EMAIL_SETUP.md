# Email Setup for Contact Form

## Current Configuration
- **Forwarding Email**: `ben09@mac.com`
- **Contact Form**: `/contact`
- **API Endpoint**: `/api/contact`

## How to Receive Messages

### Option 1: Resend (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to your `.env.local`:
   ```
   RESEND_API_KEY=your_api_key_here
   ```
4. Uncomment the email code in `/src/lib/email.ts`

### Option 2: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get your API key
3. Add to your `.env.local`:
   ```
   SENDGRID_API_KEY=your_api_key_here
   ```
4. Update the email code in `/src/lib/email.ts`

### Option 3: Nodemailer with SMTP
1. Add SMTP credentials to `.env.local`:
   ```
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASS=your_password
   ```
2. Update the email code in `/src/lib/email.ts`

## Current Status
- ✅ Contact form working
- ✅ Messages logged to console
- ✅ Database table ready (optional)
- ⏳ Email forwarding needs setup

## Test the Contact Form
1. Go to `/contact`
2. Fill out the form
3. Check console logs for the message
4. Once email is configured, messages will be sent to `ben09@mac.com`

## Database Table (Optional)
Run this SQL in your Supabase dashboard:
```sql
-- See database/contact-submissions-schema.sql
```
