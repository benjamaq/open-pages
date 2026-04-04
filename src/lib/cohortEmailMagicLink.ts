import {
  cohortDashboardStudyCheckinPath,
  cohortDashboardStudyPath,
} from '@/lib/cohortDashboardDeepLink'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Cohort magic links use `auth.admin.generateLink` **without** `redirectTo`, then `properties.hashed_token` to build
 * `/auth/callback?token_hash=…&type=magiclink&next=…`. Never put Supabase `action_link` verify URLs in email HTML.
 *
 * **Inventory — every “dashboard” / “check-in” CTA must flow through `generateCohortEmailMagicLinkUrl` (or
 * `generateCohortDashboardMagicLinkUrl` / `cohortTransactional*MagicHref`, which wrap it):**
 * - `cohortComplianceConfirmed.ts` — dashboard
 * - `cohortStudyStartEmail.ts` — dashboard
 * - `cohortShippingNurture.ts` — dashboard
 * - `cohortGateReminderEmail.ts` — dashboard
 * - `cohortEnrollmentEmail.ts` — first check-in (`cohortDashboardStudyCheckinPath`)
 * - `cohortPostFirstCheckinEmail.ts` — check-in + dashboard
 * - `cohortLoginMagicLinkEmail.ts` — login / resend magic link (dashboard)
 * - Daily check-in emails (cohort check-in deep link): `sendDailyReminder` (`resend.ts`), `send-reminder.ts`,
 *   `send-daily` notification route, `send-daily-emails` cron, `test-daily-reminder` admin — via
 *   `cohortTransactionalCheckinMagicHref` → `cohortDashboardStudyCheckinPath`.
 * - `api/reminders/send` (legacy profile reminders): stable `cohortEmailCheckInLandingAbsoluteUrl()` CTA.
 *   so non-cohort users are not sent to `view=cohort`.
 *
 * Template `daily-reminder.tsx` only renders `checkinUrl` from those callers — do not hardcode dashboard URLs there.
 */

function appBaseNormalized(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.biostackr.com'
  ).replace(/\/$/, '')
}

/** OAuth-style callback on our origin (GET handled in `app/auth/callback/route.ts`). */
export function cohortAuthCallbackCleanAbsoluteUrl(): string {
  const base = appBaseNormalized()
  return new URL('/auth/callback', base).toString()
}

export function cohortDashboardRedirectToAbsoluteUrl(): string {
  return cohortAuthCallbackCleanAbsoluteUrl()
}

export function cohortDashboardCheckinRedirectToAbsoluteUrl(): string {
  return cohortAuthCallbackCleanAbsoluteUrl()
}

export function cohortDashboardDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardStudyPath()}`
}

export function cohortDashboardCheckinDirectAbsoluteUrl(): string {
  return `${appBaseNormalized()}${cohortDashboardStudyCheckinPath()}`
}

function buildCohortMagicLinkOnOrigin(
  hashedToken: string,
  postAuthDestinationPath: string,
): string {
  const base = appBaseNormalized()
  const dest = postAuthDestinationPath.startsWith('/')
    ? postAuthDestinationPath
    : `/${postAuthDestinationPath}`
  const u = new URL('/auth/callback', base)
  u.searchParams.set('token_hash', hashedToken)
  u.searchParams.set('type', 'magiclink')
  u.searchParams.set('next', dest)
  return u.toString()
}

/**
 * @param postAuthDestinationPath e.g. `/dashboard?view=cohort` — encoded as single `next` query value.
 */
export async function generateCohortEmailMagicLinkUrl(
  email: string,
  postAuthDestinationPath: string,
): Promise<string | null> {
  const em = String(email || '').trim()
  if (!em) return null

  let dest = String(postAuthDestinationPath || '').trim()
  if (!dest) return null
  if (!dest.startsWith('/')) dest = `/${dest}`

  console.log(
    '[cohortEmailMagicLink] generateLink (hashed_token flow)',
    JSON.stringify({
      emailDomain: em.includes('@') ? em.split('@')[1] : '(no domain)',
      nextPath: dest,
      noRedirectToOption: true,
    }),
  )

  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: em,
    })
    if (error) {
      console.error(
        '[cohortEmailMagicLink] generateLink error',
        JSON.stringify({ message: error.message, name: (error as { name?: string }).name }),
      )
      return null
    }

    const tokenHash = data?.properties?.hashed_token
    if (typeof tokenHash !== 'string' || tokenHash.length === 0) {
      console.error('[cohortEmailMagicLink] generateLink missing properties.hashed_token')
      return null
    }

    const emailLink = buildCohortMagicLinkOnOrigin(tokenHash, dest)
    if (!emailLink.includes('token_hash=')) {
      console.error('[cohortEmailMagicLink] internal: built URL missing token_hash param')
      return null
    }
    console.log(
      '[cohortEmailMagicLink] built email link (our origin)',
      JSON.stringify({
        host: (() => {
          try {
            return new URL(emailLink).hostname
          } catch {
            return null
          }
        })(),
        hasTokenHash: true,
        tokenHashLength: tokenHash.length,
      }),
    )
    return emailLink
  } catch (e) {
    console.error('[cohortEmailMagicLink] generateLink exception', { err: String(e) })
    return null
  }
}

export async function generateCohortDashboardMagicLinkUrl(email: string): Promise<string | null> {
  return generateCohortEmailMagicLinkUrl(email, cohortDashboardStudyPath())
}

/**
 * Resend cohort emails: always use hashed_token `/auth/callback?...` from `generateCohortEmailMagicLinkUrl`.
 * Never use Supabase `action_link` / project verify URLs in transactional HTML.
 */
export async function cohortTransactionalDashboardMagicHref(email: string, context: string): Promise<string> {
  const magic = await generateCohortDashboardMagicLinkUrl(email)
  if (magic) return magic
  console.error(`[cohortEmailMagicLink] ${context}: dashboard magic link failed; using plain URL`, {
    emailDomain: email.includes('@') ? email.split('@')[1] : '?',
  })
  return cohortDashboardDirectAbsoluteUrl()
}

export async function cohortTransactionalCheckinMagicHref(
  email: string,
  context: string,
): Promise<{ href: string; isMagic: boolean }> {
  const magic = await generateCohortEmailMagicLinkUrl(email, cohortDashboardStudyCheckinPath())
  if (magic) {
    return { href: magic, isMagic: true }
  }
  console.error(`[cohortEmailMagicLink] ${context}: checkin magic link failed; using plain URL`, {
    emailDomain: email.includes('@') ? email.split('@')[1] : '?',
  })
  return { href: cohortDashboardCheckinDirectAbsoluteUrl(), isMagic: false }
}
