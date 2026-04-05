import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  COHORT_EMAIL_MAGIC_LINK_HINT,
  cohortEmailCheckInCtaHtml,
  escapeHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export type ShippingNurtureStep = 'day4' | 'day7' | 'day10'

export function shippingNurtureSubject(step: ShippingNurtureStep): string {
  switch (step) {
    case 'day4':
      return "Your product is on its way — here's what to expect"
    case 'day7':
      return 'Your study starts soon'
    case 'day10':
      return 'Getting close — are you ready?'
    default:
      return 'DoNotAge × BioStackr — study update'
  }
}

/** Inner HTML only (no document wrapper). */
export function shippingNurtureInnerHtml(
  step: ShippingNurtureStep,
  params: { studyName: string; brandName: string; productName: string },
): string {
  const study = escapeHtml(params.studyName)
  const brand = escapeHtml(params.brandName)
  const product = escapeHtml(params.productName)

  let paragraphs: string[] = []
  switch (step) {
    case 'day4':
      paragraphs = [
        `Your spot in the <strong>${study}</strong> study is confirmed. <strong>${brand}</strong> is dispatching your <strong>${product}</strong>. When it arrives, open your study dashboard on <strong>BioStackr</strong> and tap <strong>My product has arrived</strong>. Your 21 days start that day — complete your first check-in right after. Until then, there is nothing you need to do.`,
      ]
      break
    case 'day7':
      paragraphs = [
        `Your <strong>${product}</strong> from <strong>${brand}</strong> should be arriving any day now. When it arrives, open your study dashboard on <strong>BioStackr</strong> and tap <strong>My product has arrived</strong>, then complete your first check-in. Each check-in takes about 30 seconds; reminders start the morning after you begin. Questions? Reply to this email.`,
      ]
      break
    case 'day10':
      paragraphs = [
        `If your <strong>${product}</strong> has arrived, open your <strong>BioStackr</strong> study dashboard and tap <strong>My product has arrived</strong>, then complete your first check-in. If it has not arrived yet, reply to this email and we will look into it.`,
      ]
      break
    default:
      paragraphs = ['']
  }

  return paragraphs.map((p) => `<p>${p}</p>`).join('')
}

/** Full HTML with shared cohort shell (logos, brand line, footer) — for previews or tooling. */
export function shippingNurtureBodyHtml(
  step: ShippingNurtureStep,
  params: { studyName: string; brandName: string; productName: string },
): string {
  const appBase = cohortEmailPublicOrigin()
  const checkInHref = cohortEmailCheckInLandingAbsoluteUrl()
  const inner =
    shippingNurtureInnerHtml(step, params) +
    cohortEmailCheckInCtaHtml(checkInHref) +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">${escapeHtml(
      COHORT_EMAIL_MAGIC_LINK_HINT,
    )}</p>`
  return wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml: inner,
    dashboardHref: checkInHref,
    omitDashboardRow: true,
  })
}

export async function sendShippingNurtureEmail(params: {
  to: string
  step: ShippingNurtureStep
  studyName: string
  brandName: string
  productName: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const subject = shippingNurtureSubject(params.step)
  const appBase = cohortEmailPublicOrigin()
  const checkInHref = cohortEmailCheckInLandingAbsoluteUrl()
  const inner =
    shippingNurtureInnerHtml(params.step, {
      studyName: params.studyName,
      brandName: params.brandName,
      productName: params.productName,
    }) +
    cohortEmailCheckInCtaHtml(checkInHref) +
    `<p style="margin:12px 0 0;text-align:center;font-size:12px;line-height:1.45;color:#6b7280;">${escapeHtml(
      COHORT_EMAIL_MAGIC_LINK_HINT,
    )}</p>`
  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    innerHtml: inner,
    dashboardHref: checkInHref,
    omitDashboardRow: true,
  })
  return sendEmail({ to, subject, html })
}
