import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { cohortTransactionalCheckinMagicHref } from '@/lib/cohortEmailMagicLink'
import {
  cohortEmailCheckInCtaHtml,
  wrapCohortTransactionalEmailHtml,
} from '@/lib/cohortTransactionalEmailHtml'
import { sendEmail } from '@/lib/email/resend'

export type ShippingNurtureStep = 'day4' | 'day7' | 'day10'

export function shippingNurtureSubject(step: ShippingNurtureStep): string {
  switch (step) {
    case 'day4':
      return "Your product is on its way — here's what to expect"
    case 'day7':
      return 'Your product should be arriving any day now'
    case 'day10':
      return 'Quick check — did your product arrive?'
    default:
      return 'Study update — BioStackr'
  }
}

/** Inner HTML only (no document wrapper). */
export function shippingNurtureInnerHtml(
  step: ShippingNurtureStep,
  _params: {
    studyName: string
    brandName: string
    productName: string
    sleepShapedCohort?: boolean
  },
): string {
  let paragraphs: string[] = []
  switch (step) {
    case 'day4':
      paragraphs = [
        'Your product will be dispatched to you shortly. While you wait, keep doing your daily check-in each morning — these baseline check-ins are an important part of your personal results and count toward your final analysis.',
      ]
      break
    case 'day7':
      paragraphs = [
        "Your product should be arriving any day now. The moment it lands, open your BioStackr dashboard and tap 'My product has arrived' — your 21-day study begins that same morning. Keep checking in daily until it arrives.",
      ]
      break
    case 'day10':
      paragraphs = [
        "Just making sure everything landed okay. If your product has arrived and you have not started your study yet, open your dashboard and tap 'My product has arrived' to get going. If it has not arrived yet, just reply to this email and we will look into it straight away.",
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
  params: {
    studyName: string
    brandName: string
    productName: string
    sleepShapedCohort?: boolean
    cohortSlug?: string | null
    /** Production sends use Supabase magic link from `cohortTransactionalCheckinMagicHref`. */
    checkInHref: string
  },
): string {
  const appBase = cohortEmailPublicOrigin()
  const checkInHref = String(params.checkInHref || '').trim()
  const inner = shippingNurtureInnerHtml(step, params) + cohortEmailCheckInCtaHtml(checkInHref)
  return wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: params.brandName,
    cohortSlug: params.cohortSlug,
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
  sleepShapedCohort?: boolean
  cohortSlug?: string | null
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const subject = shippingNurtureSubject(params.step)
  const appBase = cohortEmailPublicOrigin()
  const { href: checkInHref } = await cohortTransactionalCheckinMagicHref(to, `shipping-nurture-${params.step}`)
  const inner =
    shippingNurtureInnerHtml(params.step, {
      studyName: params.studyName,
      brandName: params.brandName,
      productName: params.productName,
      sleepShapedCohort: params.sleepShapedCohort,
    }) + cohortEmailCheckInCtaHtml(checkInHref)
  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: params.brandName,
    cohortSlug: params.cohortSlug,
    innerHtml: inner,
    dashboardHref: checkInHref,
    omitDashboardRow: true,
  })
  return sendEmail({ to, subject, html })
}
