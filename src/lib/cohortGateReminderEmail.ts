import {
  cohortDashboardDirectAbsoluteUrl,
  cohortTransactionalCheckinMagicHref,
} from '@/lib/cohortEmailMagicLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  cohortEmailCheckInCtaHtml,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export type CohortGateReminderEmailMeta = {
  partnerBrandName: string
  productName?: string | null
}

export function buildCohortGateReminderEmailHtml(params: {
  /** Production uses Supabase magic link from `cohortTransactionalCheckinMagicHref`. */
  checkInHref: string
  partnerBrandName: string
  productName?: string | null
}): { subject: string; html: string } {
  const checkInHref = String(params.checkInHref || '').trim()
  const partner = String(params.partnerBrandName || '').trim() || 'Study partner'
  const product = String(params.productName || '').trim()

  const subject = 'Your study spot is still reserved'
  const productSentence =
    product !== ''
      ? ` Your enrollment for the <strong>${escapeHtml(product)}</strong> study is still held.`
      : ''

  const cta = cohortEmailCheckInCtaHtml(checkInHref, 'Start your first check-in →')

  const innerHtml =
    `<p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#C84B2F;">Almost there</p>` +
    `<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#1a1a1a;font-weight:700;">Your study spot is still reserved</h1>` +
    `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#374151;">You&apos;re one step away from confirming your place.${productSentence}</p>` +
    `<p style="margin:0 0 6px;font-size:15px;line-height:1.65;color:#374151;">Tap below to open your check-in — it takes about a minute. Completing it locks in your spot for the 48-hour confirmation window.</p>` +
    cta

  const html = wrapCohortTransactionalEmailHtml({
    appBase: cohortEmailPublicOrigin(),
    partnerBrandName: partner,
    innerHtml,
    dashboardHref: cohortDashboardDirectAbsoluteUrl(),
    omitDashboardRow: false,
  })

  return { subject, html }
}

export async function sendCohortGateReminderEmail(
  to: string,
  meta: CohortGateReminderEmailMeta,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const safe = String(to || '').trim()
  if (!safe) return { success: false, error: 'no email' }
  const partnerBrandName = String(meta.partnerBrandName || '').trim() || 'Study partner'
  const { href: checkInHref } = await cohortTransactionalCheckinMagicHref(safe, 'gate-reminder')
  const { subject, html } = buildCohortGateReminderEmailHtml({
    checkInHref,
    partnerBrandName,
    productName: meta.productName,
  })
  return sendEmail({
    to: safe,
    subject,
    html,
  })
}
