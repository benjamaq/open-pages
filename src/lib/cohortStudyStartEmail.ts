import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  cohortEmailCheckInCtaHtml,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'
import {
  cohortArrivalDosingEmailTakeLine,
  resolveCohortArrivalDosingKind,
} from '@/lib/cohortArrivalDosing'

export function buildCohortStudyStartTransactionalEmailHtml(params: {
  productName: string
  partnerBrandName: string
  /** Magic or absolute URL — must land on cohort dashboard with check-in deep link. */
  checkinHref: string
  cohortSlug?: string | null
}): { subject: string; html: string } {
  const product = String(params.productName || 'your study product').trim() || 'your study product'
  const productEsc = escapeHtml(product)
  const partnerPlain = String(params.partnerBrandName ?? 'Study partner').trim() || 'Study partner'

  const kind = resolveCohortArrivalDosingKind({
    partnerBrandName: partnerPlain,
    productName: product,
    cohortSlug: params.cohortSlug,
  })
  const takeLine = cohortArrivalDosingEmailTakeLine(kind)
  const takeEsc = escapeHtml(takeLine)

  const subject = 'Your study starts today'

  const appBase = cohortEmailPublicOrigin()
  const checkinHref = String(params.checkinHref || '').trim()

  const innerHtml =
    `<p style="margin:0 0 12px;">Your <strong>${productEsc}</strong> has arrived. Let&rsquo;s get started.</p>` +
    `<p style="margin:0 0 12px;">${takeEsc}, as directed on the label.</p>` +
    `<p style="margin:0 0 12px;">Then complete your first check-in so we can capture how you feel from day one.</p>` +
    cohortEmailCheckInCtaHtml(checkinHref, '👉 Start your first check-in') +
    `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">If anything feels off, follow the product guidance.</p>`

  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: partnerPlain,
    cohortSlug: params.cohortSlug,
    innerHtml,
    dashboardHref: checkinHref,
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

  const { href: checkinHref } = await cohortTransactionalCheckinMagicHref(to, 'study-start')
  const { subject, html } = buildCohortStudyStartTransactionalEmailHtml({
    productName: product,
    partnerBrandName: partnerPlain,
    checkinHref,
    cohortSlug: params.cohortSlug,
  })

  return sendEmail({ to, subject, html })
}
