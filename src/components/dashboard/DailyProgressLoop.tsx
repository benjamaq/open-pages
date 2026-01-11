'use client'

import { useEffect, useMemo, useState } from 'react'
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
          console.log('isPaid:', paid, 'userId:', (me as any)?.id || '(unknown)')
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

  const tp = data?.todaysProgress
  const s = (data?.sections) || { clearSignal: [], building: [], noSignal: [] }
  const allRows = [...s.clearSignal, ...s.building, ...s.noSignal]
  const totalSupps = allRows.length
  const spendMonthly = Math.round(
    (allRows as any[]).reduce((sum, r: any) => sum + Number(r?.monthlyCost || 0), 0)
  )
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
  // Header counts: testing vs verdicts (complete+inconclusive) with fallback when supplements array missing
  const headerCounts = useMemo(() => {
    let testing = 0
    let verdicts = 0
    let inconclusive = 0
    const supps = (data as any)?.supplements as any[] | undefined
    if (Array.isArray(supps) && supps.length > 0) {
      for (const it of supps) {
        const st = String((it as any)?.testing_status || '').toLowerCase()
        if (st === 'testing') testing++
        else if (st === 'inconclusive') { verdicts++; inconclusive++ }
        else if (st === 'complete') { verdicts++ }
      }
      return { testing, verdicts, inconclusive }
    }
    // Fallback to derived states from displayed rows
    for (const r of (allRows as any[])) {
      const active = Boolean((r as any).testingActive)
      const pct = Number((r as any).progressPercent || 0)
      const verdictValue = String((r as any).verdict || '').toLowerCase()
      const effectCatLower = String((r as any).effectCategory || '').toLowerCase()
      const hasVerdict = ['keep','drop','test','test_more'].includes(verdictValue)
      const isSignificant = Boolean((r as any).isStatisticallySignificant) || ['works','no_effect'].includes(effectCatLower)
      const isVerdictReady = pct >= 100 && (hasVerdict || isSignificant)
      const isInc = pct >= 100 && !isVerdictReady
      if (active && !isVerdictReady && !isInc) testing++
      else if (isInc) { verdicts++; inconclusive++ }
      else if (isVerdictReady) { verdicts++ }
    }
    return { testing, verdicts, inconclusive }
  }, [data, allRows])
  // Next likely result (closest to completion among building, excluding noisy)
  const nextLikely = (() => {
    const candidates = s.building
      .filter(r => r.status === 'building')
      .map(r => ({ row: r, remaining: Math.max(0, (r.requiredDays || 14) - (r.daysOfData || 0)) }))
      .sort((a, b) => a.remaining - b.remaining)
    return candidates[0] || null
  })()
  const remainingLabel = (rem: number) => {
    if (rem <= 0) return "Result may be ready after tonight's analysis"
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
        <div className="text-base font-semibold text-gray-900">
          My Supplements
          <span className="ml-2 text-xs font-normal text-gray-600">
            {(() => {
              const all = allRows as any[]
              let testing = 0
              let ready = 0
              let inconclusive = 0
              for (const r of all) {
                const active = Boolean((r as any).testingActive)
                const pct = Number((r as any).progressPercent || 0)
                const verdictValue = String((r as any).verdict || '').toLowerCase()
                const effectCatLower = String((r as any).effectCategory || '').toLowerCase()
                const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
                const isSignificant =
                  Boolean((r as any).isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
                const isVerdictReady = pct >= 100 && (!isMember || hasVerdict || isSignificant)
                const isInc = pct >= 100 && isMember && !hasVerdict && !isSignificant
                const isTesting = active && !isVerdictReady && !isInc
                if (isTesting) {
                  testing++
                } else if (isVerdictReady) {
                  ready++
                } else if (isInc) {
                  inconclusive++
                }
              }
              if (isMember) {
                const parts: string[] = []
                parts.push(`${testing} testing`)
                if (inconclusive > 0) parts.push(`${inconclusive} inconclusive`)
                return `• ${parts.join(' • ')}`
              } else {
                return `• ${testing} testing • ${headerCounts.verdicts} verdicts`
              }
            })()}
          </span>
        </div>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center rounded-full bg-[#111111] text-white text-sm px-4 py-2 hover:opacity-90">
          + Add Supplement
        </a>
      </div>
      {/* Flat grid of cards (no status sub-grouping) */}
      {(() => {
        const allForDisplay = isMember
          ? [
              ...(s.clearSignal || []),
              ...(((data.sections as any)?.inconsistent) || []),
              ...(s.building || []),
              ...(s.noSignal || []),
              ...(((data.sections as any)?.needsData) || []),
            ]
          : freeAll
        // Sort by state priority:
        // 0: Verdict Ready, 1: Inconclusive, 2: Testing, 3: Inactive
        const getPriority = (row: any) => {
          const progressPct = Number(row?.progressPercent || 0)
          const verdictValue = String((row as any)?.verdict || '').toLowerCase()
          const effectCatLower = String((row as any)?.effectCategory || '').toLowerCase()
          const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
          const isSignificant = Boolean((row as any)?.isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
          const testingActive = Boolean((row as any)?.testingActive)
          const verdictReady = (progressPct >= 100) && (!isMember || hasVerdict || isSignificant)
          const inconclusive = (progressPct >= 100) && isMember && !hasVerdict && !isSignificant
          const activelyTesting = testingActive && !verdictReady && !inconclusive
          if (verdictReady) return 0
          if (inconclusive) return 1
          if (activelyTesting) return 2
          return 3
        }
        const sortedForDisplay = allForDisplay
          .map((r: any, i: number) => ({ r, i }))
          .sort((a: any, b: any) => {
            const pa = getPriority(a.r)
            const pb = getPriority(b.r)
            if (pa !== pb) return pa - pb
            // Stable: fall back to original index (creation order)
            return a.i - b.i
          })
          .map((x: any) => x.r)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {sortedForDisplay.map((r: any) => (
              <RowItem key={r.id} row={r} isMember={isMember} spendMonthly={spendMonthly} />
            ))}
          </div>
        )
      })()}
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

function RowItem({ row, ready, noSignal, isMember = false, spendMonthly }: { row: Row; ready?: boolean; noSignal?: boolean; isMember?: boolean; spendMonthly?: number }) {
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
  const testingActive = Boolean((row as any).testingActive)
  // Derive UI state from progress + verdict/significance + effect categories
  const verdictValue = String((row as any).verdict || '').toLowerCase()
  const effectCatLower = String((row as any).effectCategory || '').toLowerCase()
  const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
  const isSignificant = Boolean((row as any).isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
  // Free users: any 100% is shown as Verdict Ready (paywall). Paid users require verdict/significance.
  const isVerdictReady = (row.progressPercent >= 100) && (!isMember || hasVerdict || isSignificant)
  // Inconclusive only applies to paid users at 100% without a verdict/significance
  const isInconclusive = (row.progressPercent >= 100) && isMember && !hasVerdict && !isSignificant
  const isActivelyTesting = !isVerdictReady && !isInconclusive && testingActive
  const isInactive = !testingActive && !isVerdictReady && !isInconclusive
  const userSuppId = String((row as any).userSuppId || (row as any).id || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showRetestModal, setShowRetestModal] = useState(false)
  // Parallel testing soft warnings
  const [showParallel8Modal, setShowParallel8Modal] = useState(false)
  const [showParallel11Modal, setShowParallel11Modal] = useState(false)
  const maybeStartTesting = async () => {
    const currentTesting = Number((headerCounts as any)?.testing || 0)
    const willBe = currentTesting + 1
    try { console.log('[parallel-warning] check', { currentTesting, willBe, name: (row as any)?.name }) } catch {}
    // Heavy first so it wins if somehow both conditions match
    try {
      if (willBe === 11) {
        const dismissed = typeof window !== 'undefined' && localStorage.getItem('parallelTestingWarning11Dismissed') === '1'
        if (!dismissed) {
          setShowParallel11Modal(true)
          return
        }
      }
      if (willBe === 8) {
        const dismissed = typeof window !== 'undefined' && localStorage.getItem('parallelTestingWarning8Dismissed') === '1'
        if (!dismissed) {
          setShowParallel8Modal(true)
          return
        }
      }
    } catch {}
    await toggleTesting('testing')
  }
  const confirmParallel8 = async () => {
    try { localStorage.setItem('parallelTestingWarning8Dismissed', '1') } catch {}
    setShowParallel8Modal(false)
    await toggleTesting('testing')
  }
  const confirmParallel11 = async () => {
    try { localStorage.setItem('parallelTestingWarning11Dismissed', '1') } catch {}
    setShowParallel11Modal(false)
    await toggleTesting('testing')
  }
  const handleRetest = async () => {
    try {
      await fetch(`/api/supplements/${encodeURIComponent(userSuppId)}/retest`, { method: 'POST' })
      setShowRetestModal(false)
      try { window.dispatchEvent(new Event('progress:refresh')) } catch {}
    } catch (e) {
      console.error(e)
    }
  }
  const toggleTesting = async (next: 'testing' | 'inactive') => {
    if (!userSuppId) return
    setBusy(true)
    setErr(null)
    try {
      try {
        console.log('[testing-toggle] Toggling testing for supplement:', {
          id: (row as any).id,
          userSuppId,
          name: (row as any).name,
          next
        })
      } catch {}
      const r = await fetch(`/api/supplements/${encodeURIComponent(userSuppId)}/testing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      })
      if (r.status === 403) {
        const j = await r.json().catch(() => ({}))
        if (j?.error === 'limit_reached') {
          setShowUpgrade(true)
          setShowUpgradeModal(true)
          return
        }
      }
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        setErr(j?.error || 'Update failed')
        return
      }
      try { window.dispatchEvent(new Event('progress:refresh')) } catch {}
    } finally {
      setBusy(false)
    }
  }
  const muted = !isActivelyTesting && !isVerdictReady && !isInconclusive
  return (
    <div id={`supp-${row.id}`} className={`rounded-lg border border-gray-200 bg-white p-4`} style={isVerdictReady ? ({ borderLeft: '2px solid rgba(217,119,6,0.5)' } as any) : undefined}>
      <div style={muted ? { opacity: 0.7 } : undefined}>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900 flex items-center gap-2">
          <span>{abbreviateSupplementName(String(row.name || ''))}</span>
          {(() => {
            // Override badge for state machine
            if (isVerdictReady) {
              if (!isMember) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaywall(true)
                      try { window.history.pushState({ modal: 'paywall' }, '', '#paywall') } catch {}
                      try {
                        const onPop = (ev: PopStateEvent) => {
                          setShowPaywall(false)
                          try { window.removeEventListener('popstate', onPop as any) } catch {}
                        }
                        window.addEventListener('popstate', onPop as any, { once: true } as any)
                      } catch {}
                    }}
                    className={`text-[10px] px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200 font-medium hover:bg-gray-200`}
                    style={{ cursor: 'pointer' }}
                  >
                    🔒 Verdict Ready
                  </button>
                )
              }
            }
            if (isInconclusive) {
              return <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">Inconclusive</span>
            }
            return badge ? (
            (badge.label === '🔒 Verdict Ready' && !isMember) ? (
              <button
                type="button"
                onClick={() => {
                  setShowPaywall(true)
                  try { window.history.pushState({ modal: 'paywall' }, '', '#paywall') } catch {}
                  try {
                    const onPop = (ev: PopStateEvent) => {
                      // Close modal instead of navigating away
                      setShowPaywall(false)
                      // Remove listener after handling
                      try { window.removeEventListener('popstate', onPop as any) } catch {}
                    }
                    window.addEventListener('popstate', onPop as any, { once: true } as any)
                  } catch {}
                }}
                className={`text-[10px] px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200 font-medium hover:bg-gray-200`}
                style={{ cursor: 'pointer' }}
              >
                {badge.label}
              </button>
            ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded ${badge.cls || ''}`}>{badge.label}</span>
            )
            ) : null
          })()}
        </div>
        <div className="flex items-center gap-2">
          {testingActive ? (
          <div className="text-[11px] font-medium text-gray-700">{`${progressForDisplay}%`}</div>
          ) : null}
        </div>
      </div>
      {testingActive && effectLine && (
        <div className="mt-1 text-sm text-gray-900">{effectLine}</div>
      )}
      {(() => { try { console.log('[card-state]', { name: row.name, progressPercent: row.progressPercent, status: row.status, verdict: (row as any).verdict, effectCategory: (row as any).effectCategory, isStatisticallySignificant: (row as any).isStatisticallySignificant, testingActive, isMember, hasVerdict, isSignificant, isVerdictReady, isInconclusive }) } catch {} return null })()}
      {/* Inconclusive note for paid users */}
      {isInconclusive && isMember && (row as any).inconclusiveText && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F7F' }}>
          {(row as any).inconclusiveText}
        </div>
      )}
      {(isVerdictReady || isInconclusive) ? (
        <>
          <div className="mt-2 h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
            <div className="h-full" style={{ width: `100%`, backgroundColor: fillColor }} />
          </div>
          <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
            Signal strength: 100% <span className="mx-2">•</span>
            Days tracked: <span className="font-medium">{row.daysOfData}</span>
            {row.monthlyCost && row.monthlyCost > 0 ? <><span className="mx-2">•</span>${Math.round(row.monthlyCost)}/mo</> : null}
          </div>
        </>
      ) : isActivelyTesting ? (
        <>
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
      {(headerCounts.verdicts != null && (headerCounts.testing || 0) >= 8) && isActivelyTesting && Number((row as any)?.daysOfData || 0) >= 14 && Number((row as any)?.progressPercent || 0) < 50 && (
        <div className="mt-1 text-xs text-gray-500">Slower due to parallel testing</div>
      )}
        </>
      ) : (
        <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
          {row.monthlyCost && row.monthlyCost > 0 ? <>${Math.round(row.monthlyCost)}/mo</> : <>&nbsp;</>}
        </div>
      )}
      {(isActivelyTesting || isVerdictReady || isInconclusive) && (daysOn + daysOff) > 0 && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          ON: <span className="font-medium">{daysOn}</span>/<span className="font-medium">{reqDays}</span>{onComplete ? ' ✓' : ''} <span className="mx-2">•</span>
          OFF: <span className="font-medium">{daysOff}</span>/<span className="font-medium">{reqOff}</span>{offComplete ? ' ✓' : ''}{!offComplete && daysOff === 0 ? ' (need skip days)' : ''}
        </div>
      )}
      {!isMember && !isVerdictReady && !isInconclusive && daysOff === 0 && row.progressPercent < 100 && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          Needs skip days to compare — keep following your rotation schedule
        </div>
      )}
      {!isMember && !isVerdictReady && !isInconclusive && row.progressPercent < 100 && (
        <div className="mt-2 text-[11px] text-gray-600">Keep tracking</div>
      )}
      <div className="mt-3 flex justify-end">
        {isActivelyTesting && (
          <button
            disabled={busy}
            onClick={() => setShowStopModal(true)}
            className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Testing ✓'}
          </button>
        )}
        {isVerdictReady && !isMember && (
          <button
            onClick={() => {
              setShowPaywall(true)
              try { window.history.pushState({ modal: 'paywall' }, '', '#paywall') } catch {}
              try {
                const onPop = (ev: PopStateEvent) => {
                  setShowPaywall(false)
                  try { window.removeEventListener('popstate', onPop as any) } catch {}
                }
                window.addEventListener('popstate', onPop as any, { once: true } as any)
              } catch {}
            }}
            className="text-[11px] px-3 py-1.5 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            Unlock Verdict →
          </button>
        )}
        {isInconclusive && (
          <div className="flex gap-2">
            <a href="/results" className="text-[11px] font-medium" style={{ color: '#3A2F2A' }}>
              View full report →
            </a>
            <button
              className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
              onClick={() => setShowRetestModal(true)}
            >
              Retest
            </button>
          </div>
        )}
        {isInactive && (
          <button
            disabled={busy}
            onClick={async () => {
              try {
                console.log('[testing-toggle] Start testing clicked:', {
                  id: (row as any).id,
                  userSuppId,
                  name: (row as any).name
                })
              } catch {}
              await maybeStartTesting()
            }}
            className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start testing →'}
          </button>
        )}
      </div>
      {/* Close muted wrapper before modals */}
      </div>
      {/* Styled modal: Stop testing */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowStopModal(false)} />
          <div className="relative z-10 w-full max-w-[420px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-900">Stop testing?</div>
            <div className="mt-2 text-sm text-gray-600">
              This supplement will stay in your stack but won&apos;t build toward a verdict.
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                onClick={() => setShowStopModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 h-9 rounded bg-[#111111] text-white text-sm hover:opacity-90"
                onClick={async () => {
                  try {
                    console.log('[testing-toggle] Stop testing confirmed:', {
                      id: (row as any).id,
                      userSuppId,
                      name: (row as any).name
                    })
                  } catch {}
                  setShowStopModal(false);
                  await toggleTesting('inactive')
                }}
              >
                Stop testing
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Styled modal: Retest confirmation */}
      {showRetestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowRetestModal(false)} />
          <div className="relative z-10 w-full max-w-[420px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-900">Start a retest?</div>
            <div className="mt-2 text-sm text-gray-600">
              This will reset progress and start a fresh trial. Your previous data will be preserved.
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                onClick={() => setShowRetestModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 h-9 rounded bg-[#111111] text-white text-sm hover:opacity-90"
                onClick={handleRetest}
              >
                Start Retest
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Styled modal: Parallel testing 8 warning */}
      {showParallel8Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowParallel8Modal(false)} />
          <div className="relative z-10 w-full max-w-[460px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-900">More tests = slower clarity</div>
            <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
              {`You're testing 8 supplements at the same time.\nResults will still work, but verdicts may take longer\nand some may be inconclusive.`}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                onClick={confirmParallel8}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Styled modal: Parallel testing 11 warning */}
      {showParallel11Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowParallel11Modal(false)} />
          <div className="relative z-10 w-full max-w-[460px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-900">Heavy parallel testing</div>
            <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
              {`You're testing 11 supplements simultaneously.\nExpect longer timelines and a higher chance of\nunclear results.`}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                onClick={confirmParallel11}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Styled modal: Upgrade needed */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpgradeModal(false)} />
          <div className="relative z-10 w-full max-w-[460px] rounded-xl bg-white p-6 shadow-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-900">You have 5 verdicts on Starter plan.</div>
            <div className="mt-2 text-sm text-gray-600">
              Upgrade to Premium to unlock them and continue testing.
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 h-9 rounded border border-gray-300 text-sm text-gray-800 hover:bg-gray-50"
                onClick={() => setShowUpgradeModal(false)}
              >
                Got it
              </button>
              <a
                href="/checkout"
                className="px-3 h-9 rounded bg-[#111111] text-white text-sm hover:opacity-90 flex items-center"
              >
                Upgrade to Premium
              </a>
            </div>
          </div>
        </div>
      )}
      {err && <div className="mt-2 text-[11px] text-rose-700">{err}</div>}
      {showPaywall && (
        <PaywallModal
          onClose={() => {
            setShowPaywall(false)
            try {
              if (window.location.hash === '#paywall') {
                window.history.back()
              }
            } catch {}
          }}
          spendMonthly={spendMonthly}
        />
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

function PaywallModal({ onClose, spendMonthly }: { onClose: () => void; spendMonthly?: number }) {
  const spendDisplay = (typeof spendMonthly === 'number' && spendMonthly > 0)
    ? `$${spendMonthly}/month`
    : '$200+/month'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[560px] rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-semibold text-center mb-2 text-gray-900">Stop guessing. Start knowing.</h3>
        <p className="text-base text-gray-800 text-center">
          You&apos;re spending <span className="font-semibold">{spendDisplay}</span> on supplements. How many are actually working?
        </p>
        <ul className="mt-5 text-gray-800 text-sm space-y-2 list-disc list-inside">
          <li>Verdicts for every supplement — Keep, Drop, or Test</li>
          <li>Effect sizes — <span className="italic">“12% better sleep on Magnesium”</span></li>
          <li>Confidence levels so you know what&apos;s real</li>
          <li>Potential savings identified automatically</li>
        </ul>
        <div className="mt-4 text-sm text-gray-700">
          Most users find 2–3 supplements to drop. That&apos;s $50–150/month back in your pocket.
        </div>
        <div className="mt-6 space-y-3">
          <label className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="radio" name="plan" className="h-4 w-4" defaultChecked />
              <div>
                <div className="text-sm font-medium text-gray-900">$149/year</div>
                <div className="text-xs text-gray-600">$12.42/mo • Billed annually</div>
              </div>
            </div>
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Recommended</span>
          </label>
          <label className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <input type="radio" name="plan" className="h-4 w-4" />
              <div>
                <div className="text-sm font-medium text-gray-900">$19/month</div>
                <div className="text-xs text-gray-600">Cancel anytime</div>
              </div>
            </div>
          </label>
        </div>
        <a
          href="/checkout"
          className="w-full h-12 mt-6 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center"
        >
          Continue to checkout
        </a>
        <button onClick={onClose} className="w-full h-10 mt-2 rounded-lg border border-gray-300 text-sm text-gray-800 hover:bg-gray-50">
          Maybe later
        </button>
        <div className="mt-3 text-[11px] text-center text-gray-600">
          Payments handled by Stripe. You&apos;ll be redirected to a secure checkout page.
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



