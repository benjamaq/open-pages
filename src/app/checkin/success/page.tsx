'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SuccessContent() {
  const search = useSearchParams()
  const router = useRouter()
  const error = search.get('error')
  const date = search.get('date')
  const pain = search.get('pain')
  const mood = search.get('mood')
  const sleep = search.get('sleep')

  if (error) {
    const friendly = error === 'invalid_token' ? 'Invalid or expired link' :
      error === 'expired_token' ? 'This link has expired' :
      error === 'no_previous_entry' ? 'No previous day to copy from' :
      'Something went wrong'
    return (
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
        <div className="text-4xl mb-3">⚠️</div>
        <h1 className="text-lg font-semibold text-gray-900">We couldn’t save your check‑in</h1>
        <p className="text-sm text-gray-600 mt-2">{friendly}</p>
        <button
          onClick={() => router.replace('/')}
          className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          Go to home
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
      <div className="text-4xl mb-3">✅</div>
      <h1 className="text-lg font-semibold text-gray-900">Check‑in saved{date ? ` for ${date}` : ''}!</h1>
      {(pain || mood || sleep) && (
        <div className="mt-3 text-sm text-gray-700">
          {pain && <div>Pain: {pain}</div>}
          {mood && <div>Mood: {mood}</div>}
          {sleep && <div>Sleep: {sleep}</div>}
        </div>
      )}
      <p className="text-sm text-gray-600 mt-3">You can close this window.</p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            try {
              // Try client-side navigation first
              router.push('/dash')
            } catch {}
            // Fallback to hard redirect in case client navigation is blocked
            try {
              const base = (process as any).env?.NEXT_PUBLIC_SITE_URL
              const url = base ? new URL('/dash', base).toString() : '/dash'
              setTimeout(() => { window.location.assign(url) }, 100)
            } catch {}
          }}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
        >
          View Dashboard
        </button>
      </div>
    </div>
  )
}

export default function CheckinSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={<div className="w-full max-w-md text-center text-gray-600">Loading…</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  )
}


