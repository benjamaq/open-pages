'use client'

import { useEffect, useState } from 'react'
import { StackCostCard } from '@/components/insights/StackCostCard'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'

type Row = {
  id: string
  name: string
  progressPercent: number
  daysOfData: number
  requiredDays: number
  status: 'building' | 'ready' | 'no_signal'
  trend?: 'positive' | 'negative' | 'neutral'
  effectPct?: number | null
  confidence?: number | null
  monthlyCost?: number | null
  progressState?: string
}

export function DailyProgressLoop() {
  const [data, setData] = useState<{
    todaysProgress?: {
      streakDays: number
      improved: Array<{ name: string; delta: number }>
      almostReady: Array<{ name: string; percent: number; etaDays: number }>
      phase: string
      hasCheckedInToday?: boolean
      todaySummary?: { mood?: number; energy?: number; focus?: number }
    }
    rotation?: {
      phase?: 'baseline' | 'rotation'
      action?: any
    }
    sections?: {
      clearSignal: Row[]
      inconsistent?: Row[]
      building: Row[]
      noSignal: Row[]
      needsData?: Row[]
    }
  } | null>(null)
  const [milestone50, setMilestone50] = useState<{ id: string; name: string; percent: number } | null>(null)
  const [milestone85, setMilestone85] = useState<{ id: string; name: string; percent: number } | null>(null)
  const [isMember, setIsMember] = useState<boolean>(false)

  // Debug: confirm membership gating value on each change
  useEffect(() => {
    try { console.log('isMember:', isMember) } catch {}
  }, [isMember])

  useEffect(() => {
    let mounted = true
    const refresh = async () => {
      try {
        const r = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) setData(await r.json())
        else setData(null)
      } catch {
        setData(null)
      }
    }
    // Initial fetch
    refresh()
    // Load membership status for gating verdicts
    ;(async () => {
      try {
        let paid = false
        // Prefer unified billing info
        try {
          const r = await fetch('/api/billing/info', { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            paid = Boolean(j?.isPaid)
          }
        } catch {}
        // Fallback to payments/status
        if (!paid) {
          try {
            const pr = await fetch('/api/payments/status', { cache: 'no-store' })
            if (pr.ok) {
              const j = await pr.json()
              paid = !!(j as any)?.is_member
            }
          } catch {}
        }
        if (!mounted) return
        setIsMember(paid)
        // Debug: log userId and paid status
        try {
          const me = await fetch('/api/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : {})
          console.log('isPaid:', paid, 'userId:', me?.id || '(unknown)')
        } catch {}
      } catch {}
    })()
    // Listen for explicit refresh events after check-in completes
    const handler = () => { refresh() }
    if (typeof window !== 'undefined') {
      window.addEventListener('progress:refresh', handler as any)
    }
    return () => {
      mounted = false
      if (typeof window !== 'undefined') {
        window.removeEventListener('progress:refresh', handler as any)
      }
    }
  }, [])

  // Detect milestones once data arrives
  useEffect(() => {
    if (!data?.sections) return
    try {
      const shown50 = typeof window !== 'undefined' ? localStorage.getItem('milestone_50_shown') === '1' : true
      const shown85 = typeof window !== 'undefined' ? localStorage.getItem('milestone_85_shown') === '1' : true
      const all = [
        ...(data.sections.clearSignal || []),
        ...(data.sections.building || []),
        ...(data.sections.noSignal || []),
      ]
      // Prefer highest % that meets threshold
      const hit85 = all.filter(r => r.progressPercent >= 85).sort((a,b) => b.progressPercent - a.progressPercent)[0]
      const hit50 = all.filter(r => r.progressPercent >= 50).sort((a,b) => b.progressPercent - a.progressPercent)[0]
      if (!shown85 && hit85) {
        setMilestone85({ id: hit85.id, name: hit85.name, percent: hit85.progressPercent })
      } else if (!shown50 && hit50) {
        setMilestone50({ id: hit50.id, name: hit50.name, percent: hit50.progressPercent })
      }
    } catch {
      // ignore
    }
  }, [data])

  const dismiss50 = () => {
    try { localStorage.setItem('milestone_50_shown', '1') } catch {}
    setMilestone50(null)
  }
  const dismiss85 = () => {
    try { localStorage.setItem('milestone_85_shown', '1') } catch {}
    setMilestone85(null)
  }

  if (!data) return null
  const tp = data.todaysProgress
  const s = data.sections || { clearSignal: [], building: [], noSignal: [] }
  const allRows = [...s.clearSignal, ...s.building, ...s.noSignal]
  const totalSupps = allRows.length
  const analyzedCount = s.clearSignal.length + s.noSignal.length
  const stackPercent = totalSupps > 0 ? Math.round((analyzedCount / totalSupps) * 100) : 0
  const readyCount = s.clearSignal.length
  const buildingCount = s.building.length
  // Free-mode neutral sections: compute from all rows
  const freeAll = [
    ...(s.clearSignal || []),
    ...(s.noSignal || []),
    ...((data.sections as any)?.inconsistent || []),
    ...(s.building || []),
    ...((data.sections as any)?.needsData || []),
  ]
  const freeBuilding = freeAll.filter((r: any) => {
    const pct = Number(r?.progressPercent ?? 0)
    const hasVerdict = Boolean((r as any)?.effectCategory)
    return !hasVerdict && pct < 100
  })
  const freeReady = freeAll.filter((r: any) => {
    const pct = Number(r?.progressPercent ?? 0)
    const hasVerdict = Boolean((r as any)?.effectCategory)
    return hasVerdict || pct >= 100
  })
  // Next likely result (closest to completion among building, excluding noisy)
  const nextLikely = (() => {
    const candidates = s.building
      .filter(r => r.status === 'building')
      .map(r => ({ row: r, remaining: Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0)) }))
      .sort((a, b) => a.remaining - b.remaining)
    return candidates[0] || null
  })()
  const remainingLabel = (rem: number) => {
    if (rem <= 0) return "Result may be ready after tonight's sync"
    if (rem === 1) return "~1 more check-in"
    if (rem <= 4) return `~${rem} more check-ins`
    if (rem <= 7) return "About a week of check-ins"
    return "~2 weeks of check-ins"
  }

  // Contextual subtitle for Collecting data
  const buildingSubtitle = (() => {
    const totalDistinct = (data as any)?.checkins?.totalDistinctDays ?? 0
    const last30 = (data as any)?.checkins?.last30 ?? { total: 0, noise: 0, clean: 0 }
    if (totalDistinct <= 0) {
      return 'Complete your first check-in to start building signal'
    }
    if (last30.total > 0 && last30.noise / Math.max(1, last30.total) > 0.5) {
      return 'Noisy week — we need more clean days to isolate supplement effects'
    }
    if (last30.clean < 7) {
      return 'Just getting started — patterns typically emerge after 10–14 clean days'
    }
    if (s.clearSignal.length === 0) {
      const nl = nextLikely
      return nl ? `Building nicely — ${nl.row.name} should have results soon` : 'Building nicely — results should appear soon'
    }
    if (s.clearSignal.length > 0) {
      return `Your first results are in! ${Math.max(0, buildingCount)} supplements still building`
    }
    return undefined
  })()

  return (
    <section className="space-y-8">
      {/* Milestone popups */}
      {milestone85 && (
        <Popup title="Almost ready" body={`${milestone85.name} is at ${milestone85.percent}% signal.\n\nJust a few more days until we can show you whether it's actually working.`} cta="Can’t wait" onClose={dismiss85} />
      )}
      {milestone50 && (
        <Popup title="Your results are starting to form" body={`${milestone50.name} is now at ${milestone50.percent}% signal.\n\nEach check-in brings you closer to a clear answer. Keep going — you're halfway there.`} cta="Nice" onClose={dismiss50} />
      )}
      {/* TODAY'S ACTION lives in the unified panel (top-left). No duplicate here. */}
      {/* Header removed; hero card now provided by <DashboardHero /> */}
      {/* Supplements section heading with Add button */}
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-gray-900">My Supplements</div>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center rounded-full bg-[#111111] text-white text-sm px-4 py-2 hover:opacity-90">
          + Add Supplement
        </a>
      </div>
      {/* Sections (membership-gated presentation) */}
      {isMember ? (
        <>
          {s.clearSignal.length > 0 && (
            <Section title="Clear Signal Ready" color="emerald">
              {s.clearSignal.map(r => <RowItem key={r.id} row={r} ready isMember={isMember} />)}
            </Section>
          )}
          {(data.sections as any)?.inconsistent && (data.sections as any)?.inconsistent.length > 0 && (
            <Section title="Inconsistent / Too Noisy" color="amber">
              {(data.sections as any).inconsistent.map((r: Row) => <RowItem key={r.id} row={r} isMember={isMember} />)}
            </Section>
          )}
          {s.building.length > 0 && (
            <Section title="Collecting data" subtitle={buildingSubtitle} color="indigo">
              {s.building.map(r => <RowItem key={r.id} row={r} isMember={isMember} />)}
            </Section>
          )}
          {s.noSignal.length > 0 && (
            <Section title="No Signal Found" color="slate">
              {s.noSignal.map(r => <RowItem key={r.id} row={r} noSignal isMember={isMember} />)}
            </Section>
          )}
          {(data.sections as any)?.needsData && (data.sections as any)?.needsData.length > 0 && (
            <Section title="Needs More Data" color="indigo">
              {(data.sections as any).needsData.map((r: Row) => <RowItem key={r.id} row={r} isMember={isMember} />)}
            </Section>
          )}
        </>
      ) : (
        <>
          {freeBuilding.length > 0 && (
            <Section title="Collecting data" subtitle={buildingSubtitle} color="indigo">
              {freeBuilding.map((r: any) => <RowItem key={r.id} row={r} isMember={false} />)}
            </Section>
          )}
          {freeReady.length > 0 && (
            <Section title="Verdict ready" color="emerald">
              {freeReady.map((r: any) => <RowItem key={r.id} row={r} isMember={false} />)}
            </Section>
          )}
        </>
      )}
      {/* "Too Much Noise" category removed */}
    </section>
  )
}

function Section({ title, subtitle, color, children }: { title: string; subtitle?: string; color: 'emerald'|'indigo'|'slate'|'amber'; children: React.ReactNode }) {
  const cls = 'border-gray-200 bg-white'
  return (
    <div className={`rounded-lg border ${cls} p-4`}>
      <div className="text-xs uppercase tracking-wide text-gray-600 font-medium mb-3">{title}</div>
      {subtitle && <div className="text-xs text-gray-600 mt-0 mb-2">{subtitle}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function RowItem({ row, ready, noSignal, isMember = false }: { row: Row; ready?: boolean; noSignal?: boolean; isMember?: boolean }) {
  // Progress bar colors per dashboard palette
  const trackColor = '#E4DDD6'
  const fillColor = '#C65A2E'
  // Realistic signal strength:
  // - If confidence from analysis exists (ready/no_signal), use it
  // - Otherwise, use current clean-days-based progressPercent
  const effectCat = (row as any).effectCategory as string | undefined
  const progressForDisplay = effectCat === 'needs_more_data' ? 100 : (row.progressPercent >= 100 ? 100 : row.progressPercent)
  const baseStrength = progressForDisplay
  const strength = Math.max(0, Math.min(100, Math.round(row.confidence != null ? (row.confidence * 100) : baseStrength)))
  const strengthDisplay = (effectCat === 'needs_more_data' || row.progressPercent >= 100) ? 100 : strength
  // ON/OFF details for contextual guidance
  const daysOn = Number((row as any).daysOn || 0)
  const daysOff = Number((row as any).daysOff || 0)
  const reqDays = Number(row.requiredDays || 14)
  const reqOff = Math.min(5, Math.max(3, Math.round(reqDays / 4)))
  const onComplete = daysOn >= reqDays
  const offComplete = daysOff >= reqOff
  const [showPaywall, setShowPaywall] = useState(false)
  // Status badge (gated): show process states for free; show verdicts only if member
  const badge = (() => {
    const cat = (effectCat || '').toLowerCase()
    const reqOn = Number((row as any).requiredOnDays ?? row.requiredDays ?? 14)
    const reqOff = Number((row as any).requiredOffDays ?? Math.min(5, Math.max(3, Math.round((row.requiredDays ?? 14) / 4))))
    const on = Number((row as any).daysOnClean ?? (row as any).daysOn ?? 0)
    const off = Number((row as any).daysOffClean ?? (row as any).daysOff ?? 0)
    const isReady = on >= reqOn && off >= reqOff
    if (isReady) {
      if (isMember) {
        if (cat === 'works' || cat === 'keep') return { label: '✓ KEEP', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
        if (cat === 'no_effect' || cat === 'drop') return { label: '✗ DROP', cls: 'bg-rose-100 text-rose-800 border border-rose-200' }
        if (cat === 'inconsistent' || cat === 'needs_more_data') return { label: '◐ TESTING', cls: 'bg-amber-50 text-amber-800 border border-amber-200' }
        return { label: 'Inconclusive', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
      }
      // Free user: locked verdict
      return { label: '🔒 Verdict Ready', cls: 'bg-gray-100 text-gray-500 border border-gray-200' }
    }
    // Not ready yet — keep existing "Building" semantics
    if (!isReady) return { label: 'Collecting data', cls: 'bg-stone-100 text-stone-600' }
    return null as any
  })()
  const effectLine = (() => {
    const isReady = String(row.status || '').toLowerCase() === 'ready'
    if (!isMember || !isReady) return null
    const pct = typeof row.effectPct === 'number' ? Math.round(row.effectPct) : null
    if (pct == null) return null
    const signed = pct >= 0 ? `+${pct}` : String(pct)
    return `${signed}% energy`
  })()
  return (
    <div id={`supp-${row.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          <span>{abbreviateSupplementName(String(row.name || ''))}</span>
          {badge ? (
            <span className={`text-[10px] px-2 py-0.5 rounded ${badge.cls || ''}`}>{badge.label}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[11px] font-medium text-gray-700">{`${progressForDisplay}%`}</div>
        </div>
      </div>
      {effectLine && (
        <div className="mt-1 text-sm text-gray-900">{effectLine}</div>
      )}
      {/* Inconclusive reason for paid, ready but unclear */}
      {isMember && (daysOn >= reqDays && daysOff >= reqOff) && String((row as any).verdict || '').toLowerCase() === 'unclear' && (row as any).inconclusiveText && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F7F' }}>
          {(row as any).inconclusiveText}
        </div>
      )}
      <div className="mt-2 h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
        {(() => {
          const pct = isMember ? progressForDisplay : (progressForDisplay === 100 ? 100 : Math.min(progressForDisplay, 90))
          return <div className="h-full" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
        })()}
      </div>
      <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
        Signal strength: {strengthDisplay}% <span className="mx-2">•</span>
        Days tracked: <span className="font-medium">{row.daysOfData}</span>
        {row.monthlyCost && row.monthlyCost > 0 ? <><span className="mx-2">•</span>${Math.round(row.monthlyCost)}/mo</> : null}
      </div>
      {(daysOn + daysOff) > 0 && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          ON: <span className="font-medium">{daysOn}</span>/<span className="font-medium">{reqDays}</span>{onComplete ? ' ✓' : ''} <span className="mx-2">•</span>
          OFF: <span className="font-medium">{daysOff}</span>/<span className="font-medium">{reqOff}</span>{offComplete ? ' ✓' : ''}{!offComplete && daysOff === 0 ? ' (need skip days)' : ''}
        </div>
      )}
      {!isMember && daysOff === 0 && row.progressPercent < 100 && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          Needs skip days to compare — keep following your rotation schedule
        </div>
      )}
      {!isMember && (Boolean(effectCat) || row.progressPercent >= 100 || (daysOn >= reqDays && daysOff >= reqOff)) && (
        <div className="mt-2">
          <button
            className="text-[11px] font-medium"
            style={{ color: '#3A2F2A' }}
            onClick={async () => {
              try {
                const r = await fetch('/api/billing/info', { cache: 'no-store' })
                const j = r.ok ? await r.json() : {}
                const isPaid = Boolean(j?.subscription && (j.subscription.status === 'active' || j.subscription.status === 'trialing'))
                if (isPaid) {
                  window.location.href = '/results'
                } else {
                  window.location.href = '/checkout'
                }
              } catch {
                window.location.href = '/checkout'
              }
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            🔒 Unlock verdict
          </button>
        </div>
      )}
      {isMember && (daysOn >= reqDays && daysOff >= reqOff) && (
        <div className="mt-2">
          <a href="/results" className="text-[11px] font-medium" style={{ color: '#3A2F2A' }}>
            View full report →
          </a>
          {String((row as any).verdict || '').toLowerCase() === 'unclear' && (
            <button
              className="ml-3 text-[11px] px-2 py-1 border border-gray-300 rounded"
              onClick={async () => {
                if (!confirm('Start a retest for this supplement?')) return
                try {
                  await fetch('/api/supplement/retest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userSupplementId: (row as any).id })
                  })
                  try { window.dispatchEvent(new Event('progress:refresh')) } catch {}
                } catch (e) {
                  console.error(e)
                }
              }}
            >
              Retest
            </button>
          )}
        </div>
      )}
      {!isMember && row.progressPercent < 100 && (
        <div className="mt-2 text-[11px] text-gray-600">Keep tracking</div>
      )}
      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} />
      )}
    </div>
  )
}

function Popup({ title, body, cta, onClose }: { title: string; body: string; cta: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[480px] rounded-xl bg-white p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-semibold text-center mb-3">{title}</h3>
        <p className="text-base text-gray-600 whitespace-pre-line">{body}</p>
        <button
          onClick={onClose}
          className="w-full h-12 mt-6 rounded-lg bg-[#111111] text-white text-sm font-medium hover:opacity-95"
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

function PaywallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] rounded-xl bg-white p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-semibold text-center mb-3">Unlock your verdict</h3>
        <p className="text-base text-gray-600">
          You&apos;ve built enough signal to get a real answer.
        </p>
        <ul className="mt-3 text-gray-700 text-sm space-y-1 list-disc list-inside">
          <li>See which supplements are worth keeping — and which aren&apos;t</li>
          <li>Get a clear verdict backed by your real data</li>
          <li>Understand how confident the signal is</li>
          <li>See what staying uncertain is costing you</li>
        </ul>
        <a
          href="/checkout"
          className="w-full h-12 mt-6 rounded-lg bg-[#111111] text-white text-sm font-medium hover:opacity-90 flex items-center justify-center"
        >
          Choose a plan — $19/month or $149/year
        </a>
        <button onClick={onClose} className="w-full h-10 mt-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
          Maybe later
        </button>
        <div className="mt-3 text-[11px] text-center" style={{ color: '#8A7F78' }}>
          No guessing. No vibes. Just a clear decision.
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, emoji, hint }: { label: string; value: number | string; emoji?: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <div className="text-xs text-gray-500 flex items-center gap-1">
        {emoji ? <span className="text-gray-600">{emoji}</span> : null}
        <span className="capitalize">{label}</span>
        {hint ? <span className="text-gray-400" title={hint}>?</span> : null}
      </div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}



