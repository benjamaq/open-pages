/**
 * Canonical browser origin for cohort transactional email links (magic `/auth/callback`, `/check-in`, image hosts).
 *
 * Outbound email (Resend) must never use `localhost` or another non-public host by accident: inboxes cannot
 * load those images, and CTAs would point at the developer machine.
 *
 * Resolution order:
 * 1. `COHORT_EMAIL_PUBLIC_APP_ORIGIN` — explicit (staging / custom domain).
 * 2. `VERCEL_ENV === 'production'` → `https://www.biostackr.io`
 * 3. `VERCEL_URL` (Vercel preview / `vercel dev`) → `https://<VERCEL_URL>`
 * 4. `COHORT_EMAIL_USE_LOCAL_ORIGIN=1` or `true` → `NEXT_PUBLIC_APP_URL` | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3010`
 * 5. Else (e.g. `next dev` locally) → `https://www.biostackr.io` so real inbox tests use public assets and CTAs.
 */

const PRODUCTION_COHORT_EMAIL_ORIGIN = 'https://www.biostackr.io'

function trimOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '')
}

function vercelPreviewOrigin(): string | null {
  const raw = (process.env.VERCEL_URL || '').trim()
  if (!raw) return null
  const host = raw.replace(/^https?:\/\//i, '').split('/')[0]
  if (!host) return null
  return `https://${host}`
}

function useLocalOriginForEmail(): boolean {
  const v = String(process.env.COHORT_EMAIL_USE_LOCAL_ORIGIN || '').trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function cohortEmailPublicOrigin(): string {
  const explicit = trimOrigin(process.env.COHORT_EMAIL_PUBLIC_APP_ORIGIN || '')
  if (explicit) return explicit

  if (process.env.VERCEL_ENV === 'production') {
    return PRODUCTION_COHORT_EMAIL_ORIGIN
  }

  const preview = vercelPreviewOrigin()
  if (preview) {
    return preview
  }

  if (useLocalOriginForEmail()) {
    const pub = trimOrigin(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '')
    if (pub) return pub
    return 'http://localhost:3010'
  }

  return PRODUCTION_COHORT_EMAIL_ORIGIN
}
