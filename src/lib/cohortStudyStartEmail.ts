import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalDashboardMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  cohortEmailDashboardCtaHtml,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export function buildCohortStudyStartTransactionalEmailHtml(params: {
  productName: string
  partnerBrandName: string
  /** Magic or absolute URL — production uses Supabase magic link to cohort study dashboard. */
  dashboardHref: string
  cohortSlug?: string | null
}): { subject: string; html: string } {
  const product = String(params.productName || 'your study product').trim() || 'your study product'
  const productEsc = escapeHtml(product)
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'

  const subject = `Your ${product} has arrived`

  const appBase = cohortEmailPublicOrigin()
  const dashboardHref = String(params.dashboardHref || '').trim()

  const innerHtml =
    `<p style="margin:0 0 12px;">Your <strong>${productEsc}</strong> has arrived.</p>` +
    `<p style="margin:0 0 12px;">Start taking it as directed.</p>` +
    `<p style="margin:0 0 12px;">When you&apos;re ready, complete your first check-in so we can capture how you feel from day one.</p>` +
    cohortEmailDashboardCtaHtml(dashboardHref, 'Open your dashboard →') +
    `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">If anything feels off, follow the product guidance.</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerPlain,
    cohortSlug: params.cohortSlug,
    innerHtml,
    dashboardHref,
    omitDashboardRow: true,
  })
  return { subject, html }
}

export async function sendCohortStudyStartEmail(params: {
  to: string
  authUserId: string
  productName: string
  partnerBrandName?: string | null
  cohortSlug?: string | null
  studyDurationDays?: number
  storeCreditPartnerReward?: boolean
  storeCreditTitle?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const authUserId = String(params.authUserId || '').trim()
  if (!authUserId) return { success: false, error: 'missing user' }

  const product = String(params.productName || 'your study product').trim() || 'your study product'
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'

  const dashboardHref = await cohortTransactionalDashboardMagicHref(to, 'study-start')
  const { subject, html } = buildCohortStudyStartTransactionalEmailHtml({
    productName: product,
    partnerBrandName: partnerPlain,
    dashboardHref,
    cohortSlug: params.cohortSlug,
  })

  return sendEmail({ to, subject, html })
}
