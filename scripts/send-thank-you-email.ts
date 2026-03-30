#!/usr/bin/env npx tsx
/**
 * Send a personal thank you email to a new signup.
 * Usage: npx tsx scripts/send-thank-you-email.ts [email]
 * Default: nburtonnz@gmail.com
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { sendEmail } from '../src/lib/email/resend'

config({ path: resolve(process.cwd(), '.env.local') })

const USER_EMAIL = process.argv[2] || 'nburtonnz@gmail.com'
const REPLY_TO = process.env.REPLY_TO_EMAIL || process.env.SUPPORT_EMAIL || 'ben@biostackr.io'

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to BioStackr</title>
</head>
<body style="margin:0;padding:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#1a1a1a;background:#f5f5f0">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #eee;border-radius:12px;padding:32px;margin-top:24px">
    <div style="font-weight:600;font-size:18px;margin-bottom:8px;">BioStackr</div>
    <p style="margin:0 0 16px 0;">Hi there,</p>
    <p style="margin:0 0 16px 0;">Thanks so much for signing up — we're really glad to have you.</p>
    <p style="margin:0 0 16px 0;">If you have any questions or run into anything while you're getting started, just reply to this email. I read every reply personally.</p>
    <p style="margin:0 0 16px 0;">Best,</p>
    <p style="margin:0;font-weight:600;">Ben</p>
  </div>
</body>
</html>
`

async function main() {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.error('Missing RESEND_API_KEY in .env.local')
    process.exit(1)
  }

  console.log('Sending thank you email to:', USER_EMAIL)
  const result = await sendEmail({
    to: USER_EMAIL,
    subject: 'Welcome to BioStackr — reply anytime',
    html,
    replyTo: REPLY_TO,
  })

  if (result.success) {
    console.log('✅ Email sent successfully. ID:', result.id)
  } else {
    console.error('❌ Failed to send:', result.error)
    process.exit(1)
  }
}

main()
