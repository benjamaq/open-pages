import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'

/**
 * Optional `/check-in` landing (e.g. env override). Cohort transactional CTAs that need auth use
 * `cohortTransactionalCheckinMagicHref` / `cohortTransactionalDashboardMagicHref` (hashed_token →
 * `/auth/callback`) so the first click establishes a session; this URL remains for legacy or manual flows.
 */
export function cohortEmailCheckInLandingAbsoluteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_COHORT_CHECKIN_LANDING_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const base = cohortEmailPublicOrigin()
  return `${base}/check-in`
}
