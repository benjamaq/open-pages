import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import { cohortEmailCheckInCtaHtml } from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export function buildCohortGateReminderEmailHtml(params: {
  /** Production uses Supabase magic link from `cohortTransactionalCheckinMagicHref`. */
  checkInHref: string
}): { subject: string; html: string } {
  const checkInHref = String(params.checkInHref || '').trim()
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
  const { href: checkInHref } = await cohortTransactionalCheckinMagicHref(safe, 'gate-reminder')
  const { subject, html } = buildCohortGateReminderEmailHtml({ checkInHref })
  return sendEmail({
    to: safe,
    subject,
    html,
  })
}
