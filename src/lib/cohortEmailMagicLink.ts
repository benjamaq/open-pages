import {
  COHORT_DASHBOARD_VIEW_QUERY,
  COHORT_DASHBOARD_VIEW_VALUE,
} from '@/lib/cohortDashboardDeepLink'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Cohort magic-link `redirectTo` for Supabase `generateLink`:
 *
 * 1. **Query shape** — Build with `new URL` + `searchParams.set('next', path)` so paths like
 *    `/dashboard?view=cohort` become `.../auth/callback?next=%2Fdashboard%3Fview%3Dcohort`, not a malformed
 *    second `?` in the outer URL.
 *
 * 2. **Site URL** — Supabase Auth “Site URL” (and allow-listed redirect URLs) must match this app’s public
 *    origin **including host** (e.g. `https://www.biostackr.com` vs apex). Set `NEXT_PUBLIC_APP_URL` to the same
 *    canonical URL users use in the browser.
 *
 * 3. **Email template** — In Supabase Dashboard → Auth → Email templates (magic link / confirm), the link must
 *    use **`{{ .RedirectTo }}`** (or equivalent that forwards the redirect we pass). If the template hard-codes
 *    **`{{ .SiteURL }}`** only, the message goes to the Site URL root and ignores `redirectTo`.
 */

/**
 * Path + query for cohort dashboard (leading slash). Used as `next` after /auth/callback.
 */
function cohortDashboardNextPath(): string {
  return `/dashboard?${COHORT_DASHBOARD_VIEW_QUERY}=${COHORT_DASHBOARD_VIEW_VALUE}`
}

function cohortDashboardCheckinNextPath(): string {
  return `${cohortDashboardNextPath()}&checkin=1`
}

function appBaseNormalized(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
}

/**
 * Absolute `/auth/callback?next=…` for Supabase `generateLink` `redirectTo`.
 * `nextPath` may include query (`/dashboard?view=cohort`); it is encoded as a single param.
 */
function cohortAuthCallbackRedirectAbsoluteUrl(nextPathWithQuery: string): string {
  const base = appBaseNormalized()
  const path = nextPathWithQuery.startsWith('/') ? nextPathWithQuery : `/${nextPathWithQuery}`
  const u = new URL('/auth/callback', base)
  u.searchParams.set('next', path)
  return u.toString()
}

/**
 * Absolute URL for Supabase `generateLink` `redirectTo` (allow-list in Supabase Auth).
 *
 * Must hit `/auth/callback` so `?code=` is exchanged for session cookies. A direct `/dashboard`
 * redirect leaves the code unused → no cookies → `/api/dashboard/load` returns 401 (“Failed to load dashboard”).
 */
export function cohortDashboardRedirectToAbsoluteUrl(): string {
  return cohortAuthCallbackRedirectAbsoluteUrl(cohortDashboardNextPath())
}

/** After magic link verify, lands on cohort dashboard with check-in launcher. */
export function cohortDashboardCheckinRedirectToAbsoluteUrl(): string {
  return cohortAuthCallbackRedirectAbsoluteUrl(cohortDashboardCheckinNextPath())
}

/** Plain dashboard URL when no PKCE code (e.g. magic generation failed — user can sign in). */
export function cohortDashboardDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardNextPath()}`
}

export function cohortDashboardCheckinDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardCheckinNextPath()}`
}

/** redirectTo we send to Supabase admin generateLink (must be allow-listed; should be …/auth/callback?next=…). */
function logGenerateLinkRedirectToInput(redirectTo: string): void {
  const to = String(redirectTo || '').trim()
  const hasCallbackPath = to.includes('/auth/callback')
  const hasNextParam = /[?&]next=/.test(to)
  const looksLikeDirectDashboard =
    /\/dashboard\b/.test(to) && !hasCallbackPath

  console.log(
    '[cohortEmailMagicLink] generateLink redirectTo (exact)',
    JSON.stringify({
      redirectTo: to,
      redirectToLength: to.length,
      hasAuthCallbackInPath: hasCallbackPath,
      hasNextQueryParam: hasNextParam,
      looksLikeDirectDashboardUrl: looksLikeDirectDashboard,
    }),
  )

  if (!hasCallbackPath || !hasNextParam) {
    console.warn(
      '[cohortEmailMagicLink] generateLink redirectTo should contain /auth/callback and a next= param — otherwise Supabase may use Site URL and users land on the homepage.',
      { redirectTo: to },
    )
  }
}

function logGenerateLinkRedirectDebug(actionLink: string | null | undefined, expectedRedirectTo: string) {
  const link = typeof actionLink === 'string' ? actionLink : ''
  let verifyRedirectTo: string | null = null
  try {
    const u = new URL(link)
    verifyRedirectTo = u.searchParams.get('redirect_to')
  } catch {
    /* action_link may be malformed in edge cases */
  }
  let decoded = verifyRedirectTo
  if (decoded) {
    try {
      decoded = decodeURIComponent(decoded.replace(/\+/g, '%20'))
    } catch {
      /* keep raw */
    }
    try {
      if (decoded.includes('%')) decoded = decodeURIComponent(decoded)
    } catch {
      /* single pass enough */
    }
  }
  console.log(
    '[cohortEmailMagicLink] generateLink result',
    JSON.stringify({
      expectedRedirectTo,
      actionLinkHost: (() => {
        try {
          return new URL(link).hostname
        } catch {
          return null
        }
      })(),
      verifyRedirectToDecodedPreview: decoded ? decoded.slice(0, 240) : null,
      actionLinkEmbedsCallbackPath: Boolean(decoded?.includes('/auth/callback')),
      actionLinkLength: link.length,
    }),
  )
  if (
    expectedRedirectTo.includes('/auth/callback') &&
    decoded &&
    !decoded.includes('/auth/callback')
  ) {
    console.warn(
      '[cohortEmailMagicLink] Supabase verify redirect_to is not /auth/callback — allow-list may be rewriting to Site URL (dashboard). Check Auth → URL configuration.',
      { decodedPreview: decoded.slice(0, 320), expectedRedirectTo },
    )
  }
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

  logGenerateLinkRedirectToInput(to)

  console.log(
    '[cohortEmailMagicLink] generateLink request',
    JSON.stringify({
      redirectTo: to,
      emailDomain: em.includes('@') ? em.split('@')[1] : '(no domain)',
    }),
  )

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: em,
      options: { redirectTo: to },
    })
    if (error) {
      console.error(
        '[cohortEmailMagicLink] generateLink error',
        JSON.stringify({
          redirectTo: to,
          message: error.message,
          name: (error as { name?: string }).name,
        }),
      )
      return null
    }
    const link = data?.properties?.action_link
    if (typeof link !== 'string' || link.length === 0) {
      console.error('[cohortEmailMagicLink] generateLink missing action_link', { redirectTo: to })
      return null
    }
    logGenerateLinkRedirectDebug(link, to)
    return link
  } catch (e) {
    console.error('[cohortEmailMagicLink] generateLink exception', { redirectTo: to, err: String(e) })
    return null
  }
}

export async function generateCohortDashboardMagicLinkUrl(email: string): Promise<string | null> {
  return generateCohortEmailMagicLinkUrl(email, cohortDashboardRedirectToAbsoluteUrl())
}

/** Prefer magic link; use plain dashboard URL if generation fails (user may need to sign in). */
export async function resolveCohortDashboardEmailHref(email: string): Promise<string> {
  const attempted = cohortDashboardRedirectToAbsoluteUrl()
  const magic = await generateCohortEmailMagicLinkUrl(email, attempted)
  if (magic) return magic
  console.warn('[cohortEmailMagicLink] dashboard href fallback (not magic)', { attemptedRedirectTo: attempted })
  return cohortDashboardDirectAbsoluteUrl()
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
  console.warn('[cohortEmailMagicLink] checkin href fallback (not magic)', {
    attemptedRedirectTo: redirectForMagic,
    directHref: cohortDashboardCheckinDirectAbsoluteUrl(),
  })
  return { href: cohortDashboardCheckinDirectAbsoluteUrl(), isMagic: false }
}
