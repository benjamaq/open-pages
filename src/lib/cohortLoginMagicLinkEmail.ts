import { generateCohortDashboardMagicLinkUrl } from '@/lib/cohortEmailMagicLink'
import {
  COHORT_EMAIL_CTA_LINK_ATTRS,
  COHORT_EMAIL_MAGIC_LINK_HINT,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

const SUBJECT = 'Your login link for the SureSleep study'

/** Rust CTA + hint line for cohort login magic-link emails (distinct label from generic dashboard CTA). */
export function cohortEmailLoginMagicLinkCtaHtml(loginHref: string): string {
  const href = escapeHtml(loginHref)
  return (
    '<p style="margin:28px 0 0;text-align:center;">' +
    '<a href="' +
    href +
    '"' +
    COHORT_EMAIL_CTA_LINK_ATTRS +
    ' style="display:inline-block;background:#C84B2F;color:#ffffff !important;font-weight:600;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:16px;">Log in to your dashboard →</a>' +
    '</p>' +
    '<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">' +
    escapeHtml(COHORT_EMAIL_MAGIC_LINK_HINT) +
    '</p>'
  )
}

export async function sendCohortParticipantLoginMagicLinkEmail(
  to: string,
  magicHref: string,
): Promise<{ success: boolean; error?: string }> {
  const safe = String(to || '').trim()
  if (!safe) return { success: false, error: 'no email' }
  const href = String(magicHref || '').trim()
  if (!href) return { success: false, error: 'no link' }

  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')

  const innerHtml =
    '<p style="margin:0 0 16px;">Hi,</p>' +
    '<p style="margin:0 0 16px;">Here is a fresh link to your study dashboard. If an older email link expired or opened in a preview window, use this one instead.</p>' +
    cohortEmailLoginMagicLinkCtaHtml(href)

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml,
    dashboardHref: href,
    omitDashboardRow: true,
  })

  return sendEmail({ to: safe, subject: SUBJECT, html })
}

/**
 * Resolves a new magic link for a cohort participant and sends the transactional email.
 * `authCanonicalEmail` must match auth.users.email (case) for generateLink.
 * Returns null on success; an error message only for unexpected send failures.
 */
export async function sendFreshCohortLoginMagicLinkForParticipantEmail(
  authCanonicalEmail: string,
): Promise<string | null> {
  const em = String(authCanonicalEmail || '').trim()
  if (!em) return 'Invalid email'

  const magic = await generateCohortDashboardMagicLinkUrl(em)
  if (!magic) {
    console.error('[cohortLoginMagicLink] generateCohortDashboardMagicLinkUrl failed', {
      domain: em.includes('@') ? em.split('@')[1] : '(none)',
    })
    return 'Could not create login link'
  }

  const r = await sendCohortParticipantLoginMagicLinkEmail(em, magic)
  if (!r.success) {
    console.error('[cohortLoginMagicLink] sendEmail', r.error)
    return r.error || 'Send failed'
  }
  return null
}
