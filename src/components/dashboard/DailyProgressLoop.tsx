'use client'

import { useEffect, useMemo, useState } from 'react'
import { StackCostCard } from '@/components/insights/StackCostCard'
import TruthReportModal from '@/components/TruthReportModal'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'
import { createClient } from '@/lib/supabase/client'
import PaywallModal from '@/components/billing/PaywallModal'
import { dedupedJson } from '@/lib/utils/dedupedJson'

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

export function DailyProgressLoop({
  progressPayload,
  isMember: isMemberProp,
  hasDailyPayload,
  mePayload,
}: {
  progressPayload?: any
  isMember?: boolean
  hasDailyPayload?: any
  mePayload?: any
}) {
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
  const [verdictReadyModal, setVerdictReadyModal] = useState<{ id: string; name: string } | null>(null)
  const [pendingVerdictModal, setPendingVerdictModal] = useState<{ id: string; name: string } | null>(null)
  const [modalBlocked, setModalBlocked] = useState<boolean>(() => {
    try { return Boolean(localStorage.getItem('bs_modal_block')) } catch { return false }
  })
  const [isMember, setIsMember] = useState<boolean>(false)
  const [hasWearables, setHasWearables] = useState<boolean>(false)
  const [suppressMilestonePopups, setSuppressMilestonePopups] = useState<boolean>(false)

  // Debug: confirm membership gating value on each change
  useEffect(() => {
    try { console.log('isMember:', isMember) } catch {}
  }, [isMember])

  useEffect(() => {
    let mounted = true

    // If the dashboard page passed preloaded data, use it and skip internal fetches on mount.
    const hasAnyProp =
      progressPayload !== undefined ||
      typeof isMemberProp === 'boolean' ||
      hasDailyPayload !== undefined ||
      mePayload !== undefined

    if (hasAnyProp) {
      try {
        if (progressPayload !== undefined) setData(progressPayload)
        if (typeof isMemberProp === 'boolean') setIsMember(isMemberProp)
        if (hasDailyPayload !== undefined) setHasWearables(Boolean(hasDailyPayload?.hasWearables))
      } catch {}
      return () => { mounted = false }
    }

    const refresh = async () => {
      try {
        const r = await dedupedJson<any>('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) setData(r.data)
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
          const r = await dedupedJson<any>('/api/billing/info', { cache: 'no-store' })
          if (r.ok) {
            const j = r.data
            paid = Boolean(j?.isPaid)
          }
        } catch {}
        // Fallback to payments/status
        if (!paid) {
          try {
        const pr = await dedupedJson<any>('/api/payments/status', { cache: 'no-store' })
        if (pr.ok) {
          const j = pr.data
              paid = !!(j as any)?.is_member
            }
          } catch {}
        }
        if (!mounted) return
        setIsMember(paid)
        // Debug: log userId and paid status
        try {
          const me = await dedupedJson<any>('/api/me', { cache: 'no-store', credentials: 'include' }).then(r => r.ok ? r.data : {})
          console.log('isPaid:', paid, 'userId:', (me as any)?.id || '(unknown)')
        } catch {}
      } catch {}
      // Load wearables presence for subtle UI enhancements
      try {
        const d = await dedupedJson<any>('/api/data/has-daily', { cache: 'no-store' })
        if (!mounted) return
        if (d.ok) {
          const j = d.data
          setHasWearables(Boolean(j?.hasWearables))
        }
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
  }, [progressPayload, isMemberProp, hasDailyPayload, mePayload])

  // Listen for "blocking modal open" signals from other dashboard components.
  // This prevents Baseline enhanced and New verdict ready from stacking.
  useEffect(() => {
    const handler = (ev: any) => {
      try {
        const blocked = Boolean(ev?.detail?.blocked)
        setModalBlocked(blocked)
      } catch {}
    }
    try {
      window.addEventListener('bs:modal-block', handler as any)
      // Sync once on mount
      try { setModalBlocked(Boolean(localStorage.getItem('bs_modal_block'))) } catch {}
    } catch {}
    return () => {
      try { window.removeEventListener('bs:modal-block', handler as any) } catch {}
    }
  }, [])

  // If user just came from a wearable upload, don't stack generic milestone popups on top of the upload success modal.
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const fromUpload = url.searchParams.get('upload') === 'success' || url.searchParams.get('baseline') === 'success'
      const uploadedFlag = (() => {
        try {
          return localStorage.getItem('bs_uploaded_wearables') === '1' || localStorage.getItem('wearable_postupload_seen') === '1'
        } catch {
          return false
        }
      })()
      setSuppressMilestonePopups(Boolean(fromUpload || uploadedFlag))
    } catch {}
  }, [])

  // Detect milestones once data arrives (per-supplement, no leaks on completed/gated)
  useEffect(() => {
    if (!data?.sections) return
    try {
      const all = [
        ...(data.sections.clearSignal || []),
        ...(data.sections.building || []),
        ...(data.sections.noSignal || []),
        ...(((data.sections as any)?.needsData) || [])
      ]
      // Helper to check/mark a one-time key (do not mark until we actually show)
      const hasShown = (key: string) => {
        if (typeof window === 'undefined') return true
        const k = `ms_${key}`
        return localStorage.getItem(k) === '1'
      }
      const markShown = (key: string) => {
        if (typeof window === 'undefined') return
        const k = `ms_${key}`
        localStorage.setItem(k, '1')
      }
      // Prefer showing a single, most-relevant popup per load
      // 1) Verdict ready modal (persistent, once per supplement id)
      {
        const readyRows = (data.sections.clearSignal || []).concat((data.sections.noSignal || []))
        const candidate = readyRows.find(r => r.progressPercent >= 100 && !hasShown(`verdict_toast_${r.id}`))
        if (candidate) {
          // If another blocking modal is open (e.g. Baseline enhanced), queue this verdict modal instead of stacking.
          if (modalBlocked) {
            setPendingVerdictModal({ id: candidate.id, name: candidate.name })
            return
          }
          markShown(`verdict_toast_${candidate.id}`)
          setPendingVerdictModal(null)
          setMilestone85(null)
          setMilestone50(null)
          setVerdictReadyModal({ id: candidate.id, name: candidate.name })
          // Don't also show other milestone popups on the same load.
          return
        }
      }
      // 2) Almost ready (>=85 and <100, not final verdict)
      const nearing = all
        .filter(r => r.progressPercent >= 85 && r.progressPercent < 100 && !(r as any).effectCategory)
        .sort((a,b) => b.progressPercent - a.progressPercent)[0]
      if (nearing) {
        const key = `85_${nearing.id}`
        if (!hasShown(key)) {
          markShown(key)
          setMilestone50(null)
          setMilestone85({ id: nearing.id, name: nearing.name, percent: nearing.progressPercent })
          return
        }
      }
      // 3) Results forming (>=50 and <85, not final verdict)
      if (!suppressMilestonePopups) {
        const forming = all
          .filter(r => r.progressPercent >= 50 && r.progressPercent < 85 && !(r as any).effectCategory)
          .sort((a,b) => b.progressPercent - a.progressPercent)[0]
        if (forming) {
          const key = `50_${forming.id}`
          if (!hasShown(key)) {
            markShown(key)
            setMilestone50({ id: forming.id, name: forming.name, percent: forming.progressPercent })
            return
          }
        }
      }
    } catch {}
  }, [data, isMember, suppressMilestonePopups, modalBlocked])

  // If a verdict modal was queued behind another modal (e.g. Baseline enhanced), show it as soon as we're unblocked.
  useEffect(() => {
    if (modalBlocked) return
    if (!pendingVerdictModal) return
    if (verdictReadyModal) return
    try {
      // Double-check we haven't shown this already (in case another effect run marked it)
      const k = `ms_verdict_toast_${pendingVerdictModal.id}`
      if (typeof window !== 'undefined' && localStorage.getItem(k) !== '1') {
        localStorage.setItem(k, '1')
      }
    } catch {}
    setVerdictReadyModal(pendingVerdictModal)
    setPendingVerdictModal(null)
  }, [modalBlocked, pendingVerdictModal, verdictReadyModal])

  const dismiss50 = () => {
    try { localStorage.setItem('milestone_50_shown', '1') } catch {}
    setMilestone50(null)
  }
  const dismiss85 = () => {
    try { localStorage.setItem('milestone_85_shown', '1') } catch {}
    setMilestone85(null)
  }

  const goToCompleted = () => {
    try {
      // Ensure the modal is closed before scrolling
      setVerdictReadyModal(null)
      setTimeout(() => {
        try {
          document.getElementById('dashboard-completed')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch {}
      }, 50)
    } catch {
      setVerdictReadyModal(null)
    }
  }

  const tp = data?.todaysProgress
  const s = (data?.sections) || { clearSignal: [], building: [], noSignal: [] }
  const allRows = [...s.clearSignal, ...s.building, ...s.noSignal]
  useEffect(() => {
    try {
      console.log('[sections-debug]', {
        clearSignal: (s.clearSignal || []).length,
        noSignal: (s.noSignal || []).length,
        building: (s.building || []).length,
        needsData: ((data?.sections as any)?.needsData || []).length
      })
    } catch {}
  }, [s.clearSignal, s.noSignal, s.building, (data?.sections as any)?.needsData])
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
    ...(((data?.sections as any)?.inconsistent) || []),
    ...(s.building || []),
    ...(((data?.sections as any)?.needsData) || []),
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
  // Header counts: derive from card logic (include needsData/inconsistent like the card list)
  const headerCounts = useMemo(() => {
    const allCombined: any[] = [
      ...(s.clearSignal || []),
      ...(s.noSignal || []),
      ...(((data?.sections as any)?.inconsistent) || []),
      ...(s.building || []),
      ...(((data?.sections as any)?.needsData) || []),
    ]
    let testing = 0
    let verdicts = 0
    for (const r of allCombined) {
      const verdictValue = String((r as any).verdict || '').toLowerCase()
      const effectCatLower = String((r as any).effectCategory || '').toLowerCase()
      const hasFinal =
        (['keep','drop'].includes(verdictValue) ||
         ['works','no_effect','no_detectable_effect'].includes(effectCatLower))
      if (hasFinal) verdicts++
      else testing++
    }
    return { testing, verdicts, inconclusive: 0 }
  }, [s.clearSignal, s.noSignal, s.building, (data?.sections as any)?.inconsistent, (data?.sections as any)?.needsData])
  // Next likely result (closest to completion among building, excluding noisy)
  const nextLikely = (() => {
    const candidates = s.building
      .filter(r => r.status === 'building')
      // Ignore brand-new zero-data rows; surface once they have any progress or tracked days
      .filter((r: any) => {
        const on = Number((r as any)?.daysOn || 0)
        const off = Number((r as any)?.daysOff || 0)
        const tracked = Number((r as any)?.daysTracked ?? r.daysOfData ?? 0)
        const pct = Number((r as any)?.progressPercent || 0)
        return (on + off + tracked + pct) > 0
      })
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
    <section className="space-y-8 px-3 sm:px-0">
      {/* Verdict ready modal (persistent) */}
      {verdictReadyModal && (
        <Popup
          title="New verdict ready"
          body={`${abbreviateSupplementName(verdictReadyModal.name)} — your result is in.`}
          cta="Nice!"
          onPrimary={goToCompleted}
          onClose={goToCompleted}
          variant="neutral"
          disableBackdropClose
          hideCloseButton
        />
      )}
      {/* Milestone popups */}
      {milestone85 && (
        <Popup
          title={(!isMember && milestone85.percent >= 100) ? 'Your result is ready' : 'Almost ready'}
          body={(!isMember && milestone85.percent >= 100)
            ? `${abbreviateSupplementName(milestone85.name)} has a result ready.\nUpgrade to unlock your verdict.`
            : `${abbreviateSupplementName(milestone85.name)} is at ${milestone85.percent}% signal.\n\nJust a few more days until we can show you whether it's actually working.`}
          cta={(!isMember && milestone85.percent >= 100) ? 'Upgrade' : 'Can’t wait'}
          onPrimary={() => {
            // Dismiss the milestone popup and open the shared upgrade modal.
            dismiss85()
            try { window.dispatchEvent(new Event('open:upgrade')) } catch {}
          }}
          secondaryCta={(!isMember && milestone85.percent >= 100) ? 'Back to dashboard' : undefined}
          onSecondary={dismiss85}
          onClose={dismiss85}
        />
      )}
      {milestone50 && (
        <Popup
          title="Your results are starting to form"
          body={`${abbreviateSupplementName(milestone50.name)} is now at ${milestone50.percent}% signal.\n\nEach check-in brings you closer to a clear answer.`}
          cta="Nice"
          onClose={dismiss50}
        />
      )}
      {/* TODAY'S ACTION lives in the unified panel (top-left). No duplicate here. */}
      {/* Header removed; hero card now provided by <DashboardHero /> */}
      {/* Supplements section heading with Add button */}
      <div className="flex items-center justify-between px-1 sm:px-0">
        <div className="text-base font-semibold text-gray-900">
          My Supplements
          <span className="ml-2 text-xs font-normal text-gray-600">
            {(() => {
              const counts = (headerCounts as any) || {}
              const testing = Number(counts.testing || 0)
              const verdicts = Number(counts.verdicts || 0)
              if (isMember) {
                const complete = Number((s.clearSignal || []).length + (s.noSignal || []).length)
                return `• ${testing} testing • ${complete} complete`
              } else {
                return `• ${testing} testing • ${verdicts} verdict${verdicts === 1 ? '' : 's'}`
              }
            })()}
          </span>
        </div>
        <a href="/dashboard?add=1" className="inline-flex items-center justify-center rounded-full bg-[#111111] text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 hover:opacity-90 whitespace-nowrap">
          + Add supplement
        </a>
      </div>
      {/* Decision Lifecycle split: Testing in progress + Completed */}
      {(() => {
        const allForDisplay = isMember
          ? [
              ...(s.clearSignal || []),
              ...(((data?.sections as any)?.inconsistent) || []),
              ...(s.building || []),
              ...(s.noSignal || []),
              ...(((data?.sections as any)?.needsData) || []),
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
          const verdictReady = (progressPct >= 100) && (!isMember || hasVerdict || isSignificant) && effectCatLower !== 'needs_more_data'
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
        // Partition into Testing vs Completed
        const testingRows = sortedForDisplay.filter((row: any) => {
          const progressPct = Number(row?.progressPercent || 0)
          const verdictValue = String((row as any)?.verdict || '').toLowerCase()
          const effectCatLower = String((row as any)?.effectCategory || '').toLowerCase()
          const hasVerdictFlag = (['keep','drop'].includes(verdictValue) || ['works','no_effect','no_detectable_effect'].includes(effectCatLower))
          const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
          const isSignificant = Boolean((row as any)?.isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
          const verdictReady = (progressPct >= 100) && (!isMember || hasVerdict || isSignificant) && effectCatLower !== 'needs_more_data'
          const inconclusive = (progressPct >= 100) && isMember && !hasVerdict && !isSignificant
          const isTooEarly = effectCatLower === 'needs_more_data'
          // Testing includes:
          // - "Too early" (needs_more_data)
          // - Any non-final item that is not marked 'verdictReady' (including 'inconclusive')
          return isTooEarly || (!hasVerdictFlag && !verdictReady)
        })
        const completedRows = sortedForDisplay.filter((row: any) => {
          const progressPct = Number(row?.progressPercent || 0)
          const verdictValue = String((row as any)?.verdict || '').toLowerCase()
          const effectCatLower = String((row as any)?.effectCategory || '').toLowerCase()
          const hasFinalVerdict = (['keep','drop'].includes(verdictValue) || ['works','negative','no_effect','no_detectable_effect'].includes(effectCatLower))
          const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
          const isSignificant = Boolean((row as any)?.isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
          const verdictReady = (progressPct >= 100) && (!isMember || hasVerdict || isSignificant) && effectCatLower !== 'needs_more_data'
          const inconclusive = (progressPct >= 100) && isMember && !hasVerdict && !isSignificant
          // Completed only when final verdict is present; "too early"/inconclusive remain in Testing
          return hasFinalVerdict
        })
        // Sort completed cards: KEEP first, then NO CLEAR SIGNAL, then DROP; within each, strongest effect first.
        const completedSorted = completedRows
          .slice()
          .sort((a: any, b: any) => {
            const verdictRank = (row: any) => {
              const v = String((row as any)?.verdict || '').toLowerCase()
              const cat = String((row as any)?.effectCategory || '').toLowerCase()
              if (v === 'keep' || cat === 'works') return 0
              if (cat === 'no_effect' || cat === 'no_detectable_effect') return 1
              if (v === 'drop' || cat === 'negative') return 2
              return 99
            }
            const ra = verdictRank(a)
            const rb = verdictRank(b)
            if (ra !== rb) return ra - rb
            const mag = (row: any) => {
              const n = Number((row as any)?.effectSize ?? (row as any)?.effect_size ?? (row as any)?.effectPct ?? 0)
              return Number.isFinite(n) ? Math.abs(n) : 0
            }
            const ma = mag(a)
            const mb = mag(b)
            if (ma !== mb) return mb - ma
            return String((a as any)?.name || '').localeCompare(String((b as any)?.name || ''))
          })
        try {
          console.log('[dashboard] partition result:', {
            testing: testingRows.length,
            completed: completedRows.length
          })
        } catch {}
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wide text-gray-600 font-medium">Testing in progress</div>
                <a href="/results" className="text-xs text-gray-700 hover:underline">Manage in My Stack →</a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {testingRows.length === 0 ? (
                  <div className="text-xs text-gray-600">No active tests right now.</div>
                ) : testingRows.map((r: any) => (
                  <RowItem key={r.id} row={r} isMember={isMember} spendMonthly={spendMonthly} headerCounts={headerCounts as any} hasWearables={hasWearables} inTestingSection />
                ))}
              </div>
            </div>
            <div id="dashboard-completed" className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-wide text-gray-600 font-medium">Completed</div>
                {/* Removed extraneous link; individual cards provide report access */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {completedRows.length === 0 ? (
                  <div className="text-xs text-gray-600">No completed results yet.</div>
                ) : completedSorted.map((r: any) => (
                  <RowItem key={r.id} row={r} isMember={isMember} spendMonthly={spendMonthly} headerCounts={headerCounts as any} hasWearables={hasWearables} />
                ))}
              </div>
            </div>
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

function RowItem({ row, ready, noSignal, isMember = false, spendMonthly, headerCounts, hasWearables, inTestingSection }: { row: Row; ready?: boolean; noSignal?: boolean; isMember?: boolean; spendMonthly?: number; headerCounts?: { testing?: number; verdicts?: number; inconclusive?: number }, hasWearables?: boolean; inTestingSection?: boolean }) {
  // Display-name helper: match My Stack's "smart" name selection so brand-heavy names don't bloat cards.
  const shortDisplayName = (raw: any) => {
    const s = String(raw || '').trim()
    if (!s) return ''
    const parts = s.split(',').map((p: string) => p.trim()).filter(Boolean)
    const candidates = (parts.length >= 2 ? parts.slice(1) : [s]).filter(Boolean)
    const KEYWORDS: RegExp[] = [
      /\bcreatine\b/i,
      /\bashwagandha\b/i,
      /\bkrill\b/i,
      /\bmagnesium\b/i,
      /\bzinc\b/i,
      /\bvitamin\s*[aek]\b/i,
      /\bvitamin\s*d\b/i,
      /\bomega[-\s]?3\b/i,
      /\bfish\s*oil\b/i,
      /\bcollagen\b/i,
      /\bprotein\b/i,
      /\bmelatonin\b/i,
      /\bgaba\b/i,
      /\bl[-\s]?theanine\b/i,
      /\bselenium\b/i,
      /\bcoq10\b/i,
    ]
    const STOP_RE = /\b(series|essential\s*series|signature\s*series|collection|line|product\s*line)\b/i
    const META_RE = /\b(unflavored|flavor|vanilla|chocolate|strawberry|capsules?|tablets?|softgels?|gummies|count|ct)\b/i
    const score = (t: string) => {
      let sc = 0
      if (STOP_RE.test(t)) sc -= 8
      if (META_RE.test(t)) sc -= 2
      if (KEYWORDS.some((re) => re.test(t))) sc += 10
      const len = t.length
      if (len >= 8 && len <= 42) sc += 2
      if (len > 60) sc -= 2
      return sc
    }
    let picked = candidates[0] || s
    let best = -999
    for (const c of candidates) {
      const sc = score(c)
      if (sc > best) { best = sc; picked = c }
    }
    return picked
      .replace(/\b\d+\s?(mcg|mg|g|iu|ml|tbsp|caps?|capsules?|tabs?|tablets?|gummies|softgels?|pack(et)?|packet|count)\b/gi, '')
      .replace(/\b\d+\s?(servings?|ct)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || s.slice(0, 28)
  }

  // Progress bar colors per dashboard palette
  const trackColor = '#E4DDD6'
  const fillColor = '#C65A2E'
  // Realistic signal strength:
  // - If confidence from analysis exists (ready/no_signal), use it
  // - Otherwise, use current clean-days-based progressPercent
  const effectCat = (row as any).effectCategory as string | undefined
  const effectCatLower = String(effectCat || '').toLowerCase()
  const isImplicit = String((row as any)?.analysisSource || '').toLowerCase() === 'implicit'
  // Final verdicts (works/no_effect/no_detectable_effect) should render as 100% signal/complete (except for upload-only implicit)
  const hasFinalVerdictGlobal = ['works','no_effect','no_detectable_effect'].includes(effectCatLower)
  // Prevent 100% display for "needs_more_data" (Truth Engine too_early) even if raw progress hit 100 on labeled days
  let progressForDisplay = row.progressPercent
  if (effectCatLower === 'needs_more_data') {
    progressForDisplay = Math.min(progressForDisplay, 95)
  }
  if ((hasFinalVerdictGlobal || progressForDisplay >= 100)) {
    progressForDisplay = 100
  }
  // For implicit (upload) cards, show the upload-derived progress as signal strength.
  // For explicit/testing cards, use progress while building; once completed, show confidence if present.
  const baseStrength = progressForDisplay
  const explicitStrength = (hasFinalVerdictGlobal || row.progressPercent >= 100)
    ? Math.max(0, Math.min(100, Math.round((row.confidence != null ? row.confidence : 1) * 100)))
    : Math.max(0, Math.min(100, Math.round(baseStrength)))
  const strengthDisplay = isImplicit ? Math.round(baseStrength) : explicitStrength
  // ON/OFF details for contextual guidance
  const daysOn = Number((row as any).daysOn || 0)
  const daysOff = Number((row as any).daysOff || 0)
  const daysTracked = Number(((row as any)?.daysTracked ?? row.daysOfData ?? 0) || 0)
  const hasNoData = (daysTracked === 0) && (daysOn === 0) && (daysOff === 0)
  if (hasNoData) {
    try { /* Force progress to 0 for true zero-data state */ } catch {}
    progressForDisplay = 0
  }
  const reqDays = Number(row.requiredDays || 14)
  const reqOff = Math.min(5, Math.max(3, Math.round(reqDays / 4)))
  const onComplete = daysOn >= reqDays
  const offComplete = daysOff >= reqOff
  const explicitCleanCheckins = Number((row as any)?.explicitCleanCheckins || 0)
  const confirmCheckinsRequired = Number((row as any)?.confirmCheckinsRequired || 3)
  const needsConfirm = isImplicit && (explicitCleanCheckins < confirmCheckinsRequired) && (row.progressPercent < 100)
  const display = (row as any)?.display as any | undefined
  // Prefer server resolver output to avoid stale/legacy row.badgeKey values.
  const displayBadgeKey = display?.badgeKey ?? (row as any)?.badgeKey
  const displayBadgeText = display?.badgeText as string | undefined
  const displayLabel = display?.label as string | undefined
  const displaySubtext = display?.subtext as string | undefined
  const [showPaywall, setShowPaywall] = useState(false)
  // Testing state derivation (used across badge, controls, etc.)
  const rawTestingActive = Boolean((row as any).testingActive)
  // Derive UI state from progress + verdict/significance + effect categories
  const verdictValue = String((row as any).verdict || '').toLowerCase()
  // reuse effectCatLower above
  const hasVerdict = ['keep', 'drop', 'test', 'test_more'].includes(verdictValue)
  const isSignificant = Boolean((row as any).isStatisticallySignificant) || ['works', 'no_effect'].includes(effectCatLower)
  // Free users: any 100% is shown as Verdict Ready (paywall). Paid users require verdict/significance.
  const isVerdictReady = (row.progressPercent >= 100) && (!isMember || hasVerdict || isSignificant)
  // Inconclusive only applies to paid users at 100% without a verdict/significance
  const isInconclusive = (row.progressPercent >= 100) && isMember && !hasVerdict && !isSignificant
  const hasFinalVerdict = (verdictValue === 'keep' || verdictValue === 'drop' || hasFinalVerdictGlobal)
  // Only treat as completed for free users if there is a final verdict; members can also complete on significance/ready
  const isCompleted = hasFinalVerdict || (isVerdictReady && isMember) || (isInconclusive && isMember)
  // Treat as building only if not completed and progress < 100
  const isBuilding = !isCompleted && (row.progressPercent < 100)
  // IMPORTANT: completed supplements may still have user_supplement.testing_status='testing' (no 'complete' enum);
  // treat them as not "testingActive" in the UI to avoid "TESTING 100%" confusion.
  const testingActive = rawTestingActive && !isCompleted
  const isInactive = !isBuilding && !isVerdictReady && !isInconclusive && !testingActive && !hasFinalVerdict
  // Global upgrade trigger: allow other parts of the app (nav, My Stack) to open the same modal
  useEffect(() => {
    const handler = () => setShowPaywall(true)
    if (typeof window !== 'undefined') window.addEventListener('open:upgrade', handler as any)
    return () => { if (typeof window !== 'undefined') window.removeEventListener('open:upgrade', handler as any) }
  }, [])
  const openUpgrade = (e?: any) => {
    try { if (e && typeof e.preventDefault === 'function') e.preventDefault() } catch {}
    try { window.dispatchEvent(new Event('open:upgrade')) } catch {}
    setShowPaywall(true)
  }
  // Fallback: capture clicks on any element marked data-upgrade to open modal even if wrappers intercept
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null
      const upgradeEl = target ? (target.closest('[data-upgrade="1"]') as HTMLElement | null) : null
      if (upgradeEl) {
        try { console.log('[UNLOCK] document-level handler fired') } catch {}
        ev.preventDefault()
        ev.stopPropagation()
        openUpgrade(ev)
      }
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handler, true) // capture phase
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('click', handler, true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const gated = (!isMember && isCompleted)

  // Status badge: prefer resolver output (badgeKey/badgeText). Fallback to legacy mapping.
  const badge = (() => {
    // First, resolver-driven badges
    const fromKey = (k?: string): { label: string; style: React.CSSProperties } | null => {
      const key = String(k || '').toLowerCase()
      if (!key) return null
      if (key === 'keep') return { label: '✓ KEEP', style: { backgroundColor: '#E8DFD0', color: '#5C4A32', border: '1px solid #D4C8B5' } as React.CSSProperties }
      if (key === 'drop') return { label: '✗ DROP', style: { backgroundColor: '#F0D4CC', color: '#8B3A2F', border: '1px solid #E0B8AD' } as React.CSSProperties }
      if (key === 'negative') return { label: 'NEGATIVE', style: { backgroundColor: '#F0D4CC', color: '#8B3A2F', border: '1px solid #E0B8AD' } as React.CSSProperties }
      if (key === 'ncs' || key === 'no_clear_signal') return { label: '○ NO CLEAR SIGNAL', style: { backgroundColor: '#EDD9A3', color: '#6B5A1E', border: '1px solid #D9C88A' } as React.CSSProperties }
      if (key === 'testing') return { label: '◐ TESTING', style: { backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as React.CSSProperties }
      if (key === 'starting') return { label: '◐ STARTING', style: { backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as React.CSSProperties }
      return null
    }
    try {
      // Debug line to confirm resolver values versus legacy mapping inputs
      // eslint-disable-next-line no-console
      console.log('BADGE INPUT:', (row as any)?.badgeKey, display?.badgeKey, (row as any)?.verdict, (row as any)?.effectCategory)
    } catch {}
    const viaResolver = fromKey(displayBadgeKey)
    if (viaResolver) return viaResolver
    const cat = (effectCat || '').toLowerCase()
    const verdict = String((row as any).verdict || '').toLowerCase()
    const mappedCat =
      cat || (verdict === 'keep' ? 'works'
      : verdict === 'drop' ? 'no_effect'
      : '')
    // Mask final verdicts for free users until upgrade
    if (!isMember && ['works','negative','no_effect','no_detectable_effect'].includes(mappedCat)) {
      return { label: '🔒 Verdict ready', style: { backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as React.CSSProperties }
    }
    if (mappedCat === 'works') {
      // Warm sand KEEP
      return { label: '✓ KEEP', style: { backgroundColor: '#E8DFD0', color: '#5C4A32', border: '1px solid #D4C8B5' } as React.CSSProperties }
    }
    if (mappedCat === 'negative') {
      return { label: 'NEGATIVE', style: { backgroundColor: '#F0D4CC', color: '#8B3A2F', border: '1px solid #E0B8AD' } as React.CSSProperties }
    }
    if (mappedCat === 'no_effect' || mappedCat === 'no_detectable_effect') {
      // Warm amber NO CLEAR SIGNAL
      return { label: '○ NO CLEAR SIGNAL', style: { backgroundColor: '#EDD9A3', color: '#6B5A1E', border: '1px solid #D9C88A' } as React.CSSProperties }
    }
    if (mappedCat === 'inconsistent') return { label: '◐ TESTING', style: { backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as React.CSSProperties }
    // "too_early" maps to needs_more_data; in Testing section, prefer a neutral testing badge over a verdict-like badge
    if (mappedCat === 'needs_more_data') return { label: '◐ TESTING', style: { backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as React.CSSProperties }
    // If API didn’t provide a verdict/category, decide between building vs error
    const reqOn = Number((row as any).requiredOnDays ?? row.requiredDays ?? 14)
    const reqOff = Number((row as any).requiredOffDays ?? Math.min(5, Math.max(3, Math.round((row.requiredDays ?? 14) / 4))))
    const on = Number((row as any).daysOnClean ?? (row as any).daysOn ?? 0)
    const off = Number((row as any).daysOffClean ?? (row as any).daysOff ?? 0)
    const isReady = on >= reqOn && off >= reqOff
    if (!isReady) return { label: '◐ TESTING', cls: 'bg-gray-100 text-gray-800 border border-gray-200' }
    return { label: 'Error: missing verdict', style: { backgroundColor: '#FDE2E2', color: '#7F1D1D', border: '1px solid #FECACA' } as React.CSSProperties }
  })()
  const displayBadge = hasNoData ? { label: '◐ STARTING', cls: 'bg-gray-100 text-gray-800 border border-gray-200' } : badge
  const effectLine = (() => {
    const isReady = String(row.status || '').toLowerCase() === 'ready'
    if (!isMember || !isReady) return null
    const pct = typeof row.effectPct === 'number' ? Math.round(row.effectPct) : null
    if (pct == null) return null
    const signed = pct >= 0 ? `+${pct}` : String(pct)
    return `${signed}% energy`
  })()
  const userSuppId = String(
    (row as any).userSuppId ||
    (row as any).userSupplementId ||
    (row as any).user_supplement_id ||
    (row as any).intake_id ||
    (row as any).id || ''
  )
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showStopModal, setShowStopModal] = useState(false)
  const [showRetestModal, setShowRetestModal] = useState(false)
  const [showTruthReport, setShowTruthReport] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [reportName, setReportName] = useState<string | null>(null)
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
      try { console.log('[retest] userSuppId:', userSuppId, 'name:', (row as any)?.name) } catch {}
      const res = await fetch(`/api/supplements/${encodeURIComponent(userSuppId)}/retest`, { method: 'POST' })
      try { console.log('[retest] response:', res.status, res.statusText) } catch {}
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[retest] failed:', body)
        setErr(body?.error || `Retest failed (${res.status})`)
        return
      }
      setShowRetestModal(false)
      try { window.dispatchEvent(new Event('progress:refresh')) } catch {}
    } catch (e) {
      console.error('[retest] error:', e)
      setErr(e instanceof Error ? e.message : 'Retest failed')
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
          setShowPaywall(true)
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
  const muted = !isBuilding && !isVerdictReady && !isInconclusive
  const displayName = shortDisplayName((row as any)?.name)
  return (
    <div
      id={`supp-${row.id}`}
      className={`rounded-lg border border-gray-200 bg-white p-3 sm:p-4 overflow-hidden`}
      style={isVerdictReady ? ({ borderLeft: '2px solid rgba(217,119,6,0.5)' } as any) : undefined}
    >
      <div style={muted ? { opacity: 0.7 } : undefined}>
      {/* Top verdict label row for free users (mirrors paid KEEP/DROP placement) */}
      {gated && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#A0846B' }}>
            Verdict ready <span aria-hidden="true">✓</span>
          </span>
          <span />
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="font-semibold text-gray-900 flex items-center gap-2 min-w-0 text-[15px] sm:text-base">
          <span className="whitespace-normal break-words sm:truncate max-w-full leading-tight">{displayName}</span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {(() => {
            const baseChipClass = 'inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full whitespace-nowrap'
            // URGENT REVERT (Bug 29): free users must not see KEEP/DROP or any verdict hint.
            // Always show a locked badge instead.
            if (gated) {
              return (
                <span
                  className={baseChipClass}
                  style={{ backgroundColor: '#F1EFEA', color: '#5C4A32', border: '1px solid #E4E0D6' } as any}
                >
                  🔒 Verdict ready
                </span>
              )
            }
            return <span className={baseChipClass} style={(displayBadge as any).style || undefined}>{displayBadge.label}</span>
          })()}
          {testingActive ? (
            <div className="text-[11px] font-medium text-gray-700">{`${progressForDisplay}%`}</div>
          ) : null}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 md:gap-3">
          {hasWearables ? (
            <span className="text-[10px] text-gray-500" title="Wearables data connected">⚡ Enhanced</span>
          ) : null}
          {(!isCompleted && row.progressPercent >= 85) ? (
            <div className="text-[11px] font-medium mt-1 sm:mt-0 ml-1 md:ml-2" style={{ color: '#C65A2E' }}>Almost ready</div>
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
      {(isCompleted) ? (
        <>
          <div className="mt-2 h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
            <div className="h-full" style={{ width: `100%`, backgroundColor: fillColor }} />
          </div>
          {(() => {
            const conf = (row as any)?.confidence
            const confNum = typeof conf === 'number' ? Math.max(0, Math.min(1, Number(conf))) : null
            const confPct = confNum == null ? null : Math.round(confNum * 100)
            const confLabel = confNum == null ? null : (confNum >= 0.75 ? 'HIGH' : confNum >= 0.5 ? 'MEDIUM' : 'LOW')

            const effSize = (row as any)?.truthEffectSize
            const effDir = (row as any)?.truthEffectDirection || (row as any)?.trend || null
            const metric = (row as any)?.primaryMetricLabel || null
            const tOn = (row as any)?.truthSampleDaysOn
            const tOff = (row as any)?.truthSampleDaysOff
            const on = (typeof tOn === 'number') ? tOn : daysOn
            const off = (typeof tOff === 'number') ? tOff : daysOff
            const tracked = (Number.isFinite(on) && Number.isFinite(off)) ? (Number(on) + Number(off)) : row.daysOfData

            return (
              <>
                <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
                  {confPct != null ? (
                    <>Confidence: <span className="font-medium">{confPct}%</span>{confLabel ? ` (${confLabel})` : ''}</>
                  ) : (
                    <>Confidence: <span className="font-medium">—</span></>
                  )}
                  {Number.isFinite(Number(effSize)) ? (
                    <>
                      <span className="mx-2">•</span>
                      Effect size (d): <span className="font-medium">{Number(effSize).toFixed(2)}</span>
                    </>
                  ) : null}
                  {effDir ? (
                    <>
                      <span className="mx-2">•</span>
                      Direction: <span className="font-medium">{String(effDir).toUpperCase()}</span>
                    </>
                  ) : null}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
                  {metric ? (
                    <>Primary metric: <span className="font-medium">{String(metric)}</span> <span className="mx-2">•</span></>
                  ) : null}
                  ON: <span className="font-medium">{Number(on) || 0}</span> <span className="mx-2">•</span>
                  OFF: <span className="font-medium">{Number(off) || 0}</span> <span className="mx-2">•</span>
                  Days tracked: <span className="font-medium">{Number(tracked) || 0}</span>
                  <><span className="mx-2">•</span>${Math.round(Number(row.monthlyCost || 0))}/mo</>
                </div>
              </>
            )
          })()}
          {!isMember && (
            <>
              {/* ON/OFF counts above the button for free users */}
              {(!hasNoData && (daysOn + daysOff) > 0) && (
                <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
                  ON: <span className="font-medium">{onComplete ? `${daysOn} ✓` : `${daysOn} of ${reqDays}`}</span> <span className="mx-2">•</span>
                  OFF: <span className="font-medium">{offComplete ? `${daysOff} ✓` : `${daysOff} of ${reqOff}`}</span>{!offComplete && daysOff === 0 ? ' (need skip days)' : ''}
                </div>
              )}
              <div className="mt-3">
                <button
                  data-upgrade="1"
                  onClick={(e) => { try { console.log('[UNLOCK] clicked (completed)', String((row as any)?.name || '')) } catch {} ; openUpgrade(e) }}
                  className="ml-auto block text-sm font-medium px-3 py-1.5 rounded-md border transition-colors cursor-pointer hover:bg-[#8B5E3C]/5"
                  style={{ color: '#8B5E3C', borderColor: '#8B5E3C', backgroundColor: 'transparent' }}
                  onMouseDown={(e) => { /* prevent card handlers */ e.stopPropagation() }}
                  onClickCapture={(e) => { e.stopPropagation() }}
                >
                  🔒 Unlock verdict
                </button>
              </div>
            </>
          )}
        </>
      ) : isBuilding ? (
        <>
      <div className="mt-2 h-[6px] w-full rounded-full overflow-hidden" style={{ backgroundColor: trackColor }}>
            {(() => {
              const pctBase = isMember ? progressForDisplay : (progressForDisplay === 100 ? 100 : Math.min(progressForDisplay, 90))
              const pct = hasNoData ? 0 : pctBase
              return <div className="h-full" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
            })()}
      </div>
      <div className="mt-1 text-[11px] text-gray-500">
        {displayLabel
          ? displayLabel
          : hasNoData
            ? 'Just added — start checking in'
            : (isImplicit ? 'Signal from historical data' : (String((row as any)?.progressLabel || '') || ''))}
      </div>
      {needsConfirm && (
        <>
          <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
            Check‑ins completed: <span className="font-medium">{explicitCleanCheckins} of {confirmCheckinsRequired}</span>
          </div>
          <div className="mt-1 text-[11px] text-gray-600">
            Your upload found a promising signal — a few more check‑ins will confirm your result.
          </div>
        </>
      )}
      {hasNoData ? (
        <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
          Days tracked: <span className="font-medium">0</span>
          <><span className="mx-2">•</span>${Math.round(Number(row.monthlyCost || 0))}/mo</>
        </div>
      ) : (
      <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
        Signal strength: {isImplicit ? Math.round(progressForDisplay) : Math.round(strengthDisplay)}% <span className="mx-2">•</span>
        Days tracked: <span className="font-medium">{row.daysOfData}</span>
        <><span className="mx-2">•</span>${Math.round(Number(row.monthlyCost || 0))}/mo</>
      </div>
      )}
      {(((headerCounts as any)?.verdicts != null) && (Number((headerCounts as any)?.testing || 0) >= 8)) && isBuilding && Number((row as any)?.daysOfData || 0) >= 14 && Number((row as any)?.progressPercent || 0) < 50 && (
        <div className="mt-1 text-xs text-gray-500">Slower due to parallel testing</div>
      )}
        </>
      ) : (
        <div className="mt-2 text-[11px]" style={{ color: '#8A7F78' }}>
          ${Math.round(Number(row.monthlyCost || 0))}/mo
        </div>
      )}
      {!hasNoData && (isBuilding || isVerdictReady || isInconclusive) && (daysOn + daysOff) > 0 && !( !isMember && isCompleted ) && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          ON: <span className="font-medium">{onComplete ? `${daysOn} ✓` : `${daysOn} of ${reqDays}`}</span> <span className="mx-2">•</span>
          OFF: <span className="font-medium">{offComplete ? `${daysOff} ✓` : `${daysOff} of ${reqOff}`}</span>{!offComplete && daysOff === 0 ? ' (need skip days)' : ''}
        </div>
      )}
      {/* Start-date nudge: when wearables exist but no labeled days yet */}
      {(hasWearables && (daysOn + daysOff) === 0) && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          ⚠️ Add a start date to unlock your verdict
        </div>
      )}
      {/* Strong ON baseline hint when progress is high but OFF days are lacking */}
      {isBuilding && row.progressPercent >= 60 && daysOff < Math.min(5, Math.max(3, Math.round((row.requiredDays || 14) / 4))) && (
        <div className="mt-1 text-xs text-gray-600">Strong ON baseline • Need OFF days</div>
      )}
      {(effectCatLower === 'needs_more_data') && (
        <div className="mt-1 text-xs text-gray-600">Waiting for more usable metric data (e.g., sleep) to compare ON vs OFF.</div>
      )}
      {!isMember && !isVerdictReady && !isInconclusive && daysOff === 0 && row.progressPercent < 100 && (
        <div className="mt-1 text-[11px]" style={{ color: '#8A7F78' }}>
          Needs skip days to compare — keep following your rotation schedule
        </div>
      )}
      {!isMember && !isVerdictReady && !isInconclusive && row.progressPercent < 100 && (
        <div className="mt-2 text-[11px] text-gray-600">Keep tracking</div>
      )}
      {(hasWearables && (isBuilding || isVerdictReady || isInconclusive)) && (
        <div className="mt-1 text-[11px] text-gray-600">Signal powered by check-ins and wearable data</div>
      )}
      {!hasNoData && (<div className="mt-3 flex justify-end">
        {/* Stop Testing should be available on ALL cards in the "Testing in progress" section (implicit or explicit). */}
        {Boolean(inTestingSection && userSuppId) && (
          <button
            disabled={busy}
            onClick={() => setShowStopModal(true)}
            className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Testing ✓'}
          </button>
        )}
        {(!isImplicit && isVerdictReady && !isMember) && (
          <button
            data-upgrade="1"
            onClick={(e) => { try { console.log('[UNLOCK] clicked (ready)', String((row as any)?.name || '')) } catch {} ; openUpgrade(e) }}
            className="text-[11px] px-3 py-1.5 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            Unlock Verdict →
          </button>
        )}
        {(isCompleted && isMember) && (() => {
          return (
            <div className="flex gap-2">
              <button
                className="text-[11px] font-medium"
                style={{ color: '#3A2F2A' }}
                onClick={() => {
                  // Determine best ID and open modal
                  const idCandidate = String((row as any).userSuppId || (row as any).userSupplementId || (row as any).id || '')
                  try { console.log('[report] Opening modal for supplement:', { idCandidate, name: (row as any)?.name }) } catch {}
                  setReportId(idCandidate || null)
                  setReportName(String((row as any)?.name || ''))
                  setShowTruthReport(true)
                }}
              >
                View full report →
              </button>
              <button
                className="text-[11px] px-2 py-1 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
                onClick={() => setShowRetestModal(true)}
              >
                Retest
              </button>
            </div>
          )
        })()}
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
      </div>)}
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
      {/* Shared Paywall Modal */}
      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        defaultPeriod="yearly"
        title="Your verdict is ready"
        subtitle="Unlock to see whether this supplement is working for you — plus the full analysis with effect size, confidence, and breakdown."
        backLabel="Maybe later"
      />
      {err && <div className="mt-2 text-[11px] text-rose-700">{err}</div>}
      {/* Truth Report modal (full analysis) */}
      <TruthReportModal
        isOpen={showTruthReport}
        onClose={() => setShowTruthReport(false)}
        userSupplementId={String(reportId || userSuppId)}
        supplementName={String(reportName || (row as any)?.name || '')}
      />
    </div>
  )
}

function Popup({
  title,
  body,
  cta,
  onPrimary,
  secondaryCta,
  onSecondary,
  onClose,
  variant = 'default',
  disableBackdropClose = false,
  hideCloseButton = false,
}: {
  title: string
  body: string
  cta: string
  onPrimary?: () => void
  secondaryCta?: string
  onSecondary?: () => void
  onClose: () => void
  variant?: 'default' | 'warm' | 'neutral'
  disableBackdropClose?: boolean
  hideCloseButton?: boolean
}) {
  const isWarm = variant === 'warm'
  const isNeutral = variant === 'neutral'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 ${isNeutral ? '' : 'bg-black/50'}`}
        style={isNeutral ? { backgroundColor: 'rgba(85, 81, 74, 0.45)' } : undefined}
        onClick={disableBackdropClose ? undefined : onClose}
      />
      <div
        className={
          isNeutral
            ? 'relative z-10 bg-white/95 border border-gray-200 rounded-2xl max-w-[520px] w-full p-8 sm:p-10 shadow-lg ring-1 ring-black/5'
            : 'relative z-10 w-full max-w-[480px] rounded-xl p-8 shadow-lg border'
        }
        style={
          isNeutral
            ? undefined
            : isWarm
              ? { backgroundColor: '#FDF8F3', borderColor: '#E4E1DC' }
              : { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }
        }
      >
        {!hideCloseButton ? (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        ) : null}
        <h3 className={`text-2xl font-semibold text-center ${isNeutral ? 'mb-3' : 'mb-2'}`}>{title}</h3>
        <p className={`text-base text-center whitespace-pre-line leading-relaxed ${isWarm ? 'text-[#6B4E2E]' : 'text-gray-600'}`}>{body}</p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onPrimary || onClose}
            className={
              isWarm
                ? 'w-full h-12 rounded-lg bg-[#8B5E3C] text-white text-sm font-semibold hover:opacity-95'
                : isNeutral
                  ? 'w-full h-12 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800'
                  : 'w-full h-12 rounded-lg bg-[#111111] text-white text-sm font-medium hover:opacity-95'
            }
          >
            {cta}
          </button>
          {secondaryCta ? (
            <button
              onClick={onSecondary || onClose}
              className="w-full h-11 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              {secondaryCta}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// (shared PaywallModal imported and rendered above)

function VerdictModal({ row, onClose, onRetest }: { row: any; onClose: () => void; onRetest: () => void }) {
  const name = String(row?.name || 'Supplement')
  const effectCat = String(row?.effectCategory || '').toLowerCase()
  const confidence = typeof row?.confidence === 'number' ? Math.round((row.confidence as number) * 100) : null
  const daysTested = Number(row?.daysOfData || 0)
  const daysOnClean = Number(row?.daysOnClean ?? row?.daysOn ?? 0)
  const daysOffClean = Number(row?.daysOffClean ?? row?.daysOff ?? 0)
  const monthlyCost = Number(row?.monthlyCost || 0)
  const yearly = monthlyCost > 0 ? monthlyCost * 12 : 0
  const verdictBadge = (() => {
    if (effectCat === 'works' || effectCat === 'keep') return { label: 'Positive Effect', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' }
    if (effectCat === 'no_effect' || effectCat === 'drop') return { label: 'No Clear Effect', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
    if (effectCat === 'inconsistent' || effectCat === 'negative') return { label: 'Negative Effect', cls: 'bg-rose-100 text-rose-800 border border-rose-200' }
    return { label: 'No Clear Effect', cls: 'bg-gray-100 text-gray-700 border border-gray-200' }
  })()
  const recommendation = (() => {
    if (effectCat === 'works' || effectCat === 'keep') return 'Recommended: keep taking'
    if (effectCat === 'inconsistent' || effectCat === 'negative' || effectCat === 'no_effect' || effectCat === 'drop') return 'Recommended: consider stopping'
    return 'Recommended: consider stopping'
  })()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[640px] rounded-2xl bg-white p-6 shadow-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-gray-900">{name}</div>
            <div className="mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded ${verdictBadge.cls}`}>{verdictBadge.label}</span>
              <span className="ml-2 text-sm text-gray-800">{recommendation}</span>
            </div>
          </div>
          <button className="text-sm text-gray-600 hover:text-gray-800" onClick={onClose}>Close</button>
        </div>
        {/* Analysis */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Days tested</div>
            <div className="font-semibold text-gray-900">{daysTested}</div>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Statistical confidence</div>
            <div className="font-semibold text-gray-900">{confidence != null ? `${confidence}%` : '—'}</div>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Clean ON days</div>
            <div className="font-semibold text-gray-900">{daysOnClean}</div>
          </div>
          <div className="rounded border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Clean OFF days</div>
            <div className="font-semibold text-gray-900">{daysOffClean}</div>
          </div>
        </div>
        {/* Metrics compared */}
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Metrics compared</div>
          <div className="text-sm text-gray-700">
            Detailed metric breakdown not yet available in this view. We’ll add Energy, Focus, Sleep, and Mood comparisons soon.
          </div>
        </div>
        {/* Explanation */}
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Explanation</div>
          <div className="text-sm text-gray-800">
            After {daysTested} days of testing with {daysOnClean} ON days and {daysOffClean} OFF days, we {effectCat === 'works' ? 'found a positive signal' : effectCat === 'negative' ? 'found a negative signal' : 'did not find a statistically clear difference'} when taking vs not taking this supplement.
          </div>
        </div>
        {/* Cost Impact */}
        {monthlyCost > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Cost impact</div>
            <div className="text-sm text-gray-800">
              {recommendation.includes('consider stopping')
                ? <>Stopping this supplement would save ${monthlyCost}/month ({`$${yearly}/year`}).</>
                : <>Continuing this supplement costs ${monthlyCost}/month ({`$${yearly}/year`}).</>}
            </div>
          </div>
        )}
        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <a href="/results" className="text-sm text-gray-800 underline">View in My Stack</a>
          <button
            className="text-sm px-3 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-50"
            onClick={onRetest}
          >
            Retest
          </button>
          <button
            className="text-sm px-3 py-2 rounded bg-[#111111] text-white hover:opacity-90"
            onClick={onClose}
          >
            Close
          </button>
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



