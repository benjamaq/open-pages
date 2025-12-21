'use client'

import type { UploadResult } from '@/types/UploadResult'

export default function UploadSuccess({ summary }: { summary?: UploadResult }) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="text-lg font-semibold text-emerald-900">Data uploaded</div>
      <div className="text-sm text-emerald-800 mt-1 max-w-prose">
        We’re processing your data in the background. You can continue — results will improve as data is added.
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
          href="/onboarding/report-ready"
          className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-emerald-700 text-white text-sm font-semibold leading-none hover:bg-emerald-800"
        >
          Continue
        </a>
      </div>
    </div>
  )
}


