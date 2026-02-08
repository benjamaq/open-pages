'use client'

import { useEffect, useMemo, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { abbreviateSupplementName } from '@/lib/utils/abbreviate'
import EnableRemindersModal from '@/components/onboarding/EnableRemindersModal'
import { HEALTH_PRIORITIES } from '@/lib/types'

type Suggestion = { id: string; name: string }
type Row = { id: string; name: string; daysOfData: number; requiredDays: number }

export function DashboardUnifiedPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [progress, setProgress] = useState<any | null>(null)
  const [supps, setSupps] = useState<any[]>([])
  const [suppsLoaded, setSuppsLoaded] = useState(false)
  const [effects, setEffects] = useState<Record<string, any>>({})
  const [hasDaily, setHasDaily] = useState<boolean | null>(null)
  const [wearableDays, setWearableDays] = useState<number>(0)
  const [wearableStatus, setWearableStatus] = useState<any | null>(null)
  const [showBaselineHelp, setShowBaselineHelp] = useState<boolean>(false)
  const [isMember, setIsMember] = useState<boolean>(false)
  const [settings, setSettings] = useState<any | null>(null)
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false)
  const [showReminder, setShowReminder] = useState<boolean>(false)
  const [showCommitment, setShowCommitment] = useState<boolean>(false)
  const [overrideSkipNames, setOverrideSkipNames] = useState<string[] | null>(null)
  const [showUploadSuccess, setShowUploadSuccess] = useState<{ days?: number; source?: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/suggestions/dailySkip', { cache: 'no-store' })
        if (!mounted) return
        if (res.ok) {
          const j = await res.json()
          setSuggestions(Array.isArray(j?.suggestions) ? j.suggestions : [])
        } else setSuggestions([])
      } catch { setSuggestions([]) }
      try {
        const p = await fetch('/api/progress/loop', { cache: 'no-store' })
        if (!mounted) return
        if (p.ok) setProgress(await p.json())
      } catch { setProgress(null) }
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!mounted) return
        if (r.ok) setSupps(await r.json())
      } catch { setSupps([]) }
      finally {
        if (mounted) setSuppsLoaded(true)
      }
      try {
        const e = await fetch('/api/effect/summary', { cache: 'no-store' })
        if (!mounted) return
        if (e.ok) {
          const j = await e.json()
          setEffects(j?.effects || {})
        }
      } catch {}
      try {
        const d = await fetch('/api/data/has-daily', { cache: 'no-store' })
        if (!mounted) return
        if (d.ok) {
          const j = await d.json()
          setHasDaily(Boolean(j?.hasData))
          setWearableDays(Number(j?.wearableDays || 0))
        } else {
          setHasDaily(false)
        }
      } catch { setHasDaily(false) }
      // Detailed wearable status for enhanced UI
      try {
        const ws = await fetch('/api/user/wearable-status?since=all', { cache: 'no-store' })
        if (!mounted) return
        if (ws.ok) {
          const wj = await ws.json()
          setWearableStatus(wj)
        }
      } catch {}
      try {
        const pr = await fetch('/api/payments/status', { cache: 'no-store' })
        if (!mounted) return
        if (pr.ok) {
          const j = await pr.json()
          setIsMember(!!(j as any)?.is_member)
          try { console.log('isMember:', !!(j as any)?.is_member) } catch {}
        }
      } catch {}
      try {
        const s = await fetch('/api/settings', { cache: 'no-store' })
        if (!mounted) return
        if (s.ok) {
          const j = await s.json()
          setSettings(j)
          try { console.log('GET /api/settings result:', j) } catch {}
        }
        setSettingsLoaded(true)
      } catch {}
      // Load skip-name override captured at modal open (same-day)
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('biostackr_skip_names_today') : null
        if (raw) {
          const parsed = JSON.parse(raw)
          const todayStr = new Date().toISOString().split('T')[0]
          if (parsed?.date === todayStr && Array.isArray(parsed?.names) && parsed.names.length > 0) {
            setOverrideSkipNames(parsed.names as string[])
          }
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  // Show post-upload success modal only when explicitly signaled by URL
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const up = url.searchParams.get('upload')
      if (up === 'success') {
        const days = Number(url.searchParams.get('days') || '')
        const source = url.searchParams.get('source') || undefined
        setShowUploadSuccess({ days: isFinite(days) && days > 0 ? days : undefined, source })
        // Snooze reminder prompts to avoid stacking modals after upload success
        try {
          const SNOOZE_MS = 10 * 60 * 1000 // 10 minutes
          const until = Date.now() + SNOOZE_MS
          localStorage.setItem('bs_reminder_snooze_until', String(until))
          // Mark that user uploaded wearables in this session to skip education popups
          localStorage.setItem('bs_uploaded_wearables', '1')
          localStorage.setItem('bs_uploaded_at', String(Date.now()))
        } catch {}
        // Clear the flag from URL
        url.searchParams.delete('upload'); url.searchParams.delete('days'); url.searchParams.delete('source'); url.searchParams.delete('first')
        window.history.replaceState({}, '', url.toString())
      }
    } catch {}
  }, [])

  // Debug: show today's summary coming from API for Sleep verification
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[dashboard] todaySummary received:', (progress as any)?.checkins?.todaySummary)
    } catch {}
  }, [(progress as any)?.checkins?.todaySummary])

  // Derive progress stats
  const {
    progressPercent, displayedProgressPercent, streak, readyCount, buildingCount, needsDataCount, gapsDays,
    nextResult, disruptions
  } = useMemo(() => {
    const s: any = (progress?.sections) || { clearSignal: [], building: [], noSignal: [] }
    const total = (s.clearSignal?.length || 0) + (s.building?.length || 0) + (s.noSignal?.length || 0) + ((progress?.sections as any)?.inconsistent?.length || 0) + ((progress?.sections as any)?.needsData?.length || 0)
    const rows: any[] = [
      ...(s.clearSignal || []),
      ...(s.building || []),
      ...(s.noSignal || []),
      ...((progress as any)?.sections?.inconsistent || []),
      ...((progress as any)?.sections?.needsData || []),
    ]
    // Compute a collection-based progress across all rows (ON/OFF completeness),
    // rather than averaging card progress which may include near-complete "too early" states.
    const perRowCollectionPct: number[] = []
    for (const r of rows) {
      const verdictValue = String((r as any)?.verdict || '').toLowerCase()
      const cat = String((r as any)?.effectCategory || '').toLowerCase()
      const isImplicit = String(((r as any)?.analysisSource || '')).toLowerCase() === 'implicit'
      const isFinal = (!isImplicit) && (['keep','drop'].includes(verdictValue) || ['works','no_effect','no_detectable_effect'].includes(cat))
      if (isFinal) {
        perRowCollectionPct.push(100)
        continue
      }
      const reqOn = Number((r as any)?.requiredOnDays ?? (r as any)?.requiredDays ?? 14)
      const reqOff = Number((r as any)?.requiredOffDays ?? Math.min(5, Math.max(3, Math.round(((r as any)?.requiredDays ?? 14) / 4))))
      const on = Number((r as any)?.daysOnClean ?? (r as any)?.daysOn ?? 0)
      const off = Number((r as any)?.daysOffClean ?? (r as any)?.daysOff ?? 0)
      if (reqOn > 0 && reqOff > 0) {
        const onFrac = Math.max(0, Math.min(1, on / reqOn))
        const offFrac = Math.max(0, Math.min(1, off / reqOff))
        const rowPct = Math.round(((onFrac + offFrac) / 2) * 100)
        perRowCollectionPct.push(rowPct)
      } else {
        // Fallback to provided progress when requirements missing, capped below "complete"
        perRowCollectionPct.push(Math.max(0, Math.min(95, Number((r as any)?.progressPercent || 0))))
      }
    }
    const pct = perRowCollectionPct.length > 0
      ? Math.round(perRowCollectionPct.reduce((a, b) => a + b, 0) / perRowCollectionPct.length)
      : 0
    // Prefer server-computed stackProgress (uses uploadProgress for implicit rows)
    const serverPctRaw = Number((progress as any)?.stackProgress)
    const dpct = Number.isFinite(serverPctRaw) ? serverPctRaw : pct
    const building: any[] = (s.building || [])
    const needsData: any[] = (s.needsData || [])
    const scheduledSkipIds = new Set<string>(Array.isArray((progress as any)?.rotation?.action?.skip) ? (progress as any).rotation.action.skip.map((x: any) => String(x.id)) : [])
    const scheduledTakeIds = new Set<string>(Array.isArray((progress as any)?.rotation?.action?.take) ? (progress as any).rotation.action.take.map((x: any) => String(x.id)) : [])
    // Consider both Building and Needs Data (too early) for "Next result likely"
    // Only include items that have any check-in data (clean or total ON/OFF > 0)
    const nextPool = [...building, ...needsData].filter((r: any) => {
      const onClean = Number(r?.daysOnClean ?? r?.daysOn ?? 0)
      const offClean = Number(r?.daysOffClean ?? r?.daysOff ?? 0)
      return (onClean + offClean) > 0
    })
    // Pick the candidate with the highest overall progressPercent
    const nextRow: any | undefined = nextPool
      .slice()
      .sort((a: any, b: any) => Number(b?.progressPercent || 0) - Number(a?.progressPercent || 0))[0]
    const tagCounts = (progress && (progress as any).checkins && (progress as any).checkins.last30 && (progress as any).checkins.last30.tagCounts) ? (progress as any).checkins.last30.tagCounts : null
    const labelMap: Record<string, string> = {
      alcohol: 'alcohol',
      travel: 'travel / timezone change',
      poor_sleep: 'poor sleep',
      high_stress: 'high stress',
      illness: 'feeling unwell',
      intense_exercise: 'intense exercise',
    }
    const disruptionArr: Array<{ label: string; count: number }> = []
    if (tagCounts) {
      for (const [k, v] of Object.entries(tagCounts as Record<string, number>)) {
        const n = Number(v || 0)
        if (n > 0 && labelMap[k]) disruptionArr.push({ label: (labelMap as any)[k], count: n })
      }
    }
    // Compute readyCount based on ON/OFF readiness, not just effect categories
    const allRows: any[] = [
      ...(s.clearSignal || []),
      ...(s.noSignal || []),
      ...(s.inconsistent || []),
      ...(s.needsData || []),
      ...(s.building || []),
    ]
    const readyRows = allRows.filter(r => {
      const cat = String((r as any)?.effectCategory || '').toLowerCase()
      const isFinal = (cat === 'works' || cat === 'no_effect' || cat === 'no_detectable_effect')
      const on = Number((r as any).daysOnClean ?? (r as any).daysOn ?? 0)
      const off = Number((r as any).daysOffClean ?? (r as any).daysOff ?? 0)
      const reqOn = Number((r as any).requiredOnDays ?? (r as any).requiredDays ?? 14)
      const reqOff = Number((r as any).requiredOffDays ?? Math.min(5, Math.max(3, Math.round(((r as any).requiredDays ?? 14) / 4))))
      return isFinal || (on >= reqOn && off >= reqOff)
    })
    try {
      // eslint-disable-next-line no-console
      console.log('[Clarity] Ready classification sample:', readyRows.slice(0, 10).map((r: any) => ({
        id: String(r?.id || ''),
        name: String(r?.name || ''),
        analysisSource: String((r?.analysisSource || '')).toLowerCase(),
        effectCategory: String((r?.effectCategory || '')).toLowerCase(),
        daysOn: Number(r?.daysOnClean ?? r?.daysOn ?? 0),
        daysOff: Number(r?.daysOffClean ?? r?.daysOff ?? 0),
      })))
    } catch {}
    const readyCt = readyRows.length
    try {
      const readyIds = new Set<string>(readyRows.map((r: any) => String(r?.id || '')))
      // eslint-disable-next-line no-console
      console.log('[Clarity] Per-row classification', (allRows || []).map((r: any) => {
        const id = String(r?.id || '')
        return {
          id,
          name: String(r?.name || ''),
          analysisSource: String((r?.analysisSource || '')).toLowerCase(),
          effectCategory: String((r?.effectCategory || '')).toLowerCase(),
          verdict: String((r?.verdict || '')).toLowerCase(),
          daysOn: Number(r?.daysOnClean ?? r?.daysOn ?? 0),
          daysOff: Number(r?.daysOffClean ?? r?.daysOff ?? 0),
          bucket: readyIds.has(id) ? 'Ready' : 'Building'
        }
      }))
    } catch {}
    return {
      progressPercent: pct,
      displayedProgressPercent: dpct,
      streak: Number((progress as any)?.checkins?.totalDistinctDays || 0),
      gapsDays: Number((progress as any)?.checkins?.gapsDays || 0),
      readyCount: readyCt,
      // Ensure categories are mutually exclusive: Building counts only sections.building
      buildingCount: Number((s.building || []).length || 0),
      // Needs data counts only sections.needsData
      needsDataCount: Number(((progress as any)?.sections?.needsData || []).length || 0),
      nextResult: nextRow ? {
        name: nextRow?.name,
        remaining: Math.max(0, Number(nextRow?.requiredDays || 14) - Number(nextRow?.daysOfData || 0)),
        clean: Number(nextRow?.daysOfData || 0),
        req: Number(nextRow?.requiredDays || 14),
        daysOn: Number(nextRow?.daysOnClean ?? nextRow?.daysOn ?? 0),
        daysOff: Number(nextRow?.daysOffClean ?? nextRow?.daysOff ?? 0),
        reqOff: Math.min(5, Math.max(3, Math.round(Number(nextRow?.requiredDays || 14) / 4))),
        id: String(nextRow?.id || '')
      } : null,
      disruptions: disruptionArr
    }
  }, [progress, supps])

  // Day-2 reminder popup trigger
  useEffect(() => {
    try {
      if (!settingsLoaded) { setShowReminder(false); return }
      const totalDays = Number(progress?.checkins?.totalDistinctDays || 0)
      const enabled = Boolean(settings?.reminder_enabled)
      const dismissed = Boolean(settings?.reminder_popup_dismissed)
      const shouldByDay = totalDays >= 1 && !enabled && !dismissed
      // Snooze gating (avoid popping over other modals or right after uploads)
      let blockedBySnooze = false
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('bs_reminder_snooze_until') : null
        const until = raw ? Number(raw) : 0
        blockedBySnooze = Number.isFinite(until) && Date.now() < until
      } catch {}
      const blockedByOtherModal = Boolean(showUploadSuccess)
      const shouldShow = shouldByDay && !blockedBySnooze && !blockedByOtherModal
      setShowReminder(shouldShow)
      try {
        console.log('Reminder gating:', {
          totalDays,
          reminder_enabled: enabled,
          reminder_popup_dismissed: dismissed,
          blockedBySnooze,
          blockedByOtherModal,
          showReminder: shouldShow
        })
      } catch {}
    } catch {}
  }, [progress, settings, settingsLoaded, showUploadSuccess])

  // Commitment moment trigger (Day 3-5 inclusive, once)
  useEffect(() => {
    try {
      const totalDays = Number(progress?.checkins?.totalDistinctDays || 0)
      const already = Boolean(settings?.commitment_message_shown)
      const should = totalDays >= 2 && totalDays <= 4 && !already
      setShowCommitment(should)
      if (should) {
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commitment_message_shown: true })
        }).catch(() => {})
      }
    } catch {}
  }, [progress, settings])

  async function dismissReminder() {
    setShowReminder(false)
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_popup_dismissed: true })
      })
    } catch {}
  }

  async function enableReminder(payload: { time: string; timezone: string | null }) {
    setShowReminder(false)
    try {
      // 1) Request browser notification permission (user gesture)
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await Notification.requestPermission()
        }
      } catch {}
      // 2) Best-effort: register service worker and subscribe to push with VAPID (if configured)
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
          const existing = await reg.pushManager.getSubscription()
          let sub = existing
          if (!sub) {
            const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as any
            const appServerKey = vapid ? urlBase64ToUint8Array(String(vapid)) : undefined
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appServerKey })
          }
          try {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: (sub as any)?.toJSON?.() || sub })
            })
          } catch {}
        }
      } catch {}
      // 3) Persist reminder settings server-side
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_enabled: true,
          reminder_time: payload.time,
          reminder_timezone: payload.timezone,
          reminder_popup_dismissed: true
        })
      })
      const s = await fetch('/api/settings', { cache: 'no-store' })
      if (s.ok) setSettings(await s.json())
      // 4) Local confirmation or guidance
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Reminders enabled', { body: `We will nudge you daily at ${payload.time}` })
        } else if (typeof window !== 'undefined') {
          window.alert('Reminders enabled. If you don’t see notifications, enable them in your browser settings.')
        }
      } catch {}
    } catch {}
  }
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  // Economics donut + spend
  const { chartData, totalYearly, econEffectiveYear, econAwaitingYear } = useMemo(() => {
    // Build spend segments; prefer progress/loop monthlyCost when supplement lacks monthly_cost_usd
    type Acc = Record<string, number>
    const acc: Acc = {}
    let monthlyTotal = 0
    // Flatten current progress sections to map id/name -> monthlyCost from progress API
    const sec: any = (progress?.sections) || {}
    const loopRows: any[] = [
      ...(sec.clearSignal || []),
      ...(sec.noSignal || []),
      ...(sec.inconsistent || []),
      ...(sec.needsData || []),
      ...(sec.building || []),
    ]
    const costById = new Map<string, number>()
    const costByName = new Map<string, number>()
    for (const r of loopRows) {
      const id = String((r as any)?.id || '')
      const nm = String((r as any)?.name || '')
      const mc = Number((r as any)?.monthlyCost ?? 0)
      if (id) costById.set(id, mc)
      if (nm) costByName.set(nm.toLowerCase(), mc)
    }
    const normalizeKey = (k: string): string => {
      const x = String(k || '').toLowerCase()
      if (x === 'sleep_quality' || x === 'sleep') return 'sleep'
      if (x === 'stress_mood' || x === 'mood' || x === 'stress') return 'mood'
      if (x === 'energy_stamina' || x === 'energy' || x === 'stamina') return 'energy'
      if (x === 'cognitive_performance' || x === 'cognitive' || x === 'focus' || x === 'memory') return 'cognitive'
      if (x === 'gut_health' || x === 'gut' || x === 'digestion') return 'gut'
      if (x === 'longevity') return 'longevity'
      if (x === 'immunity' || x === 'immune') return 'immunity'
      if (x === 'joint_bone_health' || x === 'joint' || x === 'bone') return 'joint'
      if (x === 'athletic_performance' || x === 'athletic' || x === 'performance') return 'athletic'
      if (x === 'skin_hair_nails' || x === 'beauty' || x === 'skin' || x === 'hair' || x === 'nails') return 'beauty'
      if (!x) return 'uncategorised'
      return x
    }
    for (const s of supps) {
      const id = String((s as any)?.id || '')
      const nameLc = String(s.name || '').toLowerCase()
      const supCost = Number((s as any)?.monthly_cost_usd ?? 0)
      // prefer declared cost; else fallback to loop monthlyCost by id, then by name
      let cost = Number.isFinite(supCost) && supCost > 0 ? supCost
                : (costById.get(id) && costById.get(id)! > 0 ? costById.get(id)! 
                   : (costByName.get(nameLc) && costByName.get(nameLc)! > 0 ? costByName.get(nameLc)! : 0))
      // clamp to sane range
      cost = Math.max(0, Math.min(10000, Number(cost || 0)))
      monthlyTotal += cost
      const tags: string[] = Array.isArray((s as any).primary_goal_tags) && (s as any).primary_goal_tags.length > 0 ? (s as any).primary_goal_tags as string[] : ['uncategorised']
      // Map each supplement to exactly ONE category: choose the first declared tag (normalized)
      const primaryKey = normalizeKey(tags[0] || 'uncategorised')
      acc[primaryKey] = (acc[primaryKey] || 0) + cost
    }
    const yearly = Math.round(monthlyTotal * 12)
    const labelMap: Record<string, string> = Object.fromEntries(
      HEALTH_PRIORITIES.map(p => [p.key, p.label])
    )
    labelMap['uncategorised'] = 'Uncategorised'
    // Reinstate previous Stack Economics colors (by key)
    // Muted, warm neutral palette aligned with dashboard/landing
    const COLOR_BY_KEY: Record<string, string> = {
      uncategorised: '#B8B1AA', // stone taupe
      sleep: '#6F7F5A',         // muted olive
      cognitive: '#7A5C58',     // rose umber
      gut: '#8B5E3C',           // desaturated brown
      energy: '#B07A2A',        // burnt amber (muted)
      longevity: '#6A3F2B',     // deep umber
      immunity: '#7C766F',      // warm gray
      mood: '#8A7F78',          // muted taupe
      athletic: '#9C6644',      // clay
      joint: '#A67C52',         // saddle
      beauty: '#9E6E83',        // dusty mauve
    }
    const segments = Object.entries(acc)
      .map(([rawKey, amount]) => {
        const key = normalizeKey(rawKey)
        const display = labelMap[key] || (key.charAt(0).toUpperCase() + key.slice(1))
        const color = COLOR_BY_KEY[key] || COLOR_BY_KEY.uncategorised
        return {
          key,
          name: display,
          value: Math.round(amount * 12),
          color
        }
      })
      .sort((a, b) => b.value - a.value)
    try {
      console.log('[econ] supps:', supps.length,
        'monthlyTotal:', monthlyTotal,
        'yearly:', yearly,
        'segments:', segments.slice(0, 5))
    } catch {}
    // Effective/waste/testing (used for members only)
    try {
      console.log('[STACK-ECON-FIELDS]', (supps || []).map((i: any) => ({
        name: String(i?.name || ''),
        effectCategory: (i as any)?.effectCategory,
        verdict: (i as any)?.verdict,
        status: (i as any)?.status,
        truthStatus: (i as any)?.truthStatus,
        keys: Object.keys(i || {})
      })))
    } catch {}
    // Split the SAME header item list into effective vs awaiting using fields on the items themselves
    let effMonthlyFromHeader = 0
    let awaitingMonthlyFromHeader = 0
    for (const s of supps) {
      const id = String((s as any)?.id || '')
      const nameLc = String((s as any)?.name || '').toLowerCase()
      const supCost = Number((s as any)?.monthly_cost_usd ?? 0)
      let m = Number.isFinite(supCost) && supCost > 0 ? supCost
              : (costById.get(id) && costById.get(id)! > 0 ? costById.get(id)!
                 : (costByName.get(nameLc) && costByName.get(nameLc)! > 0 ? costByName.get(nameLc)! : 0))
      m = Math.max(0, Math.min(10000, Number(m || 0)))
      const catLower = String((s as any)?.effectCategory || '').toLowerCase()
      const verdictLower = String((s as any)?.verdict || '').toLowerCase()
      const testingStatus = String((s as any)?.testing_status || (s as any)?.status || '').toLowerCase()
      const isEffective = (catLower === 'works') || (verdictLower === 'keep') || (testingStatus === 'completed' && catLower === 'works')
      if (isEffective) effMonthlyFromHeader += m
      else awaitingMonthlyFromHeader += m
    }
    return {
      chartData: segments,
      totalYearly: yearly,
      econEffectiveYear: Math.round(effMonthlyFromHeader * 12),
      econAwaitingYear: Math.round(awaitingMonthlyFromHeader * 12),
    }
  }, [supps, progress])

  // While loading, avoid flashing the empty-state card
  if (!suppsLoaded) {
    return (
      <section className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 bg-gray-100 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-gray-100 rounded" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
        {showCommitment && (
          <div className="px-5 py-2 text-sm text-stone-500">
            From here on, missed days make verdicts less clear.
          </div>
        )}
      </section>
    )
  }

  return (
    <>
    <section className="bg-white border border-gray-200 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* TL: Today's Action (original location) */}
        <div className="p-5 border-b border-gray-100 md:border-r">
          <div className="border-2 border-gray-900 rounded-lg p-5 bg-white">
            <div className="text-xs uppercase tracking-wide text-gray-600 mb-4">Today’s action</div>
            {/* Checked-in state */}
            {progress?.checkins?.hasCheckedInToday ? (
              <>
                <div className="flex items-center justify-between text-sm text-gray-800">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-600" /> Checked in today
                  </span>
                  <a className="hover:underline" href="/dashboard?checkin=open" style={{ color: '#6A3F2B' }}>Edit</a>
                </div>
                {progress?.checkins?.todaySummary && (
                  <div className="mt-3 text-sm text-gray-700">
                    <span className="mr-4">Energy: <span className="font-medium">{progress.checkins.todaySummary.energy ?? '—'}</span></span>
                    <span className="mr-4">Focus: <span className="font-medium">{progress.checkins.todaySummary.focus ?? '—'}</span></span>
                    <span className="mr-4">Sleep: <span className="font-medium">{progress.checkins.todaySummary.sleep ?? '—'}</span></span>
                    <span>Mood: <span className="font-medium">{progress.checkins.todaySummary.mood ?? '—'}</span></span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-stretch">
                <button
                  onClick={() => { window.location.href = '/dashboard?checkin=open' }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-[#111111] px-4 py-2 text-xs sm:px-6 sm:py-3 sm:text-sm font-medium text-white whitespace-nowrap"
                >
                  Complete Today’s Check‑In →
                </button>
              </div>
            )}
            {/* Rotation instructions from /api/progress/loop */}
            {progress?.rotation && (
              <div className="mt-4 text-sm text-gray-800 space-y-2">
                {(() => {
                  const readyCt = Number(progress?.sections?.clearSignal?.length || 0) + Number(progress?.sections?.noSignal?.length || 0)
                  const testingCt = Number(progress?.sections?.building?.length || 0) + Number(progress?.sections?.needsData?.length || 0)
                  if (readyCt > 0 && testingCt === 0) {
                    return <div>All supplements tested — take your full stack as normal.</div>
                  }
                  return null
                })()}
                {progress.rotation.phase === 'baseline' ? (
                  <>
                    <div>{progress.rotation.action?.primary || 'Take your supplements as normal.'}</div>
                    {(progress.rotation.action?.secondary || progress.rotation.action?.note) && (
                      <div className="text-xs text-gray-600">{progress.rotation.action?.secondary || progress.rotation.action?.note}</div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Take count: hide when all completed */}
                    {(() => {
                      const readyCt = Number(progress?.sections?.clearSignal?.length || 0) + Number(progress?.sections?.noSignal?.length || 0)
                      const testingCt = Number(progress?.sections?.building?.length || 0) + Number(progress?.sections?.needsData?.length || 0)
                      if (readyCt > 0 && testingCt === 0) return null
                      const cnt = Array.isArray(progress.rotation.action?.take) ? progress.rotation.action.take.length : 0
                      return (
                        <div className="font-medium">
                          Take as normal: {cnt} {cnt === 1 ? 'supplement' : 'supplements'}
                        </div>
                      )
                    })()}
                    {/* Skip list */}
                    {(() => {
                      // Only show "Scheduled OFF" in active rotation phase, or when API reports actual OFF taken today.
                      const phase = String((progress as any)?.rotation?.phase || '')
                      const apiToday = (progress as any)?.checkins?.todaySkippedNames
                      const apiNames: string[] = Array.isArray(apiToday) ? apiToday as string[] : []
                      if (apiNames.length > 0) {
                        return (
                          <div>
                            <div className="font-medium">Scheduled OFF today ({apiNames.length}):</div>
                            <ul className="mt-1 list-disc list-inside">
                              {apiNames.map((nm: string) => (
                                <li key={nm}>{abbreviateSupplementName(String(nm || ''))}</li>
                              ))}
                            </ul>
                          </div>
                        )
                      }
                      if (phase !== 'rotation') return null
                      let names: string[] = []
                      if (Array.isArray((progress as any)?.rotation?.action?.skip)) {
                        names = ((progress as any).rotation.action.skip as Array<{ id: string; name: string }>).map(x => String(x.name || ''))
                      }
                      return names.length > 0 ? (
                        <div>
                          <div className="font-medium">Scheduled OFF today ({names.length}):</div>
                          <ul className="mt-1 list-disc list-inside">
                            {names.map((nm: string) => (
                              <li key={nm}>{abbreviateSupplementName(String(nm || ''))}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    })()}
                    {/* Reason */}
                    {(
                      <div className="text-xs text-gray-600">This helps isolate which supplements are actually driving changes.</div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* TR: Next Result */}
        <div
          className="p-5 border-b rounded-tr-lg"
          style={{ backgroundColor: '#F6F5F3', borderColor: '#E4E1DC', borderStyle: 'solid', borderWidth: '1px 0 1px 0' }}
        >
          <div className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#55514A' }}>Next result likely</div>
          {(() => {
            // Clear, state-driven copy for Next Result Likely
            const buildingLen = Number(progress?.sections?.building?.length || 0)
            const needsLen = Number(progress?.sections?.needsData?.length || 0)
            const readyLen = Number(progress?.sections?.clearSignal?.length || 0) + Number(progress?.sections?.noSignal?.length || 0)
            const totalLen = readyLen + buildingLen + needsLen + Number((progress as any)?.sections?.inconsistent?.length || 0)
            const hasCheckinCandidate = (() => {
              const pool = [
                ...((progress?.sections?.building) || []),
                ...((progress?.sections?.needsData) || [])
              ]
              for (const r of pool as any[]) {
                const on = Number((r as any)?.daysOnClean ?? (r as any)?.daysOn ?? 0)
                const off = Number((r as any)?.daysOffClean ?? (r as any)?.daysOff ?? 0)
                if ((on + off) > 0) return true
              }
              return false
            })()
            if (!nextResult && ((buildingLen + needsLen) === 0 || !hasCheckinCandidate)) {
              // If no active testing items, prefer a gentle nudge for upload-only scenarios
              const all: any[] = [
                ...((progress?.sections?.clearSignal) || []),
                ...((progress?.sections?.noSignal) || []),
                ...((progress?.sections?.building) || []),
                ...(((progress as any)?.sections?.inconsistent) || []),
                ...(((progress as any)?.sections?.needsData) || [])
              ]
              const allImplicit = all.length > 0 && all.every((r: any) => String((r as any)?.analysisSource || '').toLowerCase() === 'implicit')
              if (readyLen > 0 && readyLen === totalLen) {
                return <div className="text-sm text-gray-700">All results are in ✓</div>
              }
              return <div className="text-sm text-gray-700">{allImplicit ? 'Start daily check-ins to confirm your results' : 'All supplements analyzed'}</div>
            }
            if (!nextResult) {
              return <div className="text-sm text-gray-700">—</div>
            }
            const title = <div className="text-base font-semibold text-gray-900">{abbreviateSupplementName(String(nextResult.name || ''))}</div>
            const onClean = Math.max(0, Number((nextResult as any).daysOnClean ?? nextResult.daysOn ?? 0))
            const reqOn = Math.max(0, Number(nextResult.req || 0))
            const offClean = Math.max(0, Number((nextResult as any).daysOffClean ?? nextResult.daysOff ?? 0))
            const reqOff = Math.max(0, Number(nextResult.reqOff || 0))
            // Compute total ON/OFF (may include noisy days)
            const onTotal = Math.max(0, Number((nextResult as any).daysOn ?? 0))
            const offTotal = Math.max(0, Number((nextResult as any).daysOff ?? 0))
            const noisyOn = Math.max(0, onTotal - onClean)
            const noisyOff = Math.max(0, offTotal - offClean)
            const onMet = onClean >= reqOn
            const offMet = offClean >= reqOff
            const bothProgressing = onClean > 0 && offClean > 0
            const needOn = Math.max(0, reqOn - onClean)
            const needOff = Math.max(0, reqOff - offClean)
            const daysToGo = Math.max(0, Math.max(needOn, needOff))

            let headline: string = ''
            let guidance: string | null = null
            let ready: boolean = false

            if (onMet && offMet) {
              // State E — Ready
              headline = 'Ready now'
              ready = true
            } else if (onMet && !offMet) {
              // State B — Blocked by OFF days
              headline = 'Waiting for OFF days'
              guidance = noisyOff > 0
                ? 'Recent OFF days had disruptions, so they aren’t usable for comparison. Skip this supplement on a calm day to complete the test.'
                : 'Need more clean OFF days to complete the comparison.'
            } else if (!onMet && offMet) {
              // State C — Blocked by ON days
              headline = 'Waiting for ON days'
              guidance = noisyOn > 0
                ? 'Recent ON days had disruptions, so they aren’t usable for comparison. Take this supplement on a calm day to build data.'
                : 'Need more clean ON days to build a usable comparison.'
            } else if (!onMet && !offMet && bothProgressing) {
              // State A — Building normally (estimate)
              headline = daysToGo > 0 ? `~${daysToGo} clean ${daysToGo === 1 ? 'day' : 'days'} to go` : 'Building data'
              guidance = 'Keep checking in — you’re almost there.'
            } else {
              // State D — Both blocked early
              headline = 'Building data'
              guidance = 'Need more clean days — both on and off this supplement. Disruption‑free days count toward your result.'
            }

            return (
              <div>
                {title}
                <div className="mt-1">
                  <div className="text-sm font-medium text-gray-900">{headline}</div>
                </div>
                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <div>
                    Clean ON days: <span className="font-medium">{onMet ? `${onClean}` : `${onClean} of ${reqOn}`}</span> {!onMet ? `(need ${needOn} more)` : '✓'}
                  </div>
                  <div>
                    Clean OFF days: <span className="font-medium">{offMet ? `${offClean}` : `${offClean} of ${reqOff}`}</span> {offMet ? '✓' : `(need ${needOff} more)`}
                  </div>
                </div>
                {ready ? (
                  <div className="mt-3">
                    <button
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
                      className="text-sm text-gray-700 hover:underline"
                    >
                      View verdict →
                    </button>
                  </div>
                ) : (
                  guidance && <div className="mt-3 text-xs text-gray-600">{guidance}</div>
                )}
              </div>
            )
          })()}
        </div>
        {/* BL: Progress */}
        <div className="p-6 md:border-r border-gray-100">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-4">Clarity</div>
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{displayedProgressPercent}%</span>
          </div>
          <div className="w-full">
            <Progress value={isMember ? displayedProgressPercent : Math.min(displayedProgressPercent, 90)} className="h-2 w-full" />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {displayedProgressPercent >= 100
              ? 'Analysis complete.'
              : (Number(wearableStatus?.wearable_days_imported || 0) >= 30
                  ? 'Based on imported wearable data — check-ins will increase confidence.'
                  : (wearableDays > 0 ? 'Enhanced signal • Wearables + check-ins' : 'Based on clean days collected across your supplements.'))}
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Days tracked</span>
              <span className="font-medium">
                {Number(wearableStatus?.wearable_days_imported || 0) >= 30
                  ? Math.max(
                      Number(wearableStatus?.wearable_days_imported || 0),
                      Number(
                        (wearableStatus as any)?.total_unique_days ??
                        (Number(wearableStatus?.wearable_unique_days || 0) + Number(wearableStatus?.checkin_days || 0))
                      ) || 0
                    )
                  : streak}
              </span>
            </div>
            {Number(wearableStatus?.wearable_days_imported || 0) >= 30 && (
              <>
                <div className="flex items-center justify-between text-sm pl-4">
                  <span className="text-gray-500">└─ from wearables</span>
                  <span className="font-medium">
                    {Number(wearableStatus?.checkin_days || 0) === 0
                      ? Number(wearableStatus?.wearable_days_imported ?? wearableStatus?.wearable_unique_days ?? 0)
                      : Number(wearableStatus?.wearable_unique_days ?? wearableStatus?.wearable_days_imported ?? 0)}
                  </span>
                </div>
                {Number(wearableStatus?.checkin_days || 0) > 0 && (
                  <div className="flex items-center justify-between text-sm pl-4">
                    <span className="text-gray-500">└─ from check-ins</span>
                    <span className="font-medium">{Number(wearableStatus?.checkin_days || 0)}</span>
                  </div>
                )}
              </>
            )}
            {(Number(wearableStatus?.checkin_days || 0) >= 7) && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Gaps (missed days)</span>
                <span className="font-medium">{gapsDays}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Ready</span>
              <span className="font-medium">{readyCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Building</span>
              <span className="font-medium">{buildingCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Needs data</span>
              <span className="font-medium">{needsDataCount}</span>
            </div>
        </div>
          {Array.isArray(disruptions) && disruptions.length > 0 && (
            <div className="mt-6">
              <div className="text-[12px] font-medium uppercase tracking-wide text-gray-500">Recent disruptions (last 30 days)</div>
              <ul className="mt-2 text-sm grid grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                {disruptions.slice(0, 6).map((d, i) => (
                  <li key={i} className="truncate">{d.count}× {d.label}</li>
                ))}
                {disruptions.length > 6 && <li className="text-gray-500">+{disruptions.length - 6} more</li>}
              </ul>
            </div>
          )}
        </div>
        {/* BR: Stack Economics */}
        <div className="p-6">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Stack economics</div>
          <div className="text-sm text-gray-800 mb-4">
            <span className="font-medium">${(totalYearly || 0).toLocaleString()}/yr</span> • {supps.length} supplements
          </div>
          {/* Chart + Legend Row */}
          <div className="flex items-start gap-4 sm:gap-8 mb-5">
            {/* Donut Chart */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={28} outerRadius={40} paddingAngle={2}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(entry as any).color || '#A8A29E'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend - Vertical Stack */}
            <div className="space-y-2 text-xs sm:text-sm w-full">
              {chartData.slice(0, 8).map((seg, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: (seg as any).color || '#94a3b8' }} />
                    <span className="text-gray-600 truncate">{(seg as any).name}</span>
                  </div>
                  <span className="font-medium text-right sm:text-left sm:mt-0 mt-0.5">${Number((seg as any).value || 0).toLocaleString()}/yr</span>
                </div>
              ))}
            </div>
          </div>
          {/* Summary */}
          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-800 mb-2">
              <span className="font-medium">${(econEffectiveYear || 0).toLocaleString()}/yr</span> effective
              {' • '}
              <span className="text-gray-600">${(econAwaitingYear || 0).toLocaleString()}/yr</span> awaiting clarity
            </div>
            <a href="/results" className="text-sm hover:underline" style={{ color: '#6A3F2B' }}>
              View My Stack →
            </a>
          </div>
        </div>
      </div>
      {/* Baseline bar inside the same container, spanning both columns */}
      <div className="p-6 md:col-span-2 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">YOUR BASELINE</div>
          <div className="text-[11px] text-gray-600 border border-gray-300 rounded-full px-2 py-0.5"> 
            {Number(wearableStatus?.wearable_days_imported || 0) >= 30 ? 'Enhanced' : 'Basic'}
          </div>
        </div>
        {Number(wearableStatus?.wearable_days_imported || 0) >= 30 ? (
          <>
            <div className="text-sm text-gray-800">
              Head start: <span className="font-medium">{Number(wearableStatus?.wearable_days_imported || 0)}</span> {Number(wearableStatus?.wearable_days_imported || 0) === 1 ? 'usable day' : 'usable days'} imported
              {Array.isArray(wearableStatus?.wearable_sources) && wearableStatus.wearable_sources.length > 0 && (() => {
                const clean = (wearableStatus.wearable_sources as string[]).filter((s: string) => String(s || '').toLowerCase() !== 'wearable')
                return clean.length > 0 ? (<span className="text-gray-600"> ({clean.join(' + ')})</span>) : null
              })()}
            </div>
            {wearableStatus?.wearable_date_range_start && wearableStatus?.wearable_date_range_end && (
              <div className="mt-1 text-sm text-gray-800">
                Date range (all time): {new Date(wearableStatus.wearable_date_range_start).toLocaleString(undefined, { month: 'short', year: 'numeric' })} – {new Date(wearableStatus.wearable_date_range_end).toLocaleString(undefined, { month: 'short', year: 'numeric' })}
              </div>
            )}
            {wearableStatus?.wearable_last_upload_at && (
              <div className="mt-1 text-xs text-gray-600">
                Last synced: {new Date(wearableStatus.wearable_last_upload_at).toLocaleString()}
              </div>
            )}
            <div className="mt-4 text-sm text-gray-500 italic">
              Combined with your daily check-ins, this increases confidence across all results.
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-800">
              Built from daily check-ins • {Math.max(0, Number(progress?.checkins?.last30?.clean || 0))} {Number(progress?.checkins?.last30?.clean || 0) === 1 ? 'clean day' : 'clean days'} collected
            </div>
            <div className="mt-4 text-sm text-gray-500 italic">
              Results compare supplement ON vs OFF days against this baseline. More clean days increase confidence.
            </div>
          </>
        )}
      </div>
    </section>
    {/* Post-upload success modal (explicitly triggered via ?upload=success) */}
    {showUploadSuccess && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowUploadSuccess(null)} />
        <div className="relative z-10 w-full max-w-[520px] rounded-xl bg-white p-6 sm:p-8 border border-gray-200">
          <div className="text-xl sm:text-2xl font-semibold text-center">Baseline enhanced</div>
          <div className="mt-2 text-center text-sm text-gray-700">
            {(() => {
              const days = showUploadSuccess.days ?? Number(wearableStatus?.wearable_days_imported || 0)
              const src = showUploadSuccess.source || (Array.isArray(wearableStatus?.wearable_sources) && wearableStatus!.wearable_sources.length > 0 ? wearableStatus!.wearable_sources[0] : undefined)
              return `${days} ${days === 1 ? 'day' : 'days'} of usable health data imported${src ? ` from ${src}` : ''}.`
            })()}
          </div>
          <div className="mt-4 text-sm text-gray-800 space-y-3">
            <p>
              This data is used to strengthen your baseline — the reference point we compare against when supplements are ON vs OFF.
            </p>
            <p>
              Where available, objective metrics (such as sleep and resting heart rate) are used to help separate real effects from day‑to‑day noise.
            </p>
            <p>
              This improves confidence and can reduce the time needed to reach clear results.
            </p>
          </div>
            <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => setShowUploadSuccess(null)}
                className="inline-flex items-center justify-center h-10 rounded-lg bg-gray-900 text-white px-4 leading-none hover:opacity-90"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    )}
    <EnableRemindersModal isOpen={showReminder} onClose={dismissReminder} />
    </>
  )
}


