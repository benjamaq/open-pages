import { cohortEmailPublicOrigin } from '@/lib/cohortEmailPublicOrigin'

/**
 * Optional `/check-in` landing (e.g. env override). Cohort transactional CTAs use magic links;
 * non-cohort daily reminders resolve here. Active cohort daily reminders use
 * `resolveDailyReminderCheckinHrefForUser` → `/auth/callback?token_hash=…`.
 */
export function cohortEmailCheckInLandingAbsoluteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_COHORT_CHECKIN_LANDING_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const base = cohortEmailPublicOrigin()
  return `${base}/check-in`
}
