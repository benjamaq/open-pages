'use client'

import { useEffect, useState } from 'react'
import type { UploadResult } from '@/types/UploadResult'

export default function UploadSuccess({ summary }: { summary?: UploadResult }) {
  const [hasSupplements, setHasSupplements] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Prefer active supplements count; lightweight and already available
        const res = await fetch('/api/supplements', { cache: 'no-store', credentials: 'include' })
        const data = res.ok ? await res.json().catch(() => []) : []
        if (cancelled) return
        setHasSupplements(Array.isArray(data) && data.length > 0)
      } catch {
        if (!cancelled) setHasSupplements(null)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="text-lg font-semibold text-emerald-900">Data uploaded</div>
      <div className="text-sm text-emerald-900 mt-1 max-w-prose">
        <span className="mr-1">⚡</span>
        {hasSupplements
          ? "We're now analyzing your supplements against this data. Add start dates to any supplements for faster results."
          : 'Now add your supplements — include when you started each one so we can compare before vs after.'}
      </div>
      {summary?.detectedMetrics && summary.detectedMetrics.length > 0 && (
        <div className="mt-3 text-sm text-emerald-900">
          <div className="font-medium">What we can already see</div>
          <ul className="list-disc list-inside">
            {summary.detectedMetrics.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}
      <div className="mt-5 mb-1">
        <a
          href="/dashboard?upload=success"
          className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-emerald-700 text-white text-sm font-semibold leading-none hover:bg-emerald-800"
        >
          Continue
        </a>
      </div>
    </div>
  )
}


