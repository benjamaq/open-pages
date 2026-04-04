import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'

/**
 * Stable cohort email CTA — links never expire. Users land here; logged-out users request a fresh
 * magic link via POST /api/cohort/request-login-link. The email link uses `next=/dashboard?view=cohort`
 * (see generateCohortEmailMagicLinkUrl + cohortDashboardStudyPath).
 */
export function cohortEmailCheckInLandingAbsoluteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_COHORT_CHECKIN_LANDING_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const base = cohortEmailPublicOrigin()
  return `${base}/check-in`
}
