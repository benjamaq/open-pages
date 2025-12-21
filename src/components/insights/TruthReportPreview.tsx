'use client'

import { useEffect, useMemo, useState } from 'react'

type Pattern = {
  id: string
  name: string
  effect_size: number
  confidence_score: number
  status: string
}

export function TruthReportPreview() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/insights/patterns', { cache: 'no-store', credentials: 'include' })
        if (!mounted) return
        if (res.ok) {
          const data = await res.json()
          setPatterns(Array.isArray(data) ? data : [])
        } else {
          setPatterns([])
        }
      } catch {
        if (mounted) setPatterns([])
      }
      try {
        const prog = await fetch('/api/progress/loop', { cache: 'no-store', credentials: 'include' })
        if (!mounted) return
        if (prog.ok) {
          const j = await prog.json()
          const almost = (j?.todaysProgress?.almostReady || []) as Array<{ etaDays: number }>
          const eta = (almost[0]?.etaDays ?? null)
          setRemaining(typeof eta === 'number' ? eta : null)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  const earlySignals = useMemo(() => {
    const list = (patterns || [])
      .filter((p: any) => ['significant','inconclusive'].includes(String(p.status || '').toLowerCase()))
      .sort((a, b) => (Math.abs(b.effect_size || 0)) - (Math.abs(a.effect_size || 0)))
      .slice(0, 3)
      .map(p => {
        const dir = (p.effect_size || 0) > 0 ? '🟢' : (p.effect_size || 0) < 0 ? '🔴' : '🟡'
        const pct = Math.round(Math.abs((p.effect_size || 0) * 100))
        return { label: p.name, statusIcon: dir, subtitle: `Estimated effect: ${pct}%`, href: `/supplements/${p.id}` }
      })
    return list
  }, [patterns])

  const unlockHint = remaining != null ? (remaining <= 0 ? 'Results may be ready after tonight’s sync' : `~${remaining} more check-ins to first results`) : 'Keep logging daily to strengthen your signals.'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="font-semibold text-slate-900">📊 YOUR TRUTH REPORT</div>
      </div>
      <div className="text-sm text-slate-600 mt-1">{unlockHint}</div>

      <div className="mt-6">
        <div className="text-sm font-medium text-slate-900 mb-3">Early Signals</div>
        {earlySignals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No results yet. {remaining && remaining > 0 ? `Complete ~${remaining} more check-ins to see your first results.` : 'Complete a few more clean check-ins to see your first results.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {earlySignals.map((s) => (
              <a key={s.label} href={s.href} className="rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="text-sm font-semibold text-slate-900">
                  {s.statusIcon} {s.label}
                </div>
                <div className="mt-1 text-xs text-slate-600">{s.subtitle}</div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-4 text-sm text-slate-600">Keep logging daily to strengthen your signals.</div>
      </div>
    </section>
  )
}

