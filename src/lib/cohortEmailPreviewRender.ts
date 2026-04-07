import { buildComplianceConfirmedTransactionalEmailHtml } from '@/lib/cohortComplianceConfirmed'
import { studyAndProductNamesFromCohortRow } from '@/lib/cohortStudyProductNames'
import { buildCohortEnrollmentTransactionalEmailHtml } from '@/lib/cohortEnrollmentEmail'
import { cohortEmailCheckInLandingAbsoluteUrl } from '@/lib/cohortCheckInLanding'
import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'
import { buildCohortGateReminderEmailHtml } from '@/lib/cohortGateReminderEmail'
import { buildCohortParticipantLoginMagicLinkTransactionalEmailHtml } from '@/lib/cohortLoginMagicLinkEmail'
import { buildCohortPostFirstCheckinTransactionalEmailHtml } from '@/lib/cohortPostFirstCheckinEmail'
import { buildCohortResultReadyTransactionalEmailHtml } from '@/lib/cohortResultReadyEmail'
import {
  shippingNurtureBodyHtml,
  shippingNurtureSubject,
  type ShippingNurtureStep,
} from '@/lib/cohortShippingNurture'
import { buildCohortStudyCompletionTransactionalEmailHtml } from '@/lib/cohortStudyCompletionEmail'
import { buildCohortStudyStartTransactionalEmailHtml } from '@/lib/cohortStudyStartEmail'
/** All cohort transactional templates exposed for preview / snapshot scripts. */
export const COHORT_EMAIL_PREVIEW_TEMPLATE_IDS = [
  'enrollment',
  'result-ready',
  'study-start',
  'study-completion',
  'compliance-confirmed',
  'post-first-checkin',
  'login-magic-link',
  'shipping-day4',
  'shipping-day7',
  'shipping-day10',
  'gate-reminder',
] as const

export type CohortEmailPreviewTemplateId = (typeof COHORT_EMAIL_PREVIEW_TEMPLATE_IDS)[number]

export type CohortEmailPreviewBranding = {
  partnerBrandName: string
  productName: string
  /** Defaults to "Alex" */
  firstName?: string
  studyDurationDays?: number
  /**
   * `result-ready` only — which BioStackr Pro block to show.
   * - `claim` — external claim URL
   * - `claimed` — Pro already active
   * - `default` — inline instructions only
   */
  resultReadyRewardVariant?: 'claim' | 'default' | 'claimed'
}

function shippingStepFromTemplate(
  t: CohortEmailPreviewTemplateId,
): ShippingNurtureStep | null {
  if (t === 'shipping-day4') return 'day4'
  if (t === 'shipping-day7') return 'day7'
  if (t === 'shipping-day10') return 'day10'
  return null
}

/**
 * Renders the same HTML as production send paths (shared `build*` helpers).
 * Use for dev preview route and `scripts/cohort-email-previews.ts`.
 */
export function renderCohortEmailPreviewHtml(
  template: CohortEmailPreviewTemplateId,
  branding: CohortEmailPreviewBranding,
): { subject: string; html: string } {
  const partnerBrandName = String(branding.partnerBrandName || 'Study partner').trim() || 'Study partner'
  const productName = String(branding.productName || 'product').trim() || 'product'
  const first = String(branding.firstName || 'Alex').trim() || 'Alex'
  const { studyName, productName: prod } = studyAndProductNamesFromCohortRow({
    product_name: productName,
    brand_name: partnerBrandName,
  })

  const appBase = cohortEmailPublicOrigin().replace(/\/$/, '')
  const placeholderMagic = `${appBase}${cohortDashboardStudyPath()}?preview=1`
  const placeholderResult = `${appBase}/dashboard/cohort-result?preview=1`
  const placeholderClaim = `${appBase}/account?preview=claim`

  switch (template) {
    case 'enrollment':
      return buildCohortEnrollmentTransactionalEmailHtml({
        firstName: first,
        productLabel: prod,
        partnerBrandName,
      })
    case 'result-ready': {
      const v = branding.resultReadyRewardVariant || 'default'
      return buildCohortResultReadyTransactionalEmailHtml({
        firstNameForGreeting: first,
        productName: prod,
        partnerBrandName,
        resultHref: placeholderResult,
        rewardClaimAbsoluteUrl: v === 'claim' ? placeholderClaim : '',
        proRewardAlreadyClaimed: v === 'claimed',
      })
    }
    case 'study-start':
      return buildCohortStudyStartTransactionalEmailHtml({
        firstNameForGreeting: first,
        productName: prod,
        partnerBrandName,
        studyDurationDays: branding.studyDurationDays,
      })
    case 'study-completion':
      return buildCohortStudyCompletionTransactionalEmailHtml({
        firstNameForGreeting: first,
        productName: prod,
        partnerBrandName,
      })
    case 'compliance-confirmed':
      return buildComplianceConfirmedTransactionalEmailHtml({
        firstNameForGreeting: first,
        studyName,
        productName: prod,
        brandName: partnerBrandName,
      })
    case 'post-first-checkin': {
      const checkInHref = cohortEmailCheckInLandingAbsoluteUrl()
      return buildCohortPostFirstCheckinTransactionalEmailHtml({
        firstNameForGreeting: first,
        studyName,
        productName: prod,
        partnerBrandName,
        checkInHref,
      })
    }
    case 'login-magic-link':
      return buildCohortParticipantLoginMagicLinkTransactionalEmailHtml({
        partnerBrandName,
        magicHref: placeholderMagic,
      })
    case 'shipping-day4':
    case 'shipping-day7':
    case 'shipping-day10': {
      const step = shippingStepFromTemplate(template)!
      const html = shippingNurtureBodyHtml(step, {
        studyName,
        brandName: partnerBrandName,
        productName: prod,
      })
      return { subject: shippingNurtureSubject(step), html }
    }
    case 'gate-reminder':
      return buildCohortGateReminderEmailHtml()
    default: {
      const _x: never = template
      void _x
      throw new Error('unknown template')
    }
  }
}
