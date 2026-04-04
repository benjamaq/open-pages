/**
 * Canonical browser origin for cohort transactional email links (magic /auth/callback, /check-in, image hosts).
 *
 * Server-only callers: email generation must not use a mis-set NEXT_PUBLIC_* URL (e.g. localhost) on Vercel production.
 */

const PRODUCTION_COHORT_EMAIL_ORIGIN = 'https://www.biostackr.io'

/**
 * - Optional `COHORT_EMAIL_PUBLIC_APP_ORIGIN` wins (staging / custom domain).
 * - Vercel production → fixed https://www.biostackr.io (not NEXT_PUBLIC_*).
 * - Else dev / preview → NEXT_PUBLIC_APP_URL | NEXT_PUBLIC_SITE_URL | localhost.
 */
export function cohortEmailPublicOrigin(): string {
  const explicit = (process.env.COHORT_EMAIL_PUBLIC_APP_ORIGIN || '').trim().replace(/\/$/, '')
  if (explicit) return explicit

  if (process.env.VERCEL_ENV === 'production') {
    return PRODUCTION_COHORT_EMAIL_ORIGIN
  }

  const pub = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '')
  if (pub) return pub

  return 'http://localhost:3010'
}
