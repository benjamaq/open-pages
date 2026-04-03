import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthUserByEmailNorm,
  getProfileIdForAuthUser,
  isCohortParticipantForProfileOrAuth,
  isValidLoginLinkRequestEmail,
  normalizeLoginLinkRequestEmail,
} from '@/lib/cohortLoginLinkEligibility'
import { sendFreshCohortLoginMagicLinkForParticipantEmail } from '@/lib/cohortLoginMagicLinkEmail'

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

    const authRow = await getAuthUserByEmailNorm(emailNorm)
    if (!authRow) {
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
    }
    const profileId = await getProfileIdForAuthUser(authRow.id)
    const isCohort = await isCohortParticipantForProfileOrAuth(profileId, authRow.id)
    if (!isCohort) {
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
    }

    const sendErr = await sendFreshCohortLoginMagicLinkForParticipantEmail(authRow.email)
    if (sendErr) {
      console.error('[request-login-link] send failed', sendErr)
      return NextResponse.json(
        { ok: false, error: 'We could not send the email right now. Try again in a few minutes.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE })
  } catch (e) {
    console.error('[request-login-link]', e)
    return NextResponse.json({ ok: false, error: 'Something went wrong.' }, { status: 500 })
  }
}
