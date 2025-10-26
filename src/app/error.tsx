'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      console.error('[route-error]', error)
    } catch {}
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
        <div className="text-5xl mb-2">🧯</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Page had an issue</h2>
        <p className="text-sm text-gray-600 mb-4">We recovered the app. You can retry this page.</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-black text-white rounded-md text-sm hover:opacity-90"
          >
            Retry
          </button>
          <button
            onClick={() => { try { window.location.href = '/dash' } catch {} }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}


