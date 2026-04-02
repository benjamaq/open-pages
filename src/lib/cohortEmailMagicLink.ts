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

/**
 * Passwordless sign-in link (Supabase Auth magic link). Safe to put in email `href`;
 * opens session on tap and then redirects to the cohort dashboard.
 */
export async function generateCohortDashboardMagicLinkUrl(email: string): Promise<string | null> {
  const em = String(email || '').trim()
  if (!em) return null
  const redirectTo = cohortDashboardRedirectToAbsoluteUrl()
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: em,
      options: { redirectTo },
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

/** Prefer magic link; use plain dashboard URL if generation fails (user may need to sign in). */
export async function resolveCohortDashboardEmailHref(email: string): Promise<string> {
  const magic = await generateCohortDashboardMagicLinkUrl(email)
  return magic ?? cohortDashboardRedirectToAbsoluteUrl()
}
