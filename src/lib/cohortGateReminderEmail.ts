import { sendEmail } from '@/lib/email/resend'

export async function sendCohortGateReminderEmail(to: string) {
  const safe = String(to || '').trim()
  if (!safe) return { success: false as const, error: 'no email' }
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
  return sendEmail({
    to: safe,
    subject: 'Your study spot is still reserved',
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>You are one step away from confirming your place.</p>
<p>Complete your first check-in here:</p>
<p><a href="${appBase}/dashboard?checkin=1" style="color:#C84B2F;font-weight:600;">Open dashboard</a></p>
</body></html>`,
  })
}
