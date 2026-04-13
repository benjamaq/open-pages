import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import {
  cohortTransactionalCheckinMagicHref,
  cohortTransactionalDashboardMagicHref,
} from '@/lib/cohortEmailMagicLink'
import {
  cohortEmailCheckInCtaHtml,
  cohortEmailDashboardCtaHtml,
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
    /** True when 3 post-confirmation baseline days are done — copy + CTA target dashboard, not daily check-in. */
    postBaselineWait?: boolean
  },
): string {
  const post = _params.postBaselineWait === true
  let paragraphs: string[] = []
  switch (step) {
    case 'day4':
      paragraphs = post
        ? [
            'Your baseline is complete. Your product is on the way. Once it arrives, start checking in again so we can measure what changes.',
          ]
        : [
            'Your product will be dispatched to you shortly. While you wait, keep doing your daily check-in each morning — these baseline check-ins are an important part of your personal results and count toward your final analysis.',
          ]
      break
    case 'day7':
      paragraphs = post
        ? [
            "Your product should be arriving any day now. The moment it lands, open your BioStackr dashboard and tap 'My product has arrived' — your 21-day study begins that same morning. We will pick up daily check-ins once you have started.",
          ]
        : [
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
    postBaselineWait?: boolean
    /** Production sends use Supabase magic link from `cohortTransactionalCheckinMagicHref`. */
    checkInHref: string
    /** When `postBaselineWait`, dashboard magic URL for CTA (preview may use direct dashboard URL). */
    dashboardHref?: string
  },
): string {
  const appBase = cohortEmailPublicOrigin()
  const checkInHref = String(params.checkInHref || '').trim()
  const post = params.postBaselineWait === true
  const dashHref = String(params.dashboardHref || '').trim() || checkInHref
  const ctaHtml = post
    ? cohortEmailDashboardCtaHtml(dashHref, 'View your dashboard →')
    : cohortEmailCheckInCtaHtml(checkInHref)
  const inner = shippingNurtureInnerHtml(step, params) + ctaHtml
  return wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: params.brandName,
    cohortSlug: params.cohortSlug,
    innerHtml: inner,
    dashboardHref: post ? dashHref : checkInHref,
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
  postBaselineWait?: boolean
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const to = String(params.to || '').trim()
  if (!to) return { success: false, error: 'missing email' }
  const subject = shippingNurtureSubject(params.step)
  const appBase = cohortEmailPublicOrigin()
  const post = params.postBaselineWait === true
  const [{ href: checkInHref }, dashHref] = await Promise.all([
    cohortTransactionalCheckinMagicHref(to, `shipping-nurture-${params.step}`),
    cohortTransactionalDashboardMagicHref(to, `shipping-nurture-${params.step}`),
  ])
  const primaryHref = post ? dashHref : checkInHref
  const ctaHtml = post
    ? cohortEmailDashboardCtaHtml(dashHref, 'View your dashboard →')
    : cohortEmailCheckInCtaHtml(checkInHref)
  const inner =
    shippingNurtureInnerHtml(params.step, {
      studyName: params.studyName,
      brandName: params.brandName,
      productName: params.productName,
      sleepShapedCohort: params.sleepShapedCohort,
      postBaselineWait: post,
    }) + ctaHtml
  const html = wrapCohortTransactionalEmailHtml({
    appBase,
    partnerBrandName: params.brandName,
    cohortSlug: params.cohortSlug,
    innerHtml: inner,
    dashboardHref: primaryHref,
    omitDashboardRow: true,
  })
  return sendEmail({ to, subject, html })
}
