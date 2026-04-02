import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Absolute URL passed to Supabase `generateLink` as `redirectTo` (must be in project redirect allow-list).
 * Lands on main dashboard with cohort panel hash.
 */
export function cohortDashboardRedirectToAbsoluteUrl(): string {
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
  return `${appBase}/dashboard#cohort-study-dashboard`
}

/** Opens cohort dashboard with check-in launcher (must match auth redirect allow-list). */
export function cohortDashboardCheckinRedirectToAbsoluteUrl(): string {
  const appBase = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
  return `${appBase}/dashboard?checkin=1#cohort-study-dashboard`
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
  return magic ?? cohortDashboardRedirectToAbsoluteUrl()
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
  const redirect = cohortDashboardCheckinRedirectToAbsoluteUrl()
  const magic = await generateCohortEmailMagicLinkUrl(email, redirect)
  if (magic) return { href: magic, isMagic: true }
  return { href: redirect, isMagic: false }
}
