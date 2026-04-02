import {
  COHORT_DASHBOARD_VIEW_QUERY,
  COHORT_DASHBOARD_VIEW_VALUE,
} from '@/lib/cohortDashboardDeepLink'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Path + query for cohort dashboard (leading slash). Used as `next` after /auth/callback.
 */
function cohortDashboardNextPath(): string {
  return `/dashboard?${COHORT_DASHBOARD_VIEW_QUERY}=${COHORT_DASHBOARD_VIEW_VALUE}`
}

function cohortDashboardCheckinNextPath(): string {
  return `${cohortDashboardNextPath()}&checkin=1`
}

/**
 * Absolute URL for Supabase `generateLink` `redirectTo` (allow-list in Supabase Auth).
 *
 * Must hit `/auth/callback` so `?code=` is exchanged for session cookies. A direct `/dashboard`
 * redirect leaves the code unused → no cookies → `/api/dashboard/load` returns 401 (“Failed to load dashboard”).
 */
export function cohortDashboardRedirectToAbsoluteUrl(): string {
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
  const next = encodeURIComponent(cohortDashboardNextPath())
  return `${appBase}/auth/callback?next=${next}`
}

/** After magic link verify, lands on cohort dashboard with check-in launcher. */
export function cohortDashboardCheckinRedirectToAbsoluteUrl(): string {
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
  const next = encodeURIComponent(cohortDashboardCheckinNextPath())
  return `${appBase}/auth/callback?next=${next}`
}

function appBaseNormalized(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
}

/** Plain dashboard URL when no PKCE code (e.g. magic generation failed — user can sign in). */
export function cohortDashboardDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardNextPath()}`
}

export function cohortDashboardCheckinDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardCheckinNextPath()}`
}

/**
 * Passwordless sign-in link (Supabase Auth magic link). Safe to put in email `href`;
 * opens session on tap and then redirects to the cohort dashboard.
 */
export async function generateCohortEmailMagicLinkUrl(
  email: string,
  redirectTo: string,
): Promise<string | null> {
  const em = String(email || '').trim()
  if (!em) return null
  const to = String(redirectTo || '').trim()
  if (!to) return null
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: em,
      options: { redirectTo: to },
    })
    if (error) {
      console.error('[cohortEmailMagicLink] generateLink:', error.message)
      return null
    }
    const link = data?.properties?.action_link
    return typeof link === 'string' && link.length > 0 ? link : null
  } catch (e) {
    console.error('[cohortEmailMagicLink]', e)
    return null
  }
}

export async function generateCohortDashboardMagicLinkUrl(email: string): Promise<string | null> {
  return generateCohortEmailMagicLinkUrl(email, cohortDashboardRedirectToAbsoluteUrl())
}

/** Prefer magic link; use plain dashboard URL if generation fails (user may need to sign in). */
export async function resolveCohortDashboardEmailHref(email: string): Promise<string> {
  const magic = await generateCohortDashboardMagicLinkUrl(email)
  return magic ?? cohortDashboardDirectAbsoluteUrl()
}

export async function resolveCohortDashboardCheckinEmailHref(email: string): Promise<string> {
  const { href } = await resolveCohortDashboardCheckinEmailHrefWithMeta(email)
  return href
}

/** Check-in deep link for email: magic when `generateLink` succeeds, else plain dashboard URL. */
export async function resolveCohortDashboardCheckinEmailHrefWithMeta(email: string): Promise<{
  href: string
  isMagic: boolean
}> {
  const redirectForMagic = cohortDashboardCheckinRedirectToAbsoluteUrl()
  const magic = await generateCohortEmailMagicLinkUrl(email, redirectForMagic)
  if (magic) return { href: magic, isMagic: true }
  return { href: cohortDashboardCheckinDirectAbsoluteUrl(), isMagic: false }
}
