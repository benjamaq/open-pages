'use client'

import CohortParticipantResultView from '@/components/cohort/CohortParticipantResultView'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type ApiOk = {
  result_json: Record<string, unknown>
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
}

export default function CohortResultPageClient() {
  const [state, setState] = useState<'loading' | 'ready' | 'not_ready' | 'error'>('loading')
  const [payload, setPayload] = useState<ApiOk | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/cohort/participant-result', { credentials: 'include', cache: 'no-store' })
        const j = (await res.json().catch(() => ({}))) as ApiOk & { error?: string }
        if (cancelled) return
        if (res.status === 404) {
          setState('not_ready')
          return
        }
        if (!res.ok) {
          setState('error')
          setErrMsg(String((j as { error?: string }).error || 'Could not load results'))
          return
        }
        setPayload({
          result_json:
            j.result_json && typeof j.result_json === 'object'
              ? (j.result_json as Record<string, unknown>)
              : {},
          result_version: typeof j.result_version === 'number' ? j.result_version : 1,
          published_at: String(j.published_at || ''),
          product_name: j.product_name ?? null,
          brand_name: j.brand_name ?? null,
        })
        setState('ready')
      } catch {
        if (!cancelled) {
          setState('error')
          setErrMsg('Could not load results')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

      <main className="max-w-3xl mx-auto px-6 py-8">
        {state === 'loading' ? (
          <p className="text-sm text-slate-600">Loading your results…</p>
        ) : state === 'not_ready' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-slate-900">Results not available yet</h1>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              Your personal summary will appear here once the study team publishes it. You can return to your study
              dashboard anytime.
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
          />
        ) : null}
      </main>
    </div>
  )
}
