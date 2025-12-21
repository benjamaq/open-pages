'use client'

import React from 'react'

export default function RuleCard({
  name,
  metric,
  confidence,
  provenAt,
  roi
}: {
  name: string
  metric: string
  confidence: number
  provenAt?: string
  roi?: string
}) {
  return (
    <div className="rounded-xl border border-green-400 bg-green-50 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-green-800">{name}</div>
        <div className="text-lg">🔒</div>
      </div>
      <div className="text-xs text-green-700 mt-1">{metric} · Conf {Math.round(confidence * 100)}%</div>
      {provenAt && <div className="text-[11px] text-green-700/80">Rule unlocked – {provenAt}</div>}
      <div className="mt-3 flex items-center justify-between">
        <button className="rounded-lg border border-green-300 bg-white text-green-800 px-3 py-1.5 text-xs hover:bg-green-100">
          Retest in 30 days
        </button>
        {roi && <div className="text-[11px] font-medium text-green-800">{roi}</div>}
      </div>
    </div>
  )
}


