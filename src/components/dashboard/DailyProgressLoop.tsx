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

  // Contextual subtitle for Building Signal
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
      {/* Sections (two-column grid cards) */}
      {s.clearSignal.length > 0 && (
        <Section title="Clear Signal Ready" color="emerald">
          {s.clearSignal.map(r => <RowItem key={r.id} row={r} ready />)}
        </Section>
      )}
      {(data.sections as any)?.inconsistent && (data.sections as any)?.inconsistent.length > 0 && (
        <Section title="Inconsistent / Too Noisy" color="amber">
          {(data.sections as any).inconsistent.map((r: Row) => <RowItem key={r.id} row={r} />)}
        </Section>
      )}
      {s.building.length > 0 && (
        <Section title="Building Signal" subtitle={buildingSubtitle} color="indigo">
          {s.building.map(r => <RowItem key={r.id} row={r} />)}
        </Section>
      )}
      {s.noSignal.length > 0 && (
        <Section title="No Signal Found" color="slate">
          {s.noSignal.map(r => <RowItem key={r.id} row={r} noSignal />)}
        </Section>
      )}
      {(data.sections as any)?.needsData && (data.sections as any)?.needsData.length > 0 && (
        <Section title="Needs More Data" color="indigo">
          {(data.sections as any).needsData.map((r: Row) => <RowItem key={r.id} row={r} />)}
        </Section>
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

function RowItem({ row, ready, noSignal }: { row: Row; ready?: boolean; noSignal?: boolean }) {
  // Use a single, readable progress color
  const barColor = 'bg-[#14b8a6]' // teal
  // Realistic signal strength:
  // - If confidence from analysis exists (ready/no_signal), use it
  // - Otherwise, use current clean-days-based progressPercent
  const effectCat = (row as any).effectCategory as string | undefined
  const progressForDisplay = effectCat === 'needs_more_data' ? 100 : (row.progressPercent >= 100 ? 100 : row.progressPercent)
  const baseStrength = progressForDisplay
  const strength = Math.max(0, Math.min(100, Math.round(row.confidence != null ? (row.confidence * 100) : baseStrength)))
  const strengthDisplay = (effectCat === 'needs_more_data' || row.progressPercent >= 100) ? 100 : strength
  const trendArrow = row.trend === 'positive' ? '↑' : row.trend === 'negative' ? '↓' : '→'
  const [showPaywall, setShowPaywall] = useState(false)
  // Standardized effect badges
  const badge = (() => {
    const cat = (effectCat || '').toLowerCase()
    if (cat === 'works') return { label: 'MATCHED ✓', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200' }
    if (cat === 'no_effect') return { label: 'NO EFFECT', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
    if (cat === 'inconsistent') return { label: 'MIXED', cls: 'bg-amber-100 text-amber-700 border border-amber-200' }
    if (cat === 'needs_more_data') return { label: 'TESTING', cls: 'bg-blue-100 text-blue-700 border border-blue-200' }
    return null
  })()
  // Progress status copy (separate from verdict badge)
  const progressStatus = (!effectCat && row.progressPercent >= 95) ? { label: 'Almost ready', color: 'text-blue-600' } : null
  return (
    <div id={`supp-${row.id}`} className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          <span>{abbreviateSupplementName(String(row.name || ''))}</span>
          {badge ? (
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.cls}`}>
              {badge.label}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {ready && <button className="text-[11px] underline" style={{ color: '#6A3F2B' }} onClick={() => setShowPaywall(true)}>🔒 View result</button>}
          {progressStatus ? (
            <div className={`text-[11px] font-medium ${progressStatus.color}`}>{progressStatus.label}</div>
          ) : (
            <div className="text-[11px] font-medium text-gray-700">{`${progressForDisplay}%`}</div>
          )}
        </div>
      </div>
      <div className="mt-2 h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: '#E8E5E0' }}>
        <div className={`h-full ${barColor}`} style={{ width: `${progressForDisplay}%` }} />
      </div>
      <div className="mt-2 text-[11px] text-gray-600">
        Signal strength: {strengthDisplay}% <span className="mx-2">•</span>
        Trending: {trendArrow}
        <span className="mx-2">•</span>
        {row.monthlyCost && row.monthlyCost > 0 ? `$${Math.round(row.monthlyCost)}/mo` : <span className="text-gray-400">—</span>}
      </div>
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
        <h3 className="text-2xl font-semibold text-center mb-3">Unlock your results</h3>
        <p className="text-base text-gray-600">
          You&apos;ve built enough signal to see real answers.
        </p>
        <ul className="mt-3 text-gray-700 text-sm space-y-1">
          <li>✓ Which supplements actually work for your body</li>
          <li>✓ Effect sizes (e.g., +18% better sleep)</li>
          <li>✓ Keep or drop recommendations</li>
          <li>✓ How much you could save by dropping what doesn&apos;t work</li>
        </ul>
        <button
          onClick={onClose}
          className="w-full h-12 mt-6 rounded-lg bg-[#111111] text-white text-sm font-medium hover:opacity-95"
        >
          Unlock for $9.99/month — cancel anytime
        </button>
        <button onClick={onClose} className="w-full h-10 mt-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
          Maybe later
        </button>
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



