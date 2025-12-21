'use client'

import { useEffect, useState } from 'react'

type Suggestion = { id: string; name: string }

export function TodaysActionCard() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/suggestions/dailySkip', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setSuggestions(Array.isArray(j?.suggestions) ? j.suggestions : [])
        } else {
          setSuggestions([])
        }
      } catch {
        setSuggestions([])
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Today’s action</div>
      <div className="mt-3 flex flex-col items-center">
        <button
          onClick={() => {
            try {
              // Prefer opening the new drawer via event; provide URL hint for deep-link
              window.dispatchEvent(new Event('open:checkin:new'))
              const url = new URL(window.location.href)
              url.searchParams.set('checkin', '1')
              window.history.replaceState({}, '', url.toString())
            } catch {
              window.location.href = '/dashboard?checkin=1'
            }
          }}
          className="inline-flex items-center justify-center rounded-full bg-[#111111] px-6 py-3 text-base font-semibold text-white shadow hover:shadow-md transition"
        >
          Complete Today’s Check‑In →
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-5">
          <div className="text-sm font-medium text-gray-900">Today’s testing instructions:</div>
          <ul className="mt-2 list-disc pl-6 text-sm text-gray-800">
            {suggestions.map(s => (
              <li key={s.id}>Skip {s.name}</li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-gray-500">These steps reduce confounding so your results appear faster.</p>
        </div>
      )}
    </section>
  )
}


