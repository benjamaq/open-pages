'use client'

/**
 * Auth callback: PKCE `code` may be in the query string or in `location.hash` (not visible to Route Handlers).
 * Next.js does not run `page.tsx` and `route.ts` together for the same path, so hash support uses this client
 * page only (query `code` is handled here too).
 */

import { createClient } from '@/lib/supabase/client'
import { decodeNextSearchParam } from '@/lib/authCallbackNext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function logClient(tag: string, data: Record<string, unknown>) {
  try {
    console.log(`[auth/callback] ${tag}`, JSON.stringify(data))
  } catch {
    console.log(`[auth/callback] ${tag}`)
  }
}

/**
 * PKCE `code` may arrive in the query (server-visible) or in the hash (client-only).
 * extractCodeFromWindow reads both; fragments are not sent to Route Handlers.
 */
function extractCodeFromWindow(): string | null {
  if (typeof window === 'undefined') return null
  const fromQuery = new URLSearchParams(window.location.search).get('code')
  if (fromQuery) return fromQuery

  const rawHash = window.location.hash.replace(/^#/, '')
  if (!rawHash) return null

  const fromHash = new URLSearchParams(rawHash).get('code')
  if (fromHash) return fromHash

  return null
}

function AuthCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ran = useRef(false)
  const [hint, setHint] = useState('Finishing sign-in…')

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const nextRaw = searchParams.get('next')
    const next = decodeNextSearchParam(nextRaw)

    const queryKeys = typeof window !== 'undefined'
      ? [...new URLSearchParams(window.location.search).keys()]
      : []
    const hashLen = typeof window !== 'undefined' ? window.location.hash.length : 0

    logClient('client page: env', {
      queryKeys,
      hashLength: hashLen,
      nextDecoded: next,
    })

    ;(async () => {
      const code = extractCodeFromWindow()

      logClient('client page: code resolution', {
        codePresent: Boolean(code),
        codeLength: code?.length ?? 0,
        nextDecoded: next,
      })

      if (!code) {
        setHint('Redirecting…')
        logClient('client: no code in query or hash — auth-code-error', {
          hint: 'Supabase may have returned tokens in a format we do not parse; check hash for error=',
          hashPreview: typeof window !== 'undefined' ? window.location.hash.slice(0, 120) : null,
        })
        router.replace('/auth/auth-code-error')
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        logClient('client: exchangeCodeForSession failed', {
          message: error.message,
          name: error.name,
          status: (error as { status?: number }).status,
        })
        router.replace('/auth/auth-code-error')
        return
      }

      const sep = next.includes('?') ? '&' : '?'
      const dest = `${next}${sep}cr=1`
      logClient('client: session ok, replace', { dest })

      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch {
        /* ignore */
      }

      router.replace(dest)
    })()
  }, [router, searchParams])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-gray-600">
      <p>{hint}</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-sm text-gray-600">Loading…</div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  )
}
