import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortEmailCheckInCtaHtml } from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export function buildCohortGateReminderEmailHtml(): { subject: string; html: string } {
  const checkInHref = cohortEmailCheckInLandingAbsoluteUrl()
  const cta = cohortEmailCheckInCtaHtml(checkInHref)
  const subject = 'Your study spot is still reserved'
  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>You are one step away from confirming your place.</p>
<p>Open your cohort dashboard and complete your first check-in.</p>
${cta}
</body></html>`
  return { subject, html }
}

export async function sendCohortGateReminderEmail(to: string) {
  const safe = String(to || '').trim()
  if (!safe) return { success: false as const, error: 'no email' }
  const { subject, html } = buildCohortGateReminderEmailHtml()
  return sendEmail({
    to: safe,
    subject,
    html,
  })
}
