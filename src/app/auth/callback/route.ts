import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { Database } from '@/lib/types'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

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

/**
 * Build the post-login redirect. Session cookies must be set on this same `NextResponse` via
 * `createServerClient` + `setAll` — using `cookies()` from `next/headers` alone can drop Set-Cookie
 * on `NextResponse.redirect()` in the App Router, so users land unauthenticated on `/dashboard` → `/login`.
 */
function callbackSuccessRedirect(request: NextRequest, nextPath: string): NextResponse {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const sep = nextPath.includes('?') ? '&' : '?'
  const path = `${nextPath}${sep}cr=1`
  let location: string
  if (isLocalEnv) {
    location = new URL(path, request.nextUrl.origin).toString()
  } else if (forwardedHost) {
    location = `https://${forwardedHost}${path.startsWith('/') ? path : `/${path}`}`
  } else {
    location = new URL(path, request.nextUrl.origin).toString()
  }
  return NextResponse.redirect(location)
}

function callbackErrorRedirect(request: NextRequest): NextResponse {
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.nextUrl.origin).toString())
}

function createSupabaseForCallback(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })
}

/**
 * Magic link: `/auth/callback?token_hash=…&type=magiclink&next=…` → verifyOtp → session cookies on redirect → dashboard.
 * Legacy: `?code=` (PKCE) → exchangeCodeForSession.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token_hash = searchParams.get('token_hash')
  const typeRaw = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (token_hash) {
    const response = callbackSuccessRedirect(request, next)
    const supabase = createSupabaseForCallback(request, response)
    const { error } = await supabase.auth.verifyOtp({
      type: normalizeOtpType(typeRaw),
      token_hash,
    })
    if (!error) {
      return response
    }
    console.error('[auth/callback] verifyOtp failed', error.message)
    return callbackErrorRedirect(request)
  }

  if (code) {
    const response = callbackSuccessRedirect(request, next)
    const supabase = createSupabaseForCallback(request, response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('[auth/callback] exchangeCodeForSession failed', error.message)
    return callbackErrorRedirect(request)
  }

  return callbackErrorRedirect(request)
}
