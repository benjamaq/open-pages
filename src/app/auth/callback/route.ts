import { cohortDashboardStudyPath } from '@/lib/cohortDashboardDeepLink'
import { Database } from '@/lib/types'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/** application/x-www-form-urlencoded treats `+` as space; Supabase hashes are often base64-like and may contain `+`. */
function normalizeTokenHashFromQuery(raw: string | null | undefined): string | null {
  if (raw == null || raw === '') return null
  const fixed = raw.replace(/ /g, '+').trim()
  return fixed === '' ? null : fixed
}

function redactSearchForLog(search: string): string {
  return search.replace(/token_hash=[^&]*/i, 'token_hash=[REDACTED]')
}

function extractTokenHash(request: NextRequest): { hash: string | null; diagnostics: Record<string, unknown> } {
  const sp = request.nextUrl.searchParams
  const rawFromParams = sp.get('token_hash')
  const hadSpacesInRawParam = typeof rawFromParams === 'string' && rawFromParams.includes(' ')
  let hash = normalizeTokenHashFromQuery(rawFromParams)

  if (!hash) {
    const url = request.url
    const m = /[?&]token_hash=([^&]+)/.exec(url)
    if (m) {
      try {
        hash = normalizeTokenHashFromQuery(decodeURIComponent(m[1]))
      } catch {
        hash = normalizeTokenHashFromQuery(m[1])
      }
    }
  }

  return {
    hash,
    diagnostics: {
      tokenHashLen: hash?.length ?? 0,
      hadSpacesInRawParam: hadSpacesInRawParam,
    },
  }
}

function authErrorFields(err: unknown): { message: string; status?: number; code?: string } {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; status?: number; code?: string }
    return {
      message: typeof e.message === 'string' ? e.message : String(err),
      status: e.status,
      code: typeof e.code === 'string' ? e.code : undefined,
    }
  }
  return { message: String(err) }
}

/**
 * GoTrue `/verify` + `verifyOtp`: for `token_hash` flows, `type=magiclink` only looks up the recovery
 * token. `admin.generateLink({ type: 'magiclink' })` sometimes stores the hash on confirmation (e.g. when
 * the flow is coerced to signup). The supported token-hash path is `type=email` (EmailOTPVerification),
 * which resolves via confirmation OR recovery and matches `generateLink` output. `magiclink` is also
 * deprecated in client docs for verifyOtp.
 *
 * We still try `magiclink` and `recovery` after `email` when `email` fails — same hash, different GoTrue branches.
 *
 * @see https://supabase.com/docs/reference/javascript/auth-verifyotp
 */
const VERIFY_OTP_ATTEMPTS = ['email', 'magiclink', 'recovery'] as const

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

/**
 * Magic link / OAuth code failed or missing — send users to `/login` with preserved `next` so they can
 * use password sign-in or request a fresh cohort magic link (not a dead-end `/auth/auth-code-error`).
 */
function callbackLoginRecoveryRedirect(
  request: NextRequest,
  nextPath: string,
  reason: 'expired_link' | 'auth_incomplete',
): NextResponse {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  let origin: string
  if (isLocalEnv) {
    origin = request.nextUrl.origin
  } else if (forwardedHost) {
    origin = `https://${forwardedHost}`
  } else {
    origin = request.nextUrl.origin
  }
  const u = new URL('/login', origin)
  u.searchParams.set('reason', reason)
  const safe = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
  u.searchParams.set('next', safe)
  return NextResponse.redirect(u.toString())
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
 * Magic link: `/auth/callback?token_hash=…&type=email&next=…` → verifyOtp({ type: 'email', token_hash }) → session cookies on redirect → dashboard.
 * Legacy: `?code=` (PKCE) → exchangeCodeForSession.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const { hash: token_hash, diagnostics } = extractTokenHash(request)
  const typeRaw = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('next'))

  if (token_hash) {
    const response = callbackSuccessRedirect(request, next)
    const supabase = createSupabaseForCallback(request, response)

    console.log('[auth/callback] verifyOtp context', {
      token_hash: '[REDACTED]',
      type: typeRaw,
      next,
      pathname: request.nextUrl.pathname,
      searchRedacted: redactSearchForLog(request.nextUrl.search),
      urlHost: request.headers.get('host'),
      forwardedHost: request.headers.get('x-forwarded-host'),
      ...diagnostics,
    })

    let lastError: unknown = null
    for (const otpType of VERIFY_OTP_ATTEMPTS) {
      const { error } = await supabase.auth.verifyOtp({
        type: otpType,
        token_hash,
      })
      if (!error) {
        return response
      }
      lastError = error
      console.warn('[auth/callback] verifyOtp attempt failed', {
        otpType,
        urlType: typeRaw,
        ...authErrorFields(error),
      })
    }

    console.error('[auth/callback] verifyOtp all attempts failed', {
      urlType: typeRaw,
      ...authErrorFields(lastError),
    })
    return callbackLoginRecoveryRedirect(request, next, 'expired_link')
  }

  if (code) {
    const response = callbackSuccessRedirect(request, next)
    const supabase = createSupabaseForCallback(request, response)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
    console.error('[auth/callback] exchangeCodeForSession failed', authErrorFields(error))
    return callbackLoginRecoveryRedirect(request, next, 'expired_link')
  }

  console.warn('[auth/callback] missing token_hash and code', {
    pathname: request.nextUrl.pathname,
    searchRedacted: redactSearchForLog(request.nextUrl.search),
  })
  return callbackLoginRecoveryRedirect(request, next, 'auth_incomplete')
}
