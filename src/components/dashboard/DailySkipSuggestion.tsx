'use client'

import { useEffect, useState } from 'react'

type Suggestion = { id: string; name: string; reason: 'no_off_days' | 'insufficient_off_days' | 'high_uncertainty' }

export function DailySkipSuggestion() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/suggestions/dailySkip', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setSuggestions(j?.suggestions || [])
          try { console.log('[DailySkipSuggestion] suggestions:', j?.suggestions) } catch {}
        } else {
          setSuggestions([])
          try { console.log('[DailySkipSuggestion] non-200:', res.status) } catch {}
        }
      } catch (e) {
        setSuggestions([])
        try { console.error('[DailySkipSuggestion] fetch error:', e) } catch {}
      }
    })()
    return () => { mounted = false }
  }, [])

  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-amber-900 mb-1">
        Today’s Testing Action
      </h3>
      <p className="text-sm text-amber-800 mb-2">
        Skip the following supplement{suggestions.length > 1 ? 's' : ''} today to build comparison data:
      </p>
      <ul className="ml-4 mb-3 list-disc text-sm text-amber-900">
        {suggestions.map(s => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
      <p className="text-xs text-amber-700 italic">
        This helps us separate real effects from background noise and accelerates your results.
      </p>
    </div>
  )
}


