'use client'

import CohortParticipantResultView from '@/components/cohort/CohortParticipantResultView'
import type { CohortParticipantResultApiPayload } from '@/lib/cohortParticipantResultPayload'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

type ApiOk = {
  result_json: Record<string, unknown>
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
  pro_reward?: {
    has_row: boolean
    claimed: boolean
    claim_token: string | null
  }
}

export type CohortResultServerResolved =
  | { kind: 'ready'; payload: CohortParticipantResultApiPayload }
  | { kind: 'not_found'; reason: 'no_published_result' | 'participant_dropped' }

function apiPayloadToState(p: CohortParticipantResultApiPayload): ApiOk {
  return {
    result_json: normalizeResultJson(p.result_json),
    result_version: p.result_version,
    published_at: p.published_at,
    product_name: p.product_name,
    brand_name: p.brand_name,
    pro_reward: p.pro_reward,
  }
}

/** API usually returns JSON object; normalize if `result_json` is ever double-encoded as a string. */
function normalizeResultJson(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        return p as Record<string, unknown>
      }
    } catch {
      /* ignore */
    }
  }
  return {}
}

export default function CohortResultPageClient({
  serverResolved,
}: {
  serverResolved: CohortResultServerResolved
}) {
  const searchParams = useSearchParams()
  const hadServerReady = serverResolved.kind === 'ready'

  const [state, setState] = useState<'loading' | 'ready' | 'not_ready' | 'error'>(() =>
    serverResolved.kind === 'ready' ? 'ready' : serverResolved.kind === 'not_found' ? 'not_ready' : 'loading',
  )
  const [payload, setPayload] = useState<ApiOk | null>(() =>
    serverResolved.kind === 'ready' ? apiPayloadToState(serverResolved.payload) : null,
  )
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [notFoundReason, setNotFoundReason] = useState<string | null>(() =>
    serverResolved.kind === 'not_found' ? serverResolved.reason : null,
  )

  const loadResult = useCallback(
    async (opts?: { soft?: boolean }) => {
      const soft = Boolean(opts?.soft && hadServerReady)
      try {
        const res = await fetch('/api/cohort/participant-result', { credentials: 'include', cache: 'no-store' })
        const j = (await res.json().catch(() => ({}))) as ApiOk & { error?: string; reason?: string }
        if (res.status === 404) {
          if (soft) {
            return
          }
          setNotFoundReason(typeof j.reason === 'string' ? j.reason : null)
          setState('not_ready')
          setPayload(null)
          return
        }
        if (!res.ok) {
          if (soft) {
            return
          }
          setState('error')
          setErrMsg(String((j as { error?: string }).error || 'Could not load results'))
          setPayload(null)
          return
        }
        setPayload({
          result_json: normalizeResultJson(j.result_json),
          result_version: typeof j.result_version === 'number' ? j.result_version : 1,
          published_at: String(j.published_at || ''),
          product_name: j.product_name ?? null,
          brand_name: j.brand_name ?? null,
          pro_reward: j.pro_reward,
        })
        setState('ready')
        setErrMsg(null)
        setNotFoundReason(null)
      } catch {
        if (soft) {
          return
        }
        setState('error')
        setErrMsg('Could not load results')
        setPayload(null)
      }
    },
    [hadServerReady],
  )

  /** Client fetch: not_found from SSR may recover after magic-link cookie race; ready from SSR uses soft refresh only. */
  useEffect(() => {
    if (serverResolved.kind === 'ready') {
      const t = window.setTimeout(() => {
        void loadResult({ soft: true })
      }, 400)
      return () => window.clearTimeout(t)
    }
    void loadResult()
  }, [serverResolved.kind, loadResult])

  /** After magic-link redirect, `?cr=1` — second fetch catches session if first client request was early. */
  useEffect(() => {
    if (searchParams.get('cr') !== '1') return
    const delay = serverResolved.kind === 'ready' ? 900 : 550
    const t = window.setTimeout(() => {
      void loadResult({ soft: serverResolved.kind === 'ready' })
    }, delay)
    return () => window.clearTimeout(t)
  }, [searchParams, serverResolved.kind, loadResult])

  useEffect(() => {
    const onRefresh = () => {
      void loadResult({ soft: hadServerReady })
    }
    try {
      window.addEventListener('dashboard:refresh', onRefresh)
    } catch {
      /* ignore */
    }
    const onVis = () => {
      try {
        if (document.visibilityState === 'visible') void loadResult({ soft: hadServerReady })
      } catch {
        /* ignore */
      }
    }
    try {
      document.addEventListener('visibilitychange', onVis)
    } catch {
      /* ignore */
    }
    return () => {
      try {
        window.removeEventListener('dashboard:refresh', onRefresh)
      } catch {
        /* ignore */
      }
      try {
        document.removeEventListener('visibilitychange', onVis)
      } catch {
        /* ignore */
      }
    }
  }, [loadResult, hadServerReady])

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/white.png?v=1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 sm:py-3 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center shrink-0" aria-label="BioStackr home">
            <img src="/BIOSTACKR LOGO 2.png" alt="BioStackr" className="h-7 sm:h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-700 hover:underline whitespace-nowrap">
              Dashboard
            </Link>
            <a href="/auth/signout" className="text-sm text-slate-700 hover:underline whitespace-nowrap">
              Log out
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 py-4 sm:py-5">
        {state === 'loading' ? (
          <p className="text-sm text-slate-600">Loading your results…</p>
        ) : state === 'not_ready' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">
              {notFoundReason === 'participant_dropped'
                ? 'Results not available'
                : 'Results not available yet'}
            </h1>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              {notFoundReason === 'participant_dropped' ? (
                <>
                  Your participation in this study ended before a personal summary could be shown here. If you think
                  this is wrong, contact support with the email you used to join.
                </>
              ) : (
                <>
                  We couldn&apos;t find a published summary for <strong>the account you&apos;re signed in with</strong>.
                  If you&apos;re using a different browser profile or someone else is logged in on this device, sign out
                  and open the link from your &quot;results are ready&quot; email again (it signs you in automatically).
                  Otherwise, your summary may still be publishing — try again shortly.
                </>
              )}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to dashboard
            </Link>
          </div>
        ) : state === 'error' ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6">
            <p className="text-sm font-medium text-red-900">{errMsg || 'Something went wrong.'}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-slate-800 underline">
              Back to dashboard
            </Link>
          </div>
        ) : payload ? (
          <CohortParticipantResultView
            payload={{
              result_json: payload.result_json,
              result_version: payload.result_version,
              published_at: payload.published_at,
              product_name: payload.product_name,
              brand_name: payload.brand_name,
            }}
            rewards={{
              pro_claimed: Boolean(payload.pro_reward?.claimed),
              pro_claim_token: payload.pro_reward?.claim_token ?? null,
              pro_has_claim_row: Boolean(payload.pro_reward?.has_row),
            }}
          />
        ) : null}
      </main>
    </div>
  )
}
