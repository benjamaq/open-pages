'use client'

import React from 'react'
import TrialCard from './TrialCard'

export default function TrialsPanel({
  trials
}: {
  trials: Array<{
    id: string
    title: string
    day: number
    total: number
    confidence: number
    instruction?: string
    metric?: string
  }>
}) {
  const items = trials.slice(0, 3)
  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="overflow-x-auto py-2">
        <div className="flex gap-3 min-w-max">
          {items.length === 0 ? (
            <div className="rounded-xl border border-purple-300 bg-purple-50 px-4 py-3 text-sm text-purple-700">
              No active trials. Start a 7–14 day test to get a clear verdict.
            </div>
          ) : (
            items.map(t => (
              <div key={t.id} className="w-72 shrink-0">
                <TrialCard
                  title={t.title}
                  day={t.day}
                  total={t.total}
                  progress={(t.day / Math.max(1, t.total)) * 100}
                  confidence={t.confidence}
                  instruction={t.instruction}
                  metric={t.metric}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}


