'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function QuickSavePage() {
  const router = useRouter()
  const search = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const token = search.get('token') || ''
    if (!token) {
      setStatus('error')
      setMessage('Missing token')
      return
    }
    let cancelled = false
    const run = async () => {
      setStatus('loading')
      try {
        const resp = await fetch('/api/checkin/process-magic-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        const json = await resp.json().catch(() => ({}))
        if (!resp.ok || !json?.ok) {
          if (cancelled) return
          setStatus('error')
          setMessage(json?.error || 'Invalid or expired token')
          return
        }
        if (cancelled) return
        router.replace('/dash?toast=magic_success')
      } catch (e: any) {
        if (cancelled) return
        setStatus('error')
        setMessage(e?.message || 'Failed to process token')
      }
    }
    run()
    return () => { cancelled = true }
  }, [router, search])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
        {status !== 'error' ? (
          <>
            <div className="text-4xl mb-3">💙</div>
            <h1 className="text-lg font-semibold text-gray-900">Saving your check‑in…</h1>
            <p className="text-sm text-gray-600 mt-2">This usually takes a second.</p>
            <div className="mt-6 flex items-center justify-center">
              <div className="h-2 w-48 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-2 w-1/3 bg-indigo-500 animate-pulse rounded-full" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">⚠️</div>
            <h1 className="text-lg font-semibold text-gray-900">We couldn’t use that link</h1>
            <p className="text-sm text-gray-600 mt-2">{message || 'The quick save token is invalid or expired.'}</p>
            <button
              onClick={() => router.replace('/dash')}
              className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}


