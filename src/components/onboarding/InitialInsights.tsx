'use client'

import React, { useEffect, useState } from 'react'

type Insight = {
  id: string
  badge: 'green' | 'red' | 'gray'
  title: string
  confidence: number
  body: string
}

export default function InitialInsights({
  isOpen,
  onContinue
}: {
  isOpen: boolean
  onContinue: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const t = setTimeout(() => {
      // Placeholder data — real Day 1 analysis in Phase 2
      setInsights([
        {
          id: '1',
          badge: 'green',
          title: 'Magnesium (preliminary +18% sleep)',
          confidence: 68,
          body:
            "Your sleep score improved after starting magnesium — but I can't tell if that's coincidence or causation yet. Could also be coffee timing changes."
        },
        {
          id: '2',
          badge: 'red',
          title: 'Pre-workout (HRV -12%)',
          confidence: 72,
          body:
            'Your HRV dropped around when you started pre-workout. Might be tanking recovery, or might be training changes. Let’s dig deeper.'
        },
        {
          id: '3',
          badge: 'gray',
          title: 'Vitamin C (no clear pattern)',
          confidence: 45,
          body: "Six months of data and no obvious change. Maybe timing matters? Let's watch it."
        }
      ])
      setLoading(false)
    }, 1200)
    return () => clearTimeout(t)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center gap-2 py-10 text-zinc-700">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
            <p>Analyzing your data…</p>
            <p>Comparing pre/post patterns…</p>
            <p>Calculating confidence scores…</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-zinc-900">Found some interesting patterns</h2>
            <p className="mt-2 text-zinc-600">Here are 3 preliminary insights:</p>
            <div className="mt-4 space-y-3">
              {insights.map((ins) => (
                <div key={ins.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="mb-1 flex items-center gap-2 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 ${
                        ins.badge === 'green'
                          ? 'bg-green-100 text-green-700'
                          : ins.badge === 'red'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {ins.badge === 'green' ? 'Sleep +18%' : ins.badge === 'red' ? 'HRV -12%' : 'No clear pattern'}
                    </span>
                    <span className="text-xs text-zinc-500">Preliminary confidence: {ins.confidence}%</span>
                  </div>
                  <h3 className="font-medium text-zinc-900">{ins.title}</h3>
                  <p className="mt-1 text-zinc-600">{ins.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
              <h3 className="font-semibold text-zinc-900">Want the full truth?</h3>
              <p className="mt-1 text-zinc-700">
                Check in daily for 7 days and I&apos;ll refine these insights. Each day strengthens the signal.
              </p>
              <div className="mt-3">
                <button
                  onClick={onContinue}
                  className="inline-flex items-center rounded-md bg-[#F4B860] px-4 py-2 font-semibold text-zinc-900 hover:bg-[#E5A850]"
                >
                  Start 7-Day Free Trial →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


