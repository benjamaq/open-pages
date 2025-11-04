'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function QuickSaveContent() {
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
    setStatus('loading')
    // Delegate to server which will redirect to /checkin/success on completion
    window.location.href = `/api/checkin/process-magic-token?token=${encodeURIComponent(token)}`
  }, [router, search])

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
      {status !== 'error' ? (
        <>
          <div className="mb-3">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="24" y1="8" x2="24" y2="15" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="24" y1="33" x2="24" y2="40" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="8" y1="24" x2="15" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="33" y1="24" x2="40" y2="24" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="13" y1="13" x2="18" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="30" y1="30" x2="35" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="35" y1="13" x2="30" y2="18" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="18" y1="30" x2="13" y2="35" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M24 18L28 24L24 30L20 24Z" fill="#F4B860"/>
            </svg>
          </div>
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
            onClick={() => router.replace('/')}
            className="mt-6 inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Go to home
          </button>
        </>
      )}
    </div>
  )
}

export default function QuickSavePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Suspense fallback={<div className="w-full max-w-md text-center text-gray-600">Loading…</div>}>
        <QuickSaveContent />
      </Suspense>
    </div>
  )
}


