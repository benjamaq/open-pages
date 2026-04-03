import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const EMAIL_OTP_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const

function normalizeOtpType(raw: string | null): (typeof EMAIL_OTP_TYPES)[number] {
  const t = String(raw || '').trim().toLowerCase()
  if (EMAIL_OTP_TYPES.includes(t as (typeof EMAIL_OTP_TYPES)[number])) {
    return t as (typeof EMAIL_OTP_TYPES)[number]
  }
  return 'magiclink'
}

function safeNextPath(raw: string | null): string {
  const def = cohortDashboardStudyPath()
  if (raw == null || raw === '') return def
  const s = raw.trim()
  if (!s.startsWith('/') || s.startsWith('//')) return def
  return s
}

function redirectWithCr(request: Request, origin: string, nextPath: string) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const sep = nextPath.includes('?') ? '&' : '?'
  const path = `${nextPath}${sep}cr=1`
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${path}`)
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${path}`)
  }
  return NextResponse.redirect(`${origin}${path}`)
}

/**
 * Magic link: `/auth/callback?token_hash=…&type=magiclink&next=…` → verifyOtp → session cookies → redirect.
 * Legacy: `?code=` (PKCE) → exchangeCodeForSession.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const token_hash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (token_hash) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: normalizeOtpType(typeRaw),
      token_hash,
    })
    if (!error) {
      return redirectWithCr(request, origin, next)
    }
    console.error('[auth/callback] verifyOtp failed', error.message)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return redirectWithCr(request, origin, next)
    }
    console.error('[auth/callback] exchangeCodeForSession failed', error.message)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
