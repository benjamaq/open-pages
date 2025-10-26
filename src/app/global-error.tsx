'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      console.error('[global-error]', error)
    } catch {}
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="text-5xl mb-2">😵‍💫</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">We hit an unexpected error. Please try again.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-black text-white rounded-md text-sm hover:opacity-90"
              >
                Try again
              </button>
              <button
                onClick={() => { try { window.location.reload() } catch {} }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Reload
              </button>
            </div>
            {error?.digest && (
              <div className="mt-3 text-[10px] text-gray-400">Error ID: {error.digest}</div>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}


