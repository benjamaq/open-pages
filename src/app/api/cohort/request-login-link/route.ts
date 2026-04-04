import { NextRequest, NextResponse } from 'next/server'
import {
  getProfileIdForAuthUser,
  isCohortParticipantForProfileOrAuth,
  isValidLoginLinkRequestEmail,
  normalizeLoginLinkRequestEmail,
  resolveAuthUserByEmailForServer,
} from '@/lib/cohortLoginLinkEligibility'
import { sendFreshCohortLoginMagicLinkForParticipantEmail } from '@/lib/cohortLoginMagicLinkEmail'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ROUTE_TAG = '[request-login-link]'

const PUBLIC_MESSAGE = 'If that email is registered for the study, you will receive a new login link shortly.'

/**
 * Public: request a fresh cohort dashboard magic link by email.
 * Responds with the same message whether or not the address qualifies (no enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const raw = typeof (body as { email?: string }).email === 'string' ? (body as { email: string }).email : ''
    const emailNorm = normalizeLoginLinkRequestEmail(raw)
    if (!isValidLoginLinkRequestEmail(emailNorm)) {
      return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 })
    }

    const authRow = await resolveAuthUserByEmailForServer(emailNorm, supabaseAdmin, {
      maxListUserPages: 50,
      // Verbose auth-resolution logs (PostgREST + listUsers) — low-traffic route; aids Vercel debugging.
      debug: true,
    })
    if (!authRow) {
      // Intentionally same public response (no enumeration). Log server-side for ops.
      // eslint-disable-next-line no-console
      console.warn(ROUTE_TAG, 'auth user not resolved (PostgREST + listUsers + cohort RPC); neutral ok response', {
        emailNormalized: emailNorm,
      })
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
    }

    const profileId = await getProfileIdForAuthUser(authRow.id)
    const isCohort = await isCohortParticipantForProfileOrAuth(profileId, authRow.id)
    if (!isCohort) {
      // eslint-disable-next-line no-console
      console.warn(ROUTE_TAG, 'auth user found but not enrolled in any cohort; neutral ok response', {
        authUserId: authRow.id,
        emailDomain: authRow.email.includes('@') ? authRow.email.split('@')[1] : undefined,
      })
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
    }

    // eslint-disable-next-line no-console
    console.log(ROUTE_TAG, 'cohort participant confirmed; generating magic link + sending email', {
      authUserId: authRow.id,
      resendToDomain: authRow.email.includes('@') ? authRow.email.split('@')[1] : undefined,
    })

    const sendErr = await sendFreshCohortLoginMagicLinkForParticipantEmail(authRow.email)
    if (sendErr) {
      // eslint-disable-next-line no-console
      console.error(ROUTE_TAG, 'magic link generate or Resend send failed', {
        error: sendErr,
        authUserId: authRow.id,
      })
      return NextResponse.json(
        { ok: false, error: 'We could not send the email right now. Try again in a few minutes.' },
        { status: 500 },
      )
    }

    // eslint-disable-next-line no-console
    console.log(ROUTE_TAG, 'login magic link email sent successfully', { authUserId: authRow.id })
    return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(ROUTE_TAG, 'unhandled error', {
      err: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 })
  }
}
