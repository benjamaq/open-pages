import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { statusToCategory } from '@/lib/verdictMapping'
import { persistTruthReportSingle } from '@/lib/truth/persistTruthReportSingle'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'
import { normalizeTruthStatus } from '@/lib/verdictLabels'
import { isProActive } from '@/lib/entitlements/pro'

// Bump this when dashboard_cache payload shape/semantics change, to force recompute.
const DASHBOARD_CACHE_VERSION = 1

  type SupplementProgress = {
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
}

export async function GET(request: Request) {
  const VERBOSE = process.env.NEXT_PUBLIC_VERBOSE_LOGS === '1'
  if (VERBOSE) console.log('[progress/loop] === V2 CODE RUNNING ===')
  if (VERBOSE) console.log('[progress/loop] === START ===')
  try {
    // Optional deep intake debug for a specific user_supplement id
    let debugSuppId: string | null = null
    let forceNoCache = false
    let dbg = false
    try {
      const url = new URL(request.url)
      debugSuppId = url.searchParams.get('debugSuppId') || url.searchParams.get('dbg') || url.searchParams.get('supp')
      dbg = url.searchParams.get('dbg') === '1' || url.searchParams.get('debug') === '1'
      // Server-side cache bypass:
      // - nocache=1 (explicit)
      // - force=1 (legacy)
      // - __bust=<ts> (client refresh path)
      // Note: __bust is intentionally not persisted; it's only a "do not serve cached payload" signal.
      forceNoCache =
        url.searchParams.get('nocache') === '1' ||
        url.searchParams.get('force') === '1' ||
        url.searchParams.has('__bust') ||
        url.searchParams.has('_bust')
    } catch {}
    const TRACE_BUCKETS = Boolean(debugSuppId)
    if (dbg) forceNoCache = true
    // Attach rotation selection debug in response for easier inspection
    let rotationDebug: { chosenCategory?: string; categoryIndex?: number; top5?: any[] } = {}
    const debugTrace: any = dbg ? { steps: [] as any[] } : null
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (VERBOSE) { try { console.log('[progress/loop] user:', user.id) } catch {} }
    if (dbg) {
      try { console.log('[dbg] start', { userId: user.id, url: request.url }) } catch {}
      try { debugTrace.steps.push({ step: 'start', userId: user.id }) } catch {}
    }

    // Resolve profile (auto-create minimal if missing)
    // IMPORTANT: Some users can have duplicate profiles (historical bug/flows).
    // The dashboard reads stack_items by profile_id, so picking the wrong profile can make the dashboard look empty.
    // We pick the profile that owns the most stack_items (tie-break: newest created_at).
    let profile: any = null
    const { data: profilesRows, error: pErr } = await supabase
      .from('profiles')
      .select('id,tier,pro_expires_at,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (profilesRows && profilesRows.length > 0) {
      if (profilesRows.length === 1) {
        profile = profilesRows[0]
      } else {
        let best = profilesRows[0]
        let bestCount = -1
        for (const p of profilesRows) {
          try {
            const { count } = await supabaseAdmin
              .from('stack_items')
              .select('id', { count: 'exact', head: true })
              .eq('profile_id', (p as any).id)
            const c = Number(count || 0)
            if (c > bestCount) {
              bestCount = c
              best = p
            }
          } catch {}
        }
        profile = best
        try {
          console.log('[progress/loop] multiple profiles detected; selected profile for dashboard:', {
            userId: user.id,
            pickedProfileId: (profile as any)?.id || null,
            pickedCount: bestCount,
            candidates: (profilesRows || []).map((p: any) => ({ id: p.id, created_at: p.created_at }))
          })
        } catch {}
      }
    }
    if (!profile) {
      // Attempt to create a minimal profile so new accounts don't 404
      try {
        const guessName = (user.email || '').split('@')[0] || 'You'
        const { data: created, error: createErr } = await (supabase as any)
          .from('profiles')
          .insert({ 
            user_id: user.id, 
            display_name: guessName,
            slug: user.id.slice(0, 8) + '-' + Date.now()
          })
          .select('id')
          .maybeSingle()
        if (createErr) {
          // eslint-disable-next-line no-console
          console.error('[progress/loop] profile insert failed:', createErr.message)
        }
      } catch {}
    }
    // Admin fallback read if user client could not see the profile (RLS/race)
    let profileId: string | null = (profile as any)?.id ?? null
    if (!profileId) {
      try {
        const { data: adminProfile } = await supabaseAdmin
          .from('profiles')
          .select('id,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (adminProfile) profileId = (adminProfile as any).id
      } catch {}
    }

    if (dbg) {
      try { console.log('[dbg] profileId', { userId: user.id, profileId }) } catch {}
      try { debugTrace.steps.push({ step: 'profile', profileId }) } catch {}
    }

    // If profile is still missing, return a safe empty payload instead of crashing
    if (!profileId) {
      const emptyTagCounts = {
        alcohol: 0,
        travel: 0,
        high_stress: 0,
        poor_sleep: 0,
        illness: 0,
        intense_exercise: 0,
      }
      return NextResponse.json({
        debug: {
          userId: user.id,
          profileMissing: true,
          totalDailyEntries: 0,
          cleanDatesCount: 0,
          cleanDates: [],
          supplementStartDates: {},
          queryTable: 'user_supplement',
          supplementsFound: 0,
          supplementQueryError: null
        },
        todaysProgress: {
          streakDays: 0,
          improved: [],
          almostReady: [],
          phase: getPhaseLabel(0)
        },
        checkins: {
          totalDistinctDays: 0,
          hasCheckedInToday: false,
          todaySummary: null,
          last30: { total: 0, noise: 0, clean: 0, tagCounts: emptyTagCounts },
          last7: { total: 0, noise: 0, clean: 0, tagCounts: emptyTagCounts }
        },
        sections: {
          clearSignal: [],
          noSignal: [],
          inconsistent: [],
          building: [],
          needsData: []
        }
      })
    }

    // Cache: serve cached dashboard if available and not invalidated (unless force bypassed)
    try {
      if (!forceNoCache) {
        const { data: cached } = await (supabase as any)
          .from('dashboard_cache')
          .select('payload, computed_at, invalidated_at')
          .eq('user_id', user.id)
          .maybeSingle()
        const cachedV = (() => { try { return Number((cached as any)?.payload?._v ?? 0) } catch { return 0 } })()
        const versionOk = cachedV === DASHBOARD_CACHE_VERSION
        if (cached && versionOk && ( !cached.invalidated_at || new Date(cached.computed_at).getTime() > new Date(cached.invalidated_at).getTime())) {
          // Safety: if new supplements were added after the cache was computed, don't serve stale cache.
          // This prevents newly created user_supplement rows from being invisible on Dashboard until a manual invalidate.
          let cacheStaleDueToNewSupp = false
          try {
            const computedAtMs = new Date(cached.computed_at).getTime()
            if (Number.isFinite(computedAtMs) && computedAtMs > 0) {
              const { data: latestSupp } = await supabase
                .from('user_supplement')
                .select('created_at')
                .eq('user_id', user.id)
                .or('is_active.eq.true,is_active.is.null')
                .order('created_at', { ascending: false })
                .limit(1)
              const latestCreated = (latestSupp && latestSupp[0] && (latestSupp[0] as any).created_at) ? new Date((latestSupp[0] as any).created_at).getTime() : 0
              if (latestCreated && latestCreated > computedAtMs) {
                cacheStaleDueToNewSupp = true
              }
            }
          } catch {}
          if (!cacheStaleDueToNewSupp) {
            if (dbg) {
              try { console.log('[dbg] cache-hit', { computed_at: cached.computed_at }) } catch {}
              try { debugTrace.steps.push({ step: 'cache', hit: true, computed_at: cached.computed_at }) } catch {}
            }
            try { console.log('CACHE HIT', { computed_at: cached.computed_at }) } catch {}
            return new NextResponse(JSON.stringify(cached.payload), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
              }
            })
          }
          try { console.log('CACHE MISS (new supplement added)') } catch {}
        } else {
          try { console.log('CACHE MISS', { versionOk, cachedV, expectedV: DASHBOARD_CACHE_VERSION }) } catch {}
        }
      } else {
        try { console.log('CACHE BYPASS', { reason: 'query', nocache: true }) } catch {}
        if (dbg) {
          try { debugTrace.steps.push({ step: 'cache', hit: false, bypass: true }) } catch {}
        }
      }
    } catch (e) { try { console.log('[dashboard_cache] read error (ignored):', (e as any)?.message || e) } catch {} }

    // Active stack items (supplements)
    let queryTable = 'stack_items'
    let lastQueryError: string | null = null
    let items: any[] | null = null
    let iErr: any = null
    if (profileId) {
      const res = await supabase
        .from('stack_items')
        .select('id,name,start_date,monthly_cost,created_at,category,user_supplement_id')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true })
      items = res.data as any[] | null
      iErr = res.error
      if (iErr) {
        lastQueryError = iErr.message
      }
      if (dbg) {
        try { console.log('[dbg] stack_items', { profileId, count: (items || []).length, error: iErr?.message || null }) } catch {}
        try { debugTrace.steps.push({ step: 'stack_items', profileId, count: (items || []).length, error: iErr?.message || null }) } catch {}
      }
      // Union in active user_supplement rows that are not represented in stack_items to avoid missing cards
      try {
        const haveIds = new Set<string>((items || []).map((it: any) => String((it?.user_supplement_id || ''))).filter(Boolean))
        const { data: usActive } = await supabase
          .from('user_supplement')
          .select('id,name,inferred_start_at,created_at,monthly_cost_usd,is_active')
          .eq('user_id', user.id)
          .or('is_active.eq.true,is_active.is.null')
        const extras = (usActive || [])
          .filter((u: any) => !haveIds.has(String(u.id)))
          .map((u: any) => ({
            id: String(u.id), // treat as a row id; we will map to user_supplement_id below
            name: u.name,
            inferred_start_at: u.inferred_start_at || u.created_at,
            created_at: u.created_at,
            monthly_cost: u.monthly_cost_usd,
            user_supplement_id: String(u.id),
            category: null,
          }))
        if (extras.length > 0) {
          items = [...(items || []), ...extras]
          if (VERBOSE) { try { console.log('[progress/loop] unioned user_supplement extras:', extras.map((e: any) => e.id)) } catch {} }
        }
        if (dbg) {
          try { console.log('[dbg] union_extras', { extras: extras.length, after: (items || []).length }) } catch {}
          try { debugTrace.steps.push({ step: 'union_extras', extras: extras.length, after: (items || []).length }) } catch {}
        }
      } catch {}
    }
    // Fallback: some accounts only have user_supplement rows
    if (!items || items.length === 0) {
      queryTable = 'user_supplement'
      const { data: us } = await supabase
        .from('user_supplement')
        .select('id,name,inferred_start_at,created_at,monthly_cost_usd')
        .eq('user_id', user.id)
        .or('is_active.eq.true,is_active.is.null')
        .order('created_at', { ascending: true })
      items = (us || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        inferred_start_at: r.inferred_start_at || r.created_at,
        created_at: r.created_at,
        monthly_cost: r.monthly_cost_usd
      }))
      if (dbg) {
        try { console.log('[dbg] fallback user_supplement items', { count: (items || []).length }) } catch {}
        try { debugTrace.steps.push({ step: 'fallback_user_supplement', count: (items || []).length }) } catch {}
      }
    }

    // Debug: show exactly what items the dashboard is building cards from.
    // This is the fastest way to catch "missing supplement" issues (Issue 1).
    if (TRACE_BUCKETS) {
      try {
        console.log('[progress/loop][TRACE] items source:', {
          queryTable,
          count: (items || []).length,
          sample: (items || []).slice(0, 40).map((it: any) => ({
            id: String(it?.id || ''),
            user_supplement_id: String(it?.user_supplement_id || ''),
            name: String(it?.name || ''),
          }))
        })
      } catch {}
    }

    // Distinct check-in days (read directly from checkin table)
    const { data: checkins } = await supabase
      .from('checkin')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const todayKey = new Date().toISOString().slice(0,10)
    const getDayKey = (r: any) => {
      if (r?.day) return String(r.day).slice(0,10)
      if (r?.created_at) {
        try {
          const d = new Date(r.created_at)
          if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10)
        } catch {}
      }
      return ''
    }
    const distinctCheckinDays = new Set<string>((checkins || []).map((c: any) => getDayKey(c)).filter(Boolean))
    let hasCheckedInToday = false
    let todaySummary: { mood?: number; energy?: number; focus?: number; sleep?: number } | null = null

    // Pattern insights to detect ready/no_signal and effect direction
    const { data: insights } = await supabase
      .from('pattern_insights')
      .select('intervention_id,effect_size,confidence_score,status')
      .eq('profile_id', profileId)

    const insightsById = new Map<string, { effect: number; conf: number; status: string }>()
    for (const r of insights || []) {
      insightsById.set((r as any).intervention_id, {
        effect: Number((r as any).effect_size || 0),
        conf: Number((r as any).confidence_score || 0),
        status: String((r as any).status || 'inconclusive')
      })
    }

    // Noise heuristic: count days with noise tags
    const since30 = new Date()
    since30.setDate(since30.getDate() - 30)
    const { data: entries } = await supabase
      .from('daily_entries')
      .select('local_date,tags')
      .eq('user_id', user.id)
      .gte('local_date', since30.toISOString().slice(0,10))

    const NOISE_TAGS = new Set(['alcohol','travel','high_stress','illness','poor_sleep','intense_exercise','new_supplement'])
    let noiseEvents = 0
    for (const e of entries || []) {
      const tags: string[] = Array.isArray((e as any).tags) ? (e as any).tags : []
      if (tags.some(t => NOISE_TAGS.has(String(t).toLowerCase()))) noiseEvents++
    }
    const totalLast30 = (entries || []).length
    const cleanLast30 = Math.max(0, totalLast30 - noiseEvents)
    // Last 7 days
    const since7 = new Date()
    since7.setDate(since7.getDate() - 7)
    const { data: entries7 } = await supabase
      .from('daily_entries')
      .select('local_date,tags')
      .eq('user_id', user.id)
      .gte('local_date', since7.toISOString().slice(0,10))
    let noiseEvents7 = 0
    const TAGS_MAP: Record<string, string> = {
      alcohol: 'alcohol',
      travel: 'travel',
      high_stress: 'high_stress',
      poor_sleep: 'poor_sleep',
      illness: 'illness',
      intense_exercise: 'intense_exercise',
    }
    const tagCountsLast30: Record<string, number> = {
      alcohol: 0,
      travel: 0,
      high_stress: 0,
      poor_sleep: 0,
      illness: 0,
      intense_exercise: 0,
    }
    const tagCountsLast7: Record<string, number> = {
      alcohol: 0,
      travel: 0,
      high_stress: 0,
      poor_sleep: 0,
      illness: 0,
      intense_exercise: 0,
    }
    for (const e of entries || []) {
      const tags: string[] = Array.isArray((e as any).tags) ? (e as any).tags : []
      for (const t of tags) {
        const k = String(t).toLowerCase()
        if (TAGS_MAP[k] != null) {
          tagCountsLast30[TAGS_MAP[k]] = (tagCountsLast30[TAGS_MAP[k]] || 0) + 1
        }
      }
    }
    for (const e of entries7 || []) {
      const tags: string[] = Array.isArray((e as any).tags) ? (e as any).tags : []
      if (tags.some(t => NOISE_TAGS.has(String(t).toLowerCase()))) noiseEvents7++
      for (const t of tags) {
        const k = String(t).toLowerCase()
        if (TAGS_MAP[k] != null) {
          tagCountsLast7[TAGS_MAP[k]] = (tagCountsLast7[TAGS_MAP[k]] || 0) + 1
        }
      }
    }
    const totalLast7 = (entries7 || []).length
    const cleanLast7 = Math.max(0, totalLast7 - noiseEvents7)

    // Total distinct check-in days (last 365) from daily_entries
    const since365 = new Date()
    since365.setDate(since365.getDate() - 365)
    const { data: entries365 } = await supabase
      .from('daily_entries')
      .select('local_date,mood,energy,focus,sleep_quality,tags,wearables,skipped_supplements,supplement_intake')
      .eq('user_id', user.id)
      .gte('local_date', since365.toISOString().slice(0,10))
    const allEntryDatesSet = new Set<string>((entries365 || []).map((e: any) => String(e.local_date).slice(0,10)))
    const totalDistinctDaysFromEntries = allEntryDatesSet.size
    if (VERBOSE) {
      try {
        console.log('[progress/loop] user:', user.id, 'entries365:', (entries365 || []).length, 'distinctDates:', totalDistinctDaysFromEntries)
      } catch {}
    }
    const sortedAllDates = Array.from(allEntryDatesSet).sort()
    const firstCheckin = sortedAllDates.length > 0 ? sortedAllDates[0] : null
    const latestCheckin = sortedAllDates.length > 0 ? sortedAllDates[sortedAllDates.length - 1] : null
    let cleanDatesSet = new Set<string>(
      (entries365 || [])
        .filter((e: any) => {
          const tags: string[] = Array.isArray((e as any).tags) ? (e as any).tags : []
          return !tags.some(t => NOISE_TAGS.has(String(t).toLowerCase()))
        })
        .map((e: any) => String(e.local_date).slice(0,10))
    )
    const earliestEntryDate = (() => {
      const dates = Array.from(allEntryDatesSet).sort()
      return dates.length > 0 ? dates[0] : null
    })()
    const toTs = (d: string) => {
      try { return new Date(`${d}T00:00:00Z`).getTime() } catch { return NaN }
    }

    // Fallback: if no daily_entries exist yet, derive cleanDatesSet from distinct check-in days
    if (cleanDatesSet.size === 0 && distinctCheckinDays.size > 0) {
      cleanDatesSet = new Set(Array.from(distinctCheckinDays))
    }
    // Determine if user actually has a daily entry for today (authoritative for "checked in")
    const hasTodayEntry = allEntryDatesSet.has(todayKey)
    if (hasTodayEntry) {
      hasCheckedInToday = true
      try {
        const te = (entries365 || []).find((e: any) => String((e as any).local_date).slice(0,10) === todayKey)
        if (VERBOSE) { try { console.log('[DEBUG] Path 1: daily_entries te.sleep_quality=', (te as any)?.sleep_quality) } catch {} }
        if (te) {
          todaySummary = {
            mood: (te as any).mood ?? undefined,
            energy: (te as any).energy ?? undefined,
            focus: (te as any).focus ?? undefined,
            sleep: (te as any).sleep_quality ?? (te as any).sleep ?? undefined
          }
          if (VERBOSE) { try { console.log('[progress/loop] todaySummary (daily_entries):', todaySummary) } catch {} }
        }
      } catch {}
    } else {
      // No daily_entries for today → fall back to checkin table for today's summary
      hasCheckedInToday = distinctCheckinDays.has(todayKey)
      if (hasCheckedInToday) {
        const todayRow = (checkins || []).find((c: any) => getDayKey(c) === todayKey)
        if (VERBOSE) { try { console.log('[DEBUG] Path 2: checkin todayRow.sleep_quality=', (todayRow as any)?.sleep_quality) } catch {} }
        if (todayRow) {
          todaySummary = {
            mood: (todayRow as any).mood ?? undefined,
            energy: (todayRow as any).energy ?? undefined,
            focus: (todayRow as any).focus ?? undefined,
            // Prefer sleep_quality; fallback to sleep
            sleep: (todayRow as any).sleep_quality ?? (todayRow as any).sleep ?? undefined
          }
          if (VERBOSE) { try { console.log('[progress/loop] todaySummary (checkin):', todaySummary) } catch {} }
        }
      } else {
        hasCheckedInToday = false
      }
    }

    // IMPORTANT: gated implicit verdict confirmation must count explicit user check-ins,
    // not wearable-imported / inferred historical days.
    //
    // Source of truth: daily_entries rows with explicit check-in fields present.
    // We use this (not the 'checkin' table) so the counter increments immediately after a check-in.
    const explicitDailyCheckinDays = new Set<string>()
    try {
      for (const e of (entries365 || [])) {
        const dKey = String((e as any)?.local_date || '').slice(0, 10)
        if (!dKey) continue
        const energy = (e as any)?.energy
        const focus = (e as any)?.focus
        const mood = (e as any)?.mood
        const sleepQ = (e as any)?.sleep_quality
        const sleep = (e as any)?.sleep
        const hasAnyRating =
          typeof energy === 'number' ||
          typeof focus === 'number' ||
          typeof mood === 'number' ||
          typeof sleepQ === 'number' ||
          typeof sleep === 'number'
        if (hasAnyRating) explicitDailyCheckinDays.add(dKey)
      }
    } catch {}
    // Account-level count (all time window): useful for debug/telemetry but NOT used for per-supplement gate unlocks.
    const totalUserCheckins = explicitDailyCheckinDays.size

    // Compute total wearable days across all time to gate implicit behavior/UI
    let wearableCountAll = 0
    try {
      const { count: wc } = await supabase
        .from('daily_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('wearables', 'is', null)
      wearableCountAll = wc || 0
    } catch {}
    const meetsWearableThreshold = wearableCountAll >= 30

    // Use max of sources to avoid undercounting
    const totalDistinctDaysFromCheckins = distinctCheckinDays.size
    const totalDistinctDays = Math.max(totalDistinctDaysFromEntries, cleanDatesSet.size, totalDistinctDaysFromCheckins)
    if (VERBOSE) {
      try {
        console.log('[progress/loop] daysTracked debug', {
          entriesDistinct: totalDistinctDaysFromEntries,
          cleanDates: cleanDatesSet.size,
          checkinsDistinct: totalDistinctDaysFromCheckins,
          chosen: totalDistinctDays
        })
      } catch {}
    }

    // Compute gaps: days with no daily_entries between first check-in and today
    let gapsDays = 0
    try {
      const checkinDatesSorted = Array.from(distinctCheckinDays).sort()
      const firstCheckinKey = checkinDatesSorted.length > 0 ? checkinDatesSorted[0] : null
      if (firstCheckinKey) {
        const { data: sinceFirst } = await supabase
          .from('daily_entries')
          .select('local_date')
          .eq('user_id', user.id)
          .gte('local_date', firstCheckinKey)
        const haveSet = new Set<string>((sinceFirst || []).map((e: any) => String((e as any).local_date).slice(0,10)))
        const start = new Date(`${firstCheckinKey}T00:00:00Z`)
        const end = new Date(`${todayKey}T00:00:00Z`)
        const spanDays = Math.floor((end.getTime() - start.getTime()) / (24*60*60*1000)) + 1
        gapsDays = Math.max(0, spanDays - haveSet.size)
      }
    } catch {}

    // Helpers for category and required days
    const inferCategory = (nm: string, goals?: any): string => {
      const name = String(nm || '').toLowerCase()
      const g: string[] = Array.isArray(goals) ? goals.map((t: any) => String(t).toLowerCase()) : []
      const hay = (g.join(' ') + ' ' + name)
      if (/(magnesium|melatonin|gaba|glycine|sleep)/.test(hay)) return 'sleep'
      if (/(vitamin d|d3|b-complex|b12|iron|energy)/.test(hay)) return 'energy'
      if (/(omega|fish oil|ashwagandha|rhodiola|mood)/.test(hay)) return 'mood'
      if (/(cortisol|adaptogen|stress)/.test(hay)) return 'stress'
      if (/(protein|collagen|creatine|turmeric|curcumin|recovery)/.test(hay)) return name.includes('creatine') ? 'cognitive' : 'recovery'
      if (/(lion|nootropic|memory|focus|cognitive)/.test(hay)) return 'cognitive'
      if (/(probiotic|prebiotic|digest)/.test(hay)) return 'digestion'
      return 'other'
    }
    const requiredDaysFor = (cat: string): number => {
      switch (cat) {
        case 'sleep': return 10
        case 'energy': return 12
        case 'mood': return 14
        case 'stress': return 14
        case 'recovery': return 16
        case 'cognitive': return 21
        case 'digestion': return 14
        default: return 14
      }
    }
    const hash01 = (s: string): number => {
      let h = 2166136261
      for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = (h * 16777619) >>> 0
      }
      return h % 1000 / 1000
    }

    // Compute supplement progress
    const requiredDaysDefault = 14
    const progressRows: SupplementProgress[] = []
    if (dbg) {
      try { debugTrace.steps.push({ step: 'items_final', queryTable, itemsCount: (items || []).length, lastQueryError }) } catch {}
    }
    if (VERBOSE) {
      try {
        console.log('[progress/loop] items:', (items || []).length)
        console.log('[progress/loop] cleanDatesSet size:', cleanDatesSet.size, 'first5:', Array.from(cleanDatesSet).sort().slice(0,5))
      } catch {}
    }

    // Map supplement names to user_supplement ids (pre-initialize for earlier references)
    const nameToUserSuppId = new Map<string, string>()

    for (const it of items || []) {
      const id = (it as any).id as string
      const name = (it as any).name || 'Supplement'
      const startDate = ((it as any).start_date as string | null) || ((it as any).inferred_start_at as string | null)
      const createdAtRaw = (it as any).created_at as string | null
      const goals = (it as any).category ? [String((it as any).category)] : []
      const category = inferCategory(name, goals)

      // Days of data = ONLY days that have a supplement_intake record for THIS user_supplement_id
      let daysOfData = 0
      try {
        const nm = String((it as any).name || '').trim().toLowerCase()
        // Resolve a definitive user_supplement_id; do NOT fall back to stack_items.id for counting
        const directUid = (it as any).user_supplement_id ? String((it as any).user_supplement_id) : null
        const nameUid = nameToUserSuppId.get(nm) || null
        const suppId = directUid || nameUid || (queryTable === 'user_supplement' ? String((it as any).id) : null)
        if (!suppId) {
          if (VERBOSE) { try { console.log('[progress/loop] WARN: unable to resolve user_supplement_id for', nm, 'skipping daysOfData count') } catch {} }
        }
        // Respect start date if available
        const effectiveStart = (startDate && String(startDate).slice(0,10)) || (createdAtRaw ? String(createdAtRaw).slice(0,10) : earliestEntryDate)
        const startTs = effectiveStart ? toTs(String(effectiveStart).slice(0,10)) : Number.NEGATIVE_INFINITY
        for (const entry of (entries365 || [])) {
          const dKey = String((entry as any).local_date).slice(0,10)
          if (toTs(dKey) < startTs) continue
          const intake = (entry as any).supplement_intake || null
          let has = false
          if (suppId && intake && typeof intake === 'object') {
            if ((intake as any)[suppId] !== undefined) {
              has = true
            }
          }
            // if no explicit intake, count wearable day as implicit data when a start date is known
          if (!has) {
            const wear = (entry as any).wearables
            if (wear && (startDate || createdAtRaw)) {
              has = true
            }
          }
          if (has) daysOfData++
        }
      } catch {}
      // Ensure day 1 shows immediate progress if user checked in today
      if (daysOfData === 0) {
        if (hasCheckedInToday) {
          daysOfData = 1
        } else if (createdAtRaw) {
          // If user checked in on the same calendar day as creation, count it
          try {
            const createdDayKey = new Date(createdAtRaw).toISOString().slice(0,10)
            if (distinctCheckinDays.has(createdDayKey)) {
              daysOfData = 1
            }
          } catch {}
        }
      }
      const requiredDays = requiredDaysFor(category) || requiredDaysDefault
      // Base progress
      let baseProgress = (daysOfData / requiredDays) * 100
      // Stagger offset based on created_at minute
      let staggerOffset = 0
      try {
        if (createdAtRaw) {
          const m = new Date(createdAtRaw).getMinutes()
          staggerOffset = (m % 7) - 3 // -3..+3
        }
      } catch {}
      // Micro variation (deterministic per day)
      const todayStr = new Date().toISOString().slice(0,10)
      const microOffset = Math.floor(hash01(String(id) + todayStr) * 3) - 1 // -1,0,1
      // Rotation bonus placeholder (will refine after effect attach)
      let rotationBonus = 0
      // Quality modifier placeholder (will refine after effect attach)
      let qualityModifier = 0
      let progressPercent = Math.min(100, Math.max(0, Math.floor(baseProgress + staggerOffset + rotationBonus + qualityModifier + microOffset)))
      if (VERBOSE) { try { console.log('[progress/loop] row:', { id, name, startDate: (it as any).start_date || (it as any).inferred_start_at, daysOfData, progressPercent }) } catch {} }
      try { console.log('[progress-percent-initial]', { id, name, progressPercent }) } catch {}

      const insight = insightsById.get(id)
      let status: SupplementProgress['status'] = 'building'
      let trend: SupplementProgress['trend'] | undefined
      let effectPct: number | null = null
      let confidence: number | null = null

      if (insight) {
        effectPct = insight.effect
        confidence = insight.conf
        trend = effectPct > 0 ? 'positive' : effectPct < 0 ? 'negative' : 'neutral'
      }
      // Categorization:
      // - Ready: progress >= 100 AND analysis is significant
      // - No signal: progress >= 100 AND not significant (or no insight yet)
      // - Building: 0 < progress < 100
      if (progressPercent >= 100) {
        const significant = insight && String((insight as any).status || '').toLowerCase() === 'significant'
        status = significant ? 'ready' : 'no_signal'
      } else if (progressPercent > 0) {
        status = 'building'
      } else {
        status = 'building'
      }

      progressRows.push({
        id, name,
        progressPercent: 0,
        daysOfData,
        requiredDays,
        status,
        trend,
        effectPct,
        confidence,
        monthlyCost: typeof (it as any).monthly_cost === 'number' ? (it as any).monthly_cost : ((it as any).monthly_cost ? Number((it as any).monthly_cost) : null),
        // Store created_at so per-supplement gating can require a post-add check-in
        // @ts-ignore
        createdAtIso: createdAtRaw ? String(createdAtRaw).slice(0,10) : null
      })
    }
    if (dbg) {
      try { console.log('[dbg] progressRows_built', { count: progressRows.length }) } catch {}
      try { debugTrace.steps.push({ step: 'progressRows_built', count: progressRows.length }) } catch {}
    }

    // Attach effect categories when available (map by user_supplement_id; aligns with fallback path)
    // Also overlay with latest truth-engine reports for consistency with TruthReport
    const { data: effects } = await supabase
      .from('user_supplement_effect')
      .select('user_supplement_id,effect_category,effect_magnitude,effect_confidence,days_on,days_off,clean_days')
      .eq('user_id', user.id)
    const effBySupp = new Map<string, any>()
    for (const e of effects || []) effBySupp.set((e as any).user_supplement_id, e)
    // Diagnostics: inspect effects map keys and a sample entry
    try {
      const mapKeys = Array.from(effBySupp.keys()).slice(0, 5)
      const sampleVal = Array.from(effBySupp.values())[0] as any
      console.log('[EFFECTS-MAP]', {
        mapSize: effBySupp.size,
        mapKeys,
        sampleEntry: sampleVal ? { keys: Object.keys(sampleVal || {}), days_on: sampleVal?.days_on, sample_days_on: (sampleVal as any)?.sample_days_on } : 'empty'
      })
    } catch {}
    // Load latest truth reports (ordered newest first); first seen per id wins
    const { data: truths } = await supabase
      .from('supplement_truth_reports')
      .select('user_supplement_id,status,primary_metric,effect_direction,effect_size,percent_change,confidence_score,sample_days_on,sample_days_off,analysis_source,created_at,auto_unlocked')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const truthBySupp = new Map<string, { status: string; primary_metric?: string | null; effect_direction?: string | null; effect_size?: number | null; percent_change?: number | null; confidence_score?: number | null; sample_days_on?: number | null; sample_days_off?: number | null; analysis_source?: string | null; auto_unlocked?: boolean | null }>()
    // Keep a full implicit-source snapshot as well (NOT just status/counts), so the dashboard can render completed details
    // (effect size, direction, primary metric, confidence) even when analysis_source='implicit'.
    const implicitTruthBySupp = new Map<string, { status: string; primary_metric?: string | null; effect_direction?: string | null; effect_size?: number | null; percent_change?: number | null; confidence_score?: number | null; sample_days_on?: number | null; sample_days_off?: number | null; analysis_source?: string | null; auto_unlocked?: boolean | null }>()
    // Also capture the latest implicit-source sample counts per supplement for upload progress
    const implicitSampleBySupp = new Map<string, { on: number; off: number }>()
    for (const t of truths || []) {
      const uid = String((t as any).user_supplement_id || '')
      if (!uid) continue
      if (!truthBySupp.has(uid)) {
        truthBySupp.set(uid, {
          status: String((t as any).status || ''),
          primary_metric: (t as any).primary_metric ?? null,
          effect_direction: (t as any).effect_direction ?? null,
          effect_size: (t as any).effect_size ?? null,
          percent_change: (t as any).percent_change ?? null,
          confidence_score: (t as any).confidence_score ?? null,
          sample_days_on: (t as any).sample_days_on ?? null,
          sample_days_off: (t as any).sample_days_off ?? null,
          analysis_source: (t as any).analysis_source ?? null,
          auto_unlocked: (t as any).auto_unlocked ?? false,
        })
      }
      // Capture latest implicit truth separately (first seen due to descending order)
      if (!implicitTruthBySupp.has(uid) && String((t as any).analysis_source || '').toLowerCase() === 'implicit') {
        implicitTruthBySupp.set(uid, {
          status: String((t as any).status || ''),
          primary_metric: (t as any).primary_metric ?? null,
          effect_direction: (t as any).effect_direction ?? null,
          effect_size: (t as any).effect_size ?? null,
          percent_change: (t as any).percent_change ?? null,
          confidence_score: (t as any).confidence_score ?? null,
          sample_days_on: (t as any).sample_days_on ?? null,
          sample_days_off: (t as any).sample_days_off ?? null,
          analysis_source: 'implicit',
          auto_unlocked: (t as any).auto_unlocked ?? false,
        })
      }
      // First seen per uid wins due to descending created_at; record implicit counts when available
      const aSrc = String((t as any).analysis_source || '').toLowerCase()
      if (aSrc === 'implicit' && !implicitSampleBySupp.has(uid)) {
        implicitSampleBySupp.set(uid, {
          on: Number((t as any).sample_days_on ?? 0),
          off: Number((t as any).sample_days_off ?? 0)
        })
        if (!implicitTruthBySupp.has(uid)) {
          implicitTruthBySupp.set(uid, {
            status: String((t as any).status || ''),
            primary_metric: (t as any).primary_metric ?? null,
            effect_direction: (t as any).effect_direction ?? null,
            effect_size: (t as any).effect_size ?? null,
            percent_change: (t as any).percent_change ?? null,
            confidence_score: (t as any).confidence_score ?? null,
            sample_days_on: Number((t as any).sample_days_on ?? 0),
            sample_days_off: Number((t as any).sample_days_off ?? 0),
            analysis_source: 'implicit',
            auto_unlocked: (t as any).auto_unlocked ?? false,
          })
        }
      }
    }

    // One free instant verdict per account:
    // - exactly one truth report row gets auto_unlocked=true (wow moment)
    // - all other final verdicts require explicitCleanCheckins >= 3 to be revealed on dashboard
    const AUTO_UNLOCK_REQ = 3
    let hasAutoUnlocked = false
    try {
      const { count } = await (supabaseAdmin as any)
        .from('supplement_truth_reports')
        .select('user_supplement_id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('auto_unlocked', true as any)
      hasAutoUnlocked = Number(count || 0) > 0
    } catch {}
    let autoUnlockedSuppId: string | null = null
    try {
      for (const t of (truths || []) as any[]) {
        if ((t as any)?.auto_unlocked) {
          autoUnlockedSuppId = String((t as any).user_supplement_id || '') || null
          break
        }
      }
    } catch {}

    // If none has been auto-unlocked yet, auto-unlock the highest-confidence final verdict once.
    if (!hasAutoUnlocked) {
      try {
        const isGatableFinalVerdict = (st: unknown) => {
          const n = normalizeTruthStatus(st)
          return n === 'proven_positive' || n === 'negative' || n === 'no_effect' || n === 'no_detectable_effect'
        }
        let best: any | null = null
        for (const t of (truths || []) as any[]) {
          const uid = String((t as any).user_supplement_id || '')
          if (!uid) continue
          // Only auto-unlock gatable final verdicts (wow moment) — exclude too_early/confounded.
          if (!isGatableFinalVerdict((t as any).status)) continue
          const conf = Number((t as any).confidence_score ?? 0) || 0
          const created = String((t as any).created_at || '')
          const createdMs = created ? Date.parse(created) : 0
          const bestConf = best ? (Number(best.confidence_score ?? 0) || 0) : -1
          const bestMs = best ? (Date.parse(String(best.created_at || '')) || 0) : 0
          if (!best || conf > bestConf || (conf === bestConf && createdMs > bestMs)) {
            best = t
          }
        }
        if (best) {
          const bestUid = String((best as any).user_supplement_id || '')
          const { error: updErr } = await (supabaseAdmin as any)
            .from('supplement_truth_reports')
            .update({ auto_unlocked: true } as any)
            .eq('user_id', user.id)
            .eq('user_supplement_id', bestUid as any)
            .eq('auto_unlocked', false as any)
          if (!updErr) {
            hasAutoUnlocked = true
            autoUnlockedSuppId = bestUid
            // Update in-memory maps so this request immediately treats it as unlocked.
            const cur = truthBySupp.get(bestUid)
            if (cur) truthBySupp.set(bestUid, { ...cur, auto_unlocked: true })
            const curImp = implicitTruthBySupp.get(bestUid)
            if (curImp) implicitTruthBySupp.set(bestUid, { ...curImp, auto_unlocked: true })
          }
        }
      } catch {}
    }
    // Diagnostics: inspect truths map keys as well
    try {
      console.log('[TRUTHS-MAP]', {
        mapSize: truthBySupp.size,
        mapKeys: Array.from(truthBySupp.keys()).slice(0, 5)
      })
    } catch {}
    if (VERBOSE) {
      try {
        console.log('[truths] rows:', (truths || []).length, 'unique ids:', Array.from(truthBySupp.keys()).slice(0, 10))
      } catch {}
    }
    const mapTruthToCategory = (status: string): string | undefined => statusToCategory(status)
    // Build intakeByDate map for ON/OFF derivation
    const intakeByDate = new Map<string, Record<string, any>>()
    for (const e of entries365 || []) {
      const key = String((e as any).local_date).slice(0,10)
      const intake = (e as any).supplement_intake || null
      if (intake) intakeByDate.set(key, intake as any)
    }
    // Map names -> user_supplement ids for when items are from stack_items.
    // Use admin client so we reliably read testing_status/is_active in production (Issue 2/3 debugging).
    const { data: userSuppRows, error: userSuppError } = await supabaseAdmin
      .from('user_supplement')
      // IMPORTANT: only select columns that are confirmed to exist in production schema.
      .select('id,name,created_at,retest_started_at,inferred_start_at,trial_number,testing_status,is_active')
      .eq('user_id', user.id)
    // Verification log (Wayne debugging): confirm we loaded testing_status/is_active from the canonical table.
    try {
      console.log('[user-supp-load]', {
        userId: user.id,
        count: (userSuppRows || []).length,
        error: userSuppError?.message || null,
        rows: (userSuppRows || []).map((u: any) => ({
          id: (u as any).id,
          name: (u as any).name,
          testing_status: (u as any).testing_status,
          is_active: (u as any).is_active,
        })),
      })
    } catch {}
    /* nameToUserSuppId initialized earlier */
    const userSuppIdToName = new Map<string, string>()
    const suppMetaById = new Map<string, { restart?: string | null; inferred?: string | null; updated?: string | null; trial?: number | null; testing?: boolean; status?: string }>()
    const createdAtByUserSuppId = new Map<string, string | null>()
    const testingActiveIds = new Set<string>()
    const testingStatusById = new Map<string, string>()
    const isActiveById = new Map<string, boolean | null>()
    const nameToUserSuppIds = new Map<string, Set<string>>()
    for (const u of userSuppRows || []) {
      const nm = String((u as any).name || '').trim().toLowerCase()
      const uid = String((u as any).id)
      if (nm) {
        nameToUserSuppId.set(nm, uid)
        const set = nameToUserSuppIds.get(nm) || new Set<string>()
        set.add(uid)
        nameToUserSuppIds.set(nm, set)
      }
      userSuppIdToName.set(uid, String((u as any).name || ''))
      const status = String((u as any).testing_status || 'inactive').toLowerCase()
      const isTesting = status === 'testing'
      createdAtByUserSuppId.set(uid, (u as any)?.created_at ? String((u as any).created_at) : null)
      suppMetaById.set(uid, {
        restart: (u as any).retest_started_at ?? null,
        inferred: (u as any).inferred_start_at ?? null,
        // Do not assume updated_at exists; schema varies across deployments.
        updated: null,
        trial: (u as any).trial_number ?? null,
        testing: isTesting,
        status
      })
      if (isTesting) testingActiveIds.add(uid)
      testingStatusById.set(uid, status)
      isActiveById.set(uid, ((u as any).is_active === null || (u as any).is_active === undefined) ? null : Boolean((u as any).is_active))
    }

    // ===== Implicit rotation/confounding hold =====
    // If multiple supplements were backdated to the same start window (implicit inferred_start_at),
    // the truth engine can produce identical ON/OFF splits for each. Hold all but one so results
    // don’t appear simultaneously with confounded/identical data.
    const implicitRotationHoldIds = new Set<string>()
    try {
      // Only apply this hold in the implicit wearable path.
      if (meetsWearableThreshold) {
        const candidates: Array<{ id: string; start: string; created_at: string | null }> = []
        for (const u of userSuppRows || []) {
          const uid = String((u as any).id || '').trim()
          if (!uid) continue
          const status = String((u as any).testing_status || '').toLowerCase()
          const active = (u as any).is_active === false ? false : true
          const inferred = (u as any).inferred_start_at ? String((u as any).inferred_start_at).slice(0, 10) : ''
          if (!active) continue
          if (status !== 'testing') continue
          if (!inferred) continue
          candidates.push({ id: uid, start: inferred, created_at: (u as any)?.created_at ? String((u as any).created_at) : null })
        }
        const groups = new Map<string, Array<{ id: string; created_at: string | null }>>()
        for (const c of candidates) {
          const arr = groups.get(c.start) || []
          arr.push({ id: c.id, created_at: c.created_at })
          groups.set(c.start, arr)
        }
        for (const [start, arr] of groups.entries()) {
          if (!arr || arr.length <= 1) continue
          // Winner = earliest created_at (stable); holds = all other supplements in this start cluster.
          const sorted = [...arr].sort((a, b) => {
            const am = a.created_at ? Date.parse(a.created_at) : Number.POSITIVE_INFINITY
            const bm = b.created_at ? Date.parse(b.created_at) : Number.POSITIVE_INFINITY
            if (Number.isFinite(am) && Number.isFinite(bm) && am !== bm) return am - bm
            return String(a.id).localeCompare(String(b.id))
          })
          const winner = sorted[0]?.id
          for (const it of sorted) {
            if (!winner) continue
            if (String(it.id) !== String(winner)) implicitRotationHoldIds.add(String(it.id))
          }
        }
        if (implicitRotationHoldIds.size > 0) {
          try { console.log('[rotation-hold]', { holds: Array.from(implicitRotationHoldIds).slice(0, 10), total: implicitRotationHoldIds.size }) } catch {}
        }
      }
    } catch {}
    // Fast map from stack_items.id -> user_supplement_id when present to avoid name fuzziness
    const stackIdToUserSuppId = new Map<string, string>()
    try {
      for (const it of (items || [])) {
        const stackId = String((it as any)?.id || '')
        const uid = (it as any)?.user_supplement_id ? String((it as any).user_supplement_id) : ''
        if (stackId && uid) stackIdToUserSuppId.set(stackId, uid)
      }
    } catch {}
    // Mark rows with testingActive and resolve userSuppId early for reliable overlay
    for (const r of progressRows) {
      try {
        const nm = String((r as any).name || '').trim().toLowerCase()
        // Prefer explicit mapping from stack_items.id → user_supplement_id
        const idKey = String((r as any).id || '')
        let uid = stackIdToUserSuppId.get(idKey) || null
        // If coming from user_supplement, id is authoritative user_supplement_id
        if (!uid && queryTable === 'user_supplement') {
          uid = idKey
        }
        // Safe fallback for legacy stack_items rows missing linkage:
        // only use name-based mapping when it resolves uniquely for this user.
        if (!uid && nm) {
          const set = nameToUserSuppIds.get(nm)
          if (set && set.size === 1) {
            uid = Array.from(set)[0] || null
          }
        }
        ;(r as any).testingActive = testingActiveIds.has(String(uid) as any)
        ;(r as any).testingStatus = testingStatusById.get(String(uid)) || 'inactive'
        ;(r as any).userSuppId = uid
        // BUG 39: Dashboard cards should show the full user_supplement.name (includes brand/product),
        // not the ingredient-only stack_items.name. If we can resolve a user_supplement_id, prefer that name.
        try {
          const full = uid ? userSuppIdToName.get(String(uid)) : null
          if (full && String(full).trim().length > 0) {
            ;(r as any).name = String(full)
          }
        } catch {}
        // Issue 2: filter out inactive supplements from the dashboard payload.
        // If testing_status is inactive OR is_active is false, exclude from all sections.
        try {
          const st = uid ? String((testingStatusById.get(String(uid)) || '')).toLowerCase() : ''
          const activeFlag = uid ? isActiveById.get(String(uid)) : null
          if (st === 'inactive' || activeFlag === false) {
            // User intent wins: if they explicitly stopped testing (inactive) or set inactive/archived, hide it,
            // even if there is an implicit or stored truth report.
            ;(r as any)._excluded = true
            ;(r as any)._excluded_reason = st === 'inactive' ? 'testing_status=inactive' : 'is_active=false'
          }
        } catch {}
        if (VERBOSE) {
          try { console.log('[id-resolve:init]', { rowId: idKey, name: nm, resolvedUserSuppId: uid, byStack: stackIdToUserSuppId.get(idKey) || null }) } catch {}
        }
      } catch { (r as any).testingActive = true }
    }
    if (dbg) {
      try {
        const excluded = progressRows.filter((r: any) => (r as any)._excluded)
        const sample = progressRows.slice(0, 12).map((r: any) => ({
          rowId: String(r.id || ''),
          name: String((r as any).name || ''),
          userSuppId: String((r as any).userSuppId || ''),
          testing_status: String((r as any).testingStatus || ''),
          testingActive: Boolean((r as any).testingActive),
          excluded: Boolean((r as any)._excluded),
          reason: (r as any)._excluded_reason || null,
        }))
        console.log('[dbg] exclude_pass', { total: progressRows.length, excluded: excluded.length, sample })
        debugTrace.steps.push({ step: 'exclude_pass', total: progressRows.length, excluded: excluded.length, sample })
      } catch {}
    }
    // Only generate at most 1 implicit truth report per request (prevents “all verdicts at once” on upload).
    let didRefreshImplicitTruth = false
    for (const r of progressRows) {
      const eff = effBySupp.get(r.id)
      if (eff) {
        // Do not set effectCategory from historical effect table; truth report is sole source of verdicts
        r.effectPct = typeof (eff as any).effect_magnitude === 'number' ? Number((eff as any).effect_magnitude) : r.effectPct ?? null
        r.confidence = typeof (eff as any).effect_confidence === 'number' ? Number((eff as any).effect_confidence) : r.confidence ?? null
        ;(r as any).daysOn = (eff as any).days_on ?? null
        ;(r as any).daysOff = (eff as any).days_off ?? null
        ;(r as any).cleanDays = (eff as any).clean_days ?? null
      }
      // Truth overlay: if a truth report exists for this supplement, override effectCategory and key metrics
      try {
        const uid = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
        // Ensure a relatively fresh truth exists; regenerate if missing or stale (>1h)
        try {
          const truthRec = uid ? (truths || []).find((t: any) => String((t as any).user_supplement_id || '') === String(uid)) : null
          const createdAt = truthRec ? (new Date((truthRec as any).created_at as any)).getTime() : 0
          const STALE_MS = 60 * 60 * 1000
          const stale = !truthRec || (Date.now() - createdAt > STALE_MS)
          // Do not refresh/overwrite if we already have an implicit truth for this supplement
          const inferred = uid ? (suppMetaById.get(String(uid)) as any)?.inferred : null
          const isImplicit = Boolean(inferred) && meetsWearableThreshold
          const isHeldImplicit = Boolean(isImplicit && uid && implicitRotationHoldIds.has(String(uid)))
          const refreshBudgetOk = !isImplicit || !didRefreshImplicitTruth
          if (stale && uid && !implicitTruthBySupp.has(String(uid)) && refreshBudgetOk && !isHeldImplicit) {
            // BUG 36 (Retest): if a retest is active, do NOT regenerate a truth report on dashboard load.
            // Otherwise, the overlay-refresh will immediately "self-heal" and put the card back into COMPLETED.
            const meta = suppMetaById.get(String(uid))
            const isRetestActive = Boolean(meta?.restart) && String(meta?.status || '') === 'testing'
            const isJustResetToTesting = (() => {
              if (String(meta?.status || '') !== 'testing') return false
              const GRACE_MS = 5 * 60 * 1000
              const updatedAtMs = meta?.updated ? new Date(String(meta.updated)).getTime() : 0
              const restartMs = meta?.restart ? new Date(String(meta.restart)).getTime() : 0
              const now = Date.now()
              const byUpdated = updatedAtMs > 0 && (now - updatedAtMs) < GRACE_MS
              const byRestart = restartMs > 0 && (now - restartMs) < GRACE_MS
              return Boolean(byUpdated || byRestart)
            })()
            // Diagnostics: we need to see in Vercel logs whether this guard is being evaluated and what values it sees.
            try {
              if (meta?.restart || String(meta?.status || '') === 'testing') {
                console.log('[overlay-refresh][retest-guard]', {
                  uid,
                  name: (r as any).name,
                  stale,
                  hasTruthRec: !!truthRec,
                  retest_started_at: meta?.restart || null,
                  updated_at: (meta as any)?.updated || null,
                  testing_status: meta?.status || null,
                  isJustResetToTesting
                })
              }
            } catch {}
            if (isRetestActive || isJustResetToTesting) {
              if (VERBOSE) {
                try { console.log('[overlay-refresh] skip (retest or just-reset)', { uid, restart: meta?.restart, updated: (meta as any)?.updated || null, status: meta?.status, name: (r as any).name }) } catch {}
              }
            } else {
            try { if (VERBOSE) console.log('[overlay-refresh] generating truth for', { uid, cardId: (r as any).id, name: (r as any).name }) } catch {}
            const fresh = await generateTruthReportForSupplement(user.id, uid)
            if (isImplicit) didRefreshImplicitTruth = true
            // Persist the freshly generated report so downstream reads are consistent
            try {
              const payloadToStore = {
                user_id: user.id,
                user_supplement_id: uid,
                canonical_id: null as string | null,
                status: fresh.status,
                primary_metric: fresh.primaryMetricLabel,
                effect_direction: fresh.effect.direction,
                effect_size: fresh.effect.effectSize,
                absolute_change: fresh.effect.absoluteChange,
                percent_change: fresh.effect.percentChange,
                confidence_score: fresh.confidence.score,
                sample_days_on: fresh.meta.sampleOn,
                sample_days_off: fresh.meta.sampleOff,
                days_excluded_confounds: fresh.meta.daysExcluded,
                onset_days: fresh.meta.onsetDays,
                responder_percentile: fresh.community.userPercentile,
                responder_label: fresh.community.responderLabel,
                confounds: [],
                mechanism_inference: fresh.mechanism.label,
                biology_profile: fresh.biologyProfile,
                next_steps: fresh.nextSteps,
                science_note: fresh.scienceNote,
                raw_context: fresh
              }
              // Ensure 1 row per (user_id, user_supplement_id) to avoid race-condition duplicates.
              await persistTruthReportSingle(payloadToStore)
              // Seed the truth map immediately to avoid a requery race
              truthBySupp.set(String(uid), {
                status: String(fresh.status),
                effect_direction: fresh.effect.direction,
                effect_size: fresh.effect.effectSize,
                percent_change: fresh.effect.percentChange ?? null,
                confidence_score: fresh.confidence.score,
                sample_days_on: Number(fresh.meta.sampleOn || 0),
                sample_days_off: Number(fresh.meta.sampleOff || 0)
              })
              if (VERBOSE) { try { console.log('[overlay-refresh] saved fresh truth for', uid, 'status=', String(fresh.status)) } catch {} }
            } catch (saveErr: any) {
              try { console.log('[overlay-refresh] save failed:', saveErr?.message || saveErr) } catch {}
            }
            // Requery latest truth for this UID
            try {
              const { data: latest } = await supabase
                .from('supplement_truth_reports')
                .select('user_supplement_id,status,effect_direction,effect_size,percent_change,confidence_score,sample_days_on,sample_days_off,analysis_source,created_at')
                .eq('user_id', user.id)
                .eq('user_supplement_id', uid as any)
                .order('created_at', { ascending: false })
                .limit(1)
              if ((latest || []).length > 0) {
                truthBySupp.set(String(uid), {
                  status: String((latest![0] as any).status || ''),
                  effect_direction: (latest![0] as any).effect_direction ?? null,
                  effect_size: (latest![0] as any).effect_size ?? null,
                  percent_change: (latest![0] as any).percent_change ?? null,
                  confidence_score: (latest![0] as any).confidence_score ?? null,
                  sample_days_on: (latest![0] as any).sample_days_on ?? null,
                  sample_days_off: (latest![0] as any).sample_days_off ?? null,
                  analysis_source: (latest![0] as any).analysis_source ?? null
                })
                if (VERBOSE) { try { console.log('[overlay-refresh] updated truth map for', uid, 'status=', String((latest![0] as any).status || '')) } catch {} }
              }
            } catch {}
            }
          }
        } catch {}
        const inferred = uid ? (suppMetaById.get(String(uid)) as any)?.inferred : null
        const isImplicit = Boolean(inferred) && meetsWearableThreshold
        const isHeldImplicit = Boolean(isImplicit && uid && implicitRotationHoldIds.has(String(uid)))
        if (isHeldImplicit) {
          ;(r as any).rotationHold = true
        }
        const truth = (uid && !isHeldImplicit) ? truthBySupp.get(String(uid)) : undefined
        const mapped = truth ? mapTruthToCategory(truth.status) : undefined
        if (mapped) {
          ;(r as any).effectCategory = mapped
          ;(r as any).analysisSource = truth?.analysis_source || null
          // Also align effect magnitude/confidence with the Truth Report so UI text matches
          if (truth && typeof truth.percent_change === 'number') {
            r.effectPct = Number(truth.percent_change)
          } else if (truth && typeof truth.effect_size === 'number') {
            // If only effect_size is provided, prefer that as a fallback magnitude
            r.effectPct = Number(truth.effect_size)
          }
          if (truth && typeof truth.confidence_score === 'number') {
            r.confidence = Number(truth.confidence_score)
          }
        }
        if (VERBOSE && debugSuppId && (debugSuppId === uid || debugSuppId === String((r as any).id))) {
          try {
            console.log('[overlay-debug]', {
              id: (r as any).id,
              name: (r as any).name,
              userSuppId: uid,
              truthStatus: truth?.status,
              mappedCategory: mapped,
              finalCategory: (r as any).effectCategory
            })
          } catch {}
        }
        if (VERBOSE) {
          try {
            console.log('[overlay-trace]', {
              id: (r as any).id,
              name: (r as any).name,
              userSuppId: uid,
              hasTruth: !!truthBySupp.get(String(uid)),
              status: truthBySupp.get(String(uid))?.status || null,
              effectCategory: (r as any).effectCategory || null,
              sampleDaysOn: truthBySupp.get(String(uid))?.sample_days_on ?? null,
              sampleDaysOff: truthBySupp.get(String(uid))?.sample_days_off ?? null
            })
          } catch {}
        }
      } catch {}
      // Derive daysOn/Off from daily_entries intake; if retest is active, recompute from retest start
      try {
        const nm = String((r as any).name || '').trim().toLowerCase()
        // Prefer explicit mapping by stack_items.id, then direct user_supplement id. No name fallback.
        const idKey = String((r as any).id || '')
        let suppId = stackIdToUserSuppId.get(idKey) || null
        if (!suppId && queryTable === 'user_supplement') {
          suppId = idKey
        }
        // If still unresolved (e.g., legacy stack row without linkage), skip truth overlay for this row
        suppId = suppId || null
        ;(r as any).userSuppId = suppId
        const meta = (suppMetaById ? suppMetaById.get(suppId as any) : undefined)
        const restartIso: string | null = meta && (meta as any).restart ? String((meta as any).restart) : null
        const createdAtIso: string | null = ((r as any).createdAtIso ?? null) as any
        const confirmStartIso: string | null = restartIso || createdAtIso
        // Always recompute to avoid stale effect table counts
        let on = 0, off = 0
        let onClean = 0, offClean = 0
        // Per-supplement gated confirmation counter:
        // MUST count explicit daily_entries check-ins since the supplement was added (createdAtIso),
        // NOT since backdated start/inferred_start_at.
        let checkinsSinceAdded = 0
        for (const entry of (entries365 || [])) {
          const dKey = String((entry as any).local_date).slice(0,10)
          if (restartIso && dKey < restartIso.slice(0,10)) continue
          const intake = (entry as any).supplement_intake || null
          let isOff = false
          let isTaken = false
          let hasRecord = false
          let hasExplicitRecord = false
          if (intake && typeof intake === 'object') {
            // Try multiple candidate keys to handle historical data keyed by stack_items.id
            const candidates = [suppId, String((r as any).id || '')].filter(Boolean) as any
            for (const k of candidates) {
              if (hasRecord) break
              const val = (intake as any)[(k as any)]
              if (val === undefined) continue
              hasRecord = true
              hasExplicitRecord = true
              const s = String(val).toLowerCase()
              if (s === 'skipped' || s === 'off' || s === 'not_taken' || s === 'false' || s === '0') {
                isOff = true
              } else if (s === 'taken' || s === 'true' || s === '1') {
                isTaken = true
              }
            }
          }
          // Implicit ON/OFF from wearables if no explicit intake record:
          if (!hasRecord) {
            const hasWearable = (entry as any)?.wearables != null
            const inferred = (suppMetaById.get(suppId || '') as any)?.inferred as string | null
            if (hasWearable && inferred) {
              if (dKey < inferred.slice(0,10)) {
                isOff = true
              } else {
                isTaken = true
              }
              hasRecord = true
            }
          }
          if (!hasRecord) continue
          // A day is "clean" unless it contains a known noise/confound tag
          const entryTags: string[] = Array.isArray((entry as any).tags) ? (entry as any).tags : []
          const hasNoiseTag = entryTags.some((t: any) => NOISE_TAGS.has(String(t || '').toLowerCase()))
          const isClean = !hasNoiseTag
          if (VERBOSE && debugSuppId && debugSuppId === suppId) {
            try {
              console.log('[daysOn]', { suppId, date: dKey, intake: (intake ? (intake as any)[suppId] : undefined), tags: (entry as any).tags, isClean })
            } catch {}
          }
          // NOTE: We intentionally do NOT count supplement_intake records here for the gate counter.
          // The gate is a habit mechanism: it should advance on explicit daily check-ins, even if
          // the user doesn't toggle supplement intake for the day.
          if (isOff) {
            if (isClean) { off++; offClean++ }
          } else if (isTaken) {
            on++
            if (isClean) onClean++
          }
        }
        ;(r as any).daysOn = on
        ;(r as any).daysOff = off
        ;(r as any).daysOnClean = onClean
        ;(r as any).daysOffClean = offClean
        // Count explicit check-in days since the supplement was added.
        // Use createdAtIso (DB created_at), not restartIso/inferred_start_at.
        try {
          // Fallback: if createdAtIso is missing, use todayKey so users aren't stuck at 0 forever.
          const gateStart = createdAtIso ? String(createdAtIso).slice(0, 10) : String(todayKey).slice(0, 10)
          if (gateStart) {
            let n = 0
            for (const d of explicitDailyCheckinDays) {
              if (d >= gateStart) n++
            }
            checkinsSinceAdded = n
          } else {
            checkinsSinceAdded = 0
          }
        } catch {
          checkinsSinceAdded = 0
        }
        ;(r as any).explicitCleanCheckins = checkinsSinceAdded
        if (dbg) {
          try {
            console.log('[GATE-DEBUG]', {
              name: String((r as any).name || ''),
              createdAtIso,
              gateStart: createdAtIso ? String(createdAtIso).slice(0, 10) : String(todayKey).slice(0, 10),
              explicitDailyCheckinDaysSize: explicitDailyCheckinDays.size,
              explicitDailyCheckinDaysSample: Array.from(explicitDailyCheckinDays).slice(0, 5),
              checkinsSinceAdded,
              confirmCheckinsRequired: (r as any).confirmCheckinsRequired,
            })
          } catch {}
        }
        // Bug 28: dynamic confirmation gate (implicit strong evidence can require only 1 check-in)
        try {
          const uid0 = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
          const truth0 = uid0 ? (truthBySupp.get(String(uid0)) as any) : null
          const required = computeConfirmCheckinsRequired({
            analysisSource: (truth0 as any)?.analysis_source ?? (truth0 as any)?.analysisSource ?? (r as any)?.analysisSource ?? null,
            confidenceScore: (truth0 as any)?.confidence_score ?? (r as any)?.confidence ?? null,
            sampleDaysOn: (truth0 as any)?.sample_days_on ?? (r as any)?.daysOn ?? null,
            sampleDaysOff: (truth0 as any)?.sample_days_off ?? (r as any)?.daysOff ?? null,
          })
          ;(r as any).confirmCheckinsRequired = required
        } catch {
          ;(r as any).confirmCheckinsRequired = 3
        }
        // Days tracked for this supplement = ON + OFF (any quality)
        ;(r as any).daysOfData = on + off
        const isRetestActive = Boolean(restartIso) && String((meta as any)?.status || '').toLowerCase() === 'testing'
        if (restartIso) {
          ;(r as any).retestStartedAt = restartIso
          ;(r as any).trialNumber = (suppMetaById && suppMetaById.get(suppId as any) ? (suppMetaById.get(suppId as any) as any).trial : null) ?? null
          ;(r as any).effectCategory = undefined
          r.effectPct = null
          r.confidence = null
          r.trend = undefined
          // IMPORTANT: after a retest starts, we must not treat historical implicit data as "current testing".
          // Force explicit semantics so downstream implicit progress logic doesn't pull in large historical samples.
          if (isRetestActive) {
            ;(r as any).analysisSource = 'explicit'
          }
        }
        // BUG 36 (Retest): while a retest is active, do NOT re-apply any truth overlay (old verdict).
        // Otherwise the card "snaps back" to COMPLETED on refresh even after we cleared the truth row.
        if (!isRetestActive) {
          try {
            const uid = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
            // Prefer implicit truth verdicts for implicit-analysis supplements
            const tImplicit = uid ? implicitTruthBySupp.get(String(uid)) : undefined
            const truth = (tImplicit as any) || (uid ? truthBySupp.get(String(uid)) : undefined)

            // Always expose raw truth fields (even if status→category mapping fails) so the client can render Completed cards reliably.
            if (truth) {
              ;(r as any).truthStatus = (truth as any)?.status ?? null
              ;(r as any).truthEffectSize = (truth as any)?.effect_size ?? null
              ;(r as any).truthEffectDirection = (truth as any)?.effect_direction ?? null
              ;(r as any).truthSampleDaysOn = (truth as any)?.sample_days_on ?? null
              ;(r as any).truthSampleDaysOff = (truth as any)?.sample_days_off ?? null
              ;(r as any).primaryMetricLabel = (truth as any)?.primary_metric ?? (r as any)?.primaryMetricLabel ?? null

              // Align magnitude + confidence with stored Truth Report for UI consistency
              if (typeof (truth as any).percent_change === 'number') r.effectPct = Number((truth as any).percent_change)
              else if (typeof (truth as any).effect_size === 'number') r.effectPct = Number((truth as any).effect_size)
              if (typeof (truth as any).confidence_score === 'number') r.confidence = Number((truth as any).confidence_score)
            }

            const mapped = truth ? mapTruthToCategory(String((truth as any)?.status || '')) : undefined
            if (mapped) {
              ;(r as any).effectCategory = mapped
            }

            // If Truth Engine provided sample day counts and they are non-zero, override derived days
            const tOn = (truth && typeof (truth as any).sample_days_on === 'number') ? Number((truth as any).sample_days_on) : null
            const tOff = (truth && typeof (truth as any).sample_days_off === 'number') ? Number((truth as any).sample_days_off) : null
            const sum = (tOn ?? 0) + (tOff ?? 0)
            // IMPORTANT: if retest_started_at exists, displayed ON/OFF/days tracked must reflect only days since retest.
            // Never override with truth-engine sample counts (which may reflect historical data).
            if (!restartIso && sum > 0) {
              ;(r as any).daysOn = tOn ?? Number((r as any).daysOn || 0)
              ;(r as any).daysOff = tOff ?? Number((r as any).daysOff || 0)
              ;(r as any).daysOfData = Number((r as any).daysOn || 0) + Number((r as any).daysOff || 0)
              ;(r as any).daysTracked = Number((r as any).daysOfData || 0)
            }

            // Persist analysis source preferred for display
            if (truth) {
              const chosenSrc = (truth as any)?.analysis_source || (tImplicit ? 'implicit' : (r as any).analysisSource || null)
              ;(r as any).analysisSource = chosenSrc
              // Log when implicit truth overrides explicit path
              try {
                if (tImplicit && chosenSrc === 'implicit') {
                  console.log('[IMPLICIT-OVERRIDE]', {
                    name: (r as any).name,
                    verdict: String(mapped || (truth as any)?.status || ''),
                    note: 'Using implicit truth verdict; skipping/overriding explicit re-run'
                  })
                }
              } catch {}
            }
          } catch {}
        }
        if (VERBOSE && debugSuppId && debugSuppId === suppId) {
          try {
            console.log('[daysOn] totals:', { suppId, on, off, onClean, offClean, restartIso })
          } catch {}
        }
      } catch {}
      // Recompute progressPercent with bonuses now that we have some quality data
      try {
        const name = (r as any).name || ''
        const goals = (r as any).category ? [String((r as any).category)] : []
        const category = inferCategory(name, goals)
        const requiredDays = requiredDaysFor(category)
        const baseProgress = (r.daysOfData / requiredDays) * 100
        // stagger offset based on creation minute if available via debug supplementStartDates? skip here
        let staggerOffset = 0
        // rotation bonus
        const daysOn = ((r as any).daysOn as number) || 0
        const daysOff = ((r as any).daysOff as number) || 0
        const cycles = Math.min(3, Math.floor((daysOn + daysOff) / 14))
        const rotationBonus = cycles >= 3 ? 20 : cycles === 2 ? 15 : cycles === 1 ? 8 : 0
        // quality modifier
        const cleanDays = ((r as any).cleanDays as number) || 0
        const cleanRatio = r.daysOfData > 0 ? cleanDays / r.daysOfData : 0
        const qualityModifier = ((cleanRatio - 0.7) * 10)
        // micro variation deterministic
        const todayStr = new Date().toISOString().slice(0,10)
        const microOffset = Math.floor(hash01(String(r.id) + todayStr) * 3) - 1
        let adjusted = baseProgress + staggerOffset + rotationBonus + qualityModifier + microOffset
        const adjustedBeforeCap = adjusted
        // Evidence-based progress: combine ON and OFF requirements
        // Progress = (min(ON, ON_REQ) + min(OFF, OFF_REQ)) / (ON_REQ + OFF_REQ)
        const requiredOnDays = requiredDays
        const requiredOffDays = Math.min(5, Math.max(3, Math.round(requiredDays / 4))) // 3–5 off-days required
        const onClamped = Math.min(Math.max(0, daysOn), requiredOnDays)
        const offClamped = Math.min(Math.max(0, daysOff), requiredOffDays)
        const denom = Math.max(1, requiredOnDays + requiredOffDays)
        const evidencePct = ((onClamped + offClamped) / denom) * 100
        // Use ON/OFF evidence as the progress value (UX: shows momentum from day one)
        const activeProgress = Math.max(0, Math.min(100, Math.round(evidencePct)))
        // Determine analysis source from truth overlay/row
        const uidForTruth = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
        const truthImplicit = uidForTruth ? implicitTruthBySupp.get(String(uidForTruth)) : undefined
        const truthRec = (truthImplicit as any) || (uidForTruth ? truthBySupp.get(String(uidForTruth)) : undefined)
        let analysisSrc = String(((r as any).analysisSource) || (truthRec as any)?.analysis_source || '').toLowerCase()
        // Retest handling: if retest_started_at is present and the supplement is currently testing,
        // treat it as explicit and avoid using historical implicit samples/verdicts.
        try {
          const uidForMeta = String(uidForTruth || '')
          const meta = uidForMeta ? (suppMetaById.get(uidForMeta) as any) : null
          const restartIso = meta?.restart ? String(meta.restart) : null
          const isRetestActive = Boolean(restartIso) && String(meta?.status || '').toLowerCase() === 'testing'
          if (isRetestActive) {
            analysisSrc = 'explicit'
            ;(r as any).analysisSource = 'explicit'
          }
        } catch {}
        // Implicit sanity: a supplement can only be implicit if it has an inferred_start_at
        // AND the user has substantial wearable history (>=30 days).
        // Otherwise, force explicit — regardless of sample counts.
        try {
          const uid = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
          const inferred = uid ? (suppMetaById.get(String(uid)) as any)?.inferred : null
          if (analysisSrc === 'implicit' && (!inferred || !meetsWearableThreshold)) {
            analysisSrc = 'explicit'
            ;(r as any).analysisSource = 'explicit'
            try { console.log('[IMPLICIT-SANITY]', { name, inferred_start_at: inferred, wearableDaysAll: wearableCountAll, forced: 'explicit (insufficient conditions)' }) } catch {}
          }
        } catch {}
        const isImplicit = analysisSrc === 'implicit'
        // For logging compatibility
        const finalPct = activeProgress
        // Debug: emit full calculation per supplement
        if (VERBOSE) {
          try {
            console.log('[progress/loop] calc', {
              id: r.id,
              name,
              daysOfData: r.daysOfData,
              requiredDays,
              daysOn,
              daysOff,
              requiredOnDays,
              requiredOffDays,
              baseProgress: Math.round(baseProgress * 100) / 100,
              adjustedBeforeCap: Math.round(adjustedBeforeCap * 100) / 100,
              evidencePct: Math.round(evidencePct * 100) / 100,
              finalPct
            })
          } catch {}
        }
        // Upload-aware head-start only when truly implicit AND upload samples exist
        let uploadProgress = 0
        let sOn = 0
        let sOff = 0
        if (isImplicit) {
          // If Truth Report already computed a confidence score, use it directly for implicit signal strength.
          // This avoids any fixed/floored progress values and ensures the displayed percent matches real analysis.
          try {
            const rawAny =
              (truthRec as any)?.confidence_score ??
              (r as any)?.confidence
            const confNum = typeof rawAny === 'string' ? Number(rawAny) : (rawAny as any)
            if (typeof confNum === 'number' && Number.isFinite(confNum) && confNum > 0) {
              const pct = confNum <= 1.2 ? Math.round(confNum * 100) : Math.round(confNum)
              // Keep within a sane UI range for "building" states.
              uploadProgress = Math.min(95, Math.max(5, pct))
            }
          } catch {}

          // Diagnostic to inspect available row fields for day counts
          try {
            console.log('[ROW-FIELDS]', {
              name,
              keys: Object.keys(r as any),
              daysOn: (r as any).daysOn,
              days_on: (r as any).days_on,
              daysOff: (r as any).daysOff,
              days_off: (r as any).days_off,
              sample_days_on: (r as any).sample_days_on,
              sampleDaysOn: (r as any).sampleDaysOn
            })
          } catch {}
          // Prefer clean ON/OFF counts computed earlier (same as NEXT-RESULT uses)
          let storedDaysOn = Number((r as any)?.daysOnClean ?? 0)
          let storedDaysOff = Number((r as any)?.daysOffClean ?? 0)
          // Fallback to implicit truth sample counts captured earlier
          if ((storedDaysOn + storedDaysOff) === 0) {
            const uidForTruth = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
            const effLookupKey = String(uidForTruth || '')
            try { console.log('[EFFECTS-LOOKUP]', { name, lookupKey: effLookupKey, found: implicitSampleBySupp.has(effLookupKey) }) } catch {}
            const implicitCounts = effLookupKey ? (implicitSampleBySupp.get(effLookupKey) as any | undefined) : undefined
            storedDaysOn = Number(implicitCounts?.on ?? 0)
            storedDaysOff = Number(implicitCounts?.off ?? 0)
          }
          // Final fallback: row totals
          if ((storedDaysOn + storedDaysOff) === 0) {
            storedDaysOn = Number((r as any)?.daysOn ?? 0)
            storedDaysOff = Number((r as any)?.daysOff ?? 0)
          }
          try {
            console.log('[UPLOAD-FIX]', {
              name,
              rowDaysOn: (r as any).daysOn,
              storedDaysOn,
              rowDaysOff: (r as any).daysOff,
              storedDaysOff
            })
          } catch {}
          sOn = storedDaysOn
          sOff = storedDaysOff
          // If we didn't get a usable confidence score, fall back to a computed strength from sample day counts.
          if (uploadProgress <= 0 && (sOn + sOff) > 0) {
            const checkInsCompleted = Number((r as any)?.explicitCleanCheckins || 0)
            const checkInsRequired = Number((r as any)?.confirmCheckinsRequired || 3)
            uploadProgress = computeImplicitSignalStrength({
              sampleDaysOn: sOn,
              sampleDaysOff: sOff,
              checkInsCompleted,
              checkInsRequired,
              // For historical/wearable (implicit) supplements, use higher thresholds so large backfilled datasets
              // don't instantly saturate at a single value.
              onThreshold: Math.max(1000, Number(requiredOnDays || requiredDays || 14), 14),
              offThreshold: Math.max(1000, Number(requiredOffDays || 5), 5),
            })
          }
        }
        // If implicit, prefer implicit truth verdict for effectCategory (ensures card reflects upload verdict)
        try {
          let finalImplicitVerdict = false
          if (isImplicit) {
            const uid = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
            // Do not apply implicit verdict/sample overrides during an active retest.
            // This prevents enormous historical sample counts from showing (e.g. 1020 days tracked) after retest.
            const meta = uid ? (suppMetaById.get(String(uid)) as any) : null
            const restartIso = meta?.restart ? String(meta.restart) : null
            const isRetestActive = Boolean(restartIso) && String(meta?.status || '').toLowerCase() === 'testing'
            if (!isRetestActive) {
              const impl = uid ? implicitTruthBySupp.get(String(uid)) : undefined
              if (impl && impl.status) {
                const mapped = mapTruthToCategory(impl.status)
                if (mapped) {
                  ;(r as any).effectCategory = mapped
                  // Log explicit implicit-verdict usage
                  try {
                    console.log('[IMPLICIT-VERDICT]', {
                      name,
                      implicitEffectCategory: String(mapped),
                      using: 'implicit'
                    })
                  } catch {}
                  // Mark final implicit verdicts to force 100% and completion downstream
                  finalImplicitVerdict = ['works','no_effect','no_detectable_effect'].includes(String(mapped).toLowerCase())
                  const confirmNeeded = Number((r as any).explicitCleanCheckins || 0) < 3
                  if (finalImplicitVerdict && !confirmNeeded) {
                    ;(r as any).isReady = true
                  }
                }
                // Also expose implicit clean counts for downstream logic (rotation)
                // Do not apply historical sample-day overrides when a retest window exists.
                if (!restartIso) {
                  ;(r as any).daysOnClean = typeof (r as any).daysOnClean === 'number' && (r as any).daysOnClean > 0 ? (r as any).daysOnClean : Number(impl.sample_days_on || 0)
                  ;(r as any).daysOffClean = typeof (r as any).daysOffClean === 'number' && (r as any).daysOffClean > 0 ? (r as any).daysOffClean : Number(impl.sample_days_off || 0)
                }
              }
            }
          }
          // Promote display progress to 100% for implicit final verdicts when unlocked by user-level or per-supp check-ins.
          // IMPORTANT: Do NOT allow DB 'complete' to override the gate when total user check-ins < 3.
          if (finalImplicitVerdict) {
            const uidForStatus = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
            const dbTestingStatus = uidForStatus ? (testingStatusById.get(String(uidForStatus)) || '') : ''
            // Unlock final implicit verdict only after enough post-add explicit check-ins for THIS supplement.
            const perSuppCheckins = Number((r as any)?.explicitCleanCheckins || 0)
            const confirmUnlocked = finalImplicitVerdict && perSuppCheckins >= 3
            if (confirmUnlocked) {
              uploadProgress = 100
              sOn = Math.max(sOn, Number((r as any).daysOnClean ?? 0))
              sOff = Math.max(sOff, Number((r as any).daysOffClean ?? 0))
              ;(r as any).isReady = true
            }
          }
          // Ensure daysOfData reflects implicit clean counts when available
          try {
            const implicitTracked = Number((r as any).daysOnClean || 0) + Number((r as any).daysOffClean || 0)
            if (isImplicit && implicitTracked > Number((r as any).daysOfData || 0)) {
              // If a retest exists, never inflate daysOfData using implicit historical sample counts.
              const uid = (r as any).userSuppId || (queryTable === 'user_supplement' ? String((r as any).id) : null)
              const meta = uid ? (suppMetaById.get(String(uid)) as any) : null
              const hasRestart = Boolean(meta?.restart)
              if (!hasRestart) {
                ;(r as any).daysOfData = implicitTracked
              }
            }
          } catch {}
        } catch {}
        // Only use upload-based progress when implicit AND we have an implicit strength value.
        // (Confidence-based uploadProgress may exist even if sample counts are not in the row.)
        const useUploadProgress = isImplicit && (uploadProgress > 0 || (sOn + sOff) > 0)
        let displayProgress = useUploadProgress ? uploadProgress : activeProgress
        // If absolutely no data exists (no ON, no OFF, no samples), force 0% and a starter label
        try {
          const onAny = Number((r as any).daysOn || 0)
          const offAny = Number((r as any).daysOff || 0)
          const noAnySamples = (Number(sOn || 0) === 0) && (Number(sOff || 0) === 0)
          const noAnyData = (onAny === 0 && offAny === 0 && noAnySamples)
          if (noAnyData) {
            displayProgress = 0
          }
        } catch {}
        try {
          const hasCheckinData: any = (r as any).explicitCleanCheckins
          console.log('[upload-debug]', {
            id: r.id,
            name,
            analysisSource: analysisSrc || null,
            isImplicit,
            daysOn,
            daysOff,
            sampleOn: sOn,
            sampleOff: sOff,
            activeProgress,
            hasCheckinData,
            uploadProgress,
            useUploadProgress,
            displayProgress
          })
        } catch {}
        // Diagnostic: confirm which progress path is used per supplement
        try {
          console.log('[PROGRESS-DEBUG]', {
            name,
            analysisSource: (r as any).analysisSource || analysisSrc || null,
            sampleDaysOn: sOn,
            sampleDaysOff: sOff,
            useUploadProgress,
            uploadProgress,
            displayProgress
          })
        } catch {}
        r.progressPercent = displayProgress
        try { console.log('[progress-percent-final]', { id: r.id, name, rProgressPercent: r.progressPercent, activeProgress, uploadProgress, isImplicit }) } catch {}
        r.requiredDays = requiredDays
        // Persist required ON/OFF for client-side gating
        ;(r as any).requiredOnDays = requiredOnDays
        ;(r as any).requiredOffDays = requiredOffDays
        // Microcopy for card
        ;(r as any).progressLabel = (() => {
          const onAny = Number((r as any).daysOn || 0)
          const offAny = Number((r as any).daysOff || 0)
          const noAnySamples = (Number(sOn || 0) === 0) && (Number(sOff || 0) === 0)
          const noAnyData = (onAny === 0 && offAny === 0 && noAnySamples)
          if (noAnyData) return 'Just added — start checking in'
          if (isImplicit) return 'Signal from historical data'
          if ((displayProgress >= 100) && ((r as any).effectCategory && ['works','negative','no_effect','no_detectable_effect'].includes(String((r as any).effectCategory).toLowerCase()))) return 'Test complete'
          return (activeProgress > 0) ? 'Actively testing' : 'Gathering data'
        })()
        ;(r as any).activeProgress = activeProgress
        ;(r as any).uploadProgress = uploadProgress
      }
      catch {}
    }

    // Badge mapping util per truth_status
    const badgeFromTruth = (truthStatus?: string | null): { key: string; text: string } => {
      const st = String(truthStatus || '').toLowerCase()
      if (st === 'proven_positive') return { key: 'keep', text: '✓ KEEP' }
      if (st === 'no_effect' || st === 'no_detectable_effect') return { key: 'no_clear_signal', text: '○ NO CLEAR SIGNAL' }
      if (st === 'negative') return { key: 'drop', text: '✗ DROP' }
      if (st === 'confounded') return { key: 'inconclusive', text: '⚠ INCONCLUSIVE' }
      if (st === 'too_early' || st === 'needs_more_data') return { key: 'testing', text: '◐ TESTING' }
      return { key: 'starting', text: '◐ STARTING' }
    }
    // Resolve display state per truth table.
    // IMPORTANT: promo/manual trials should be treated as Pro via pro_expires_at, even when tier remains 'free'.
    const userTier: 'free' | 'pro' = isProActive({
      tier: (profile as any)?.tier ?? null,
      pro_expires_at: (profile as any)?.pro_expires_at ?? null,
    })
      ? 'pro'
      : 'free'
    for (const r of progressRows as any[]) {
      try {
        const analysis_source = String((r.analysisSource || '')).toLowerCase() || null
        const uid = (r.userSuppId || nameToUserSuppId.get(String(r.name || '').trim().toLowerCase()) || '')
        // Prefer effectCategory; if missing, derive from stored truth status so Completed cards don't show "TESTING 100%".
        const inferred = uid ? (suppMetaById.get(String(uid)) as any)?.inferred : null
        const is_implicit = Boolean(inferred) && meetsWearableThreshold
        const isHeldImplicit = Boolean(is_implicit && uid && implicitRotationHoldIds.has(String(uid)))
        const truthRec = (uid && !isHeldImplicit)
          ? ((truthBySupp.get(String(uid)) as any) || (implicitTruthBySupp.get(String(uid)) as any) || null)
          : null
        const truthStatusRaw = truthRec ? String(truthRec?.status || '') : ''
        const truthAutoUnlocked = Boolean(truthRec?.auto_unlocked) || (autoUnlockedSuppId ? String(autoUnlockedSuppId) === String(uid) : false)
        const derivedCat = truthStatusRaw ? String(statusToCategory(truthStatusRaw) || '') : ''
        const ec = String((r as any).effectCategory || derivedCat || '').toLowerCase()
        const has_final_verdict = ['works','no_effect','no_detectable_effect','negative','proven_positive'].includes(ec)
        const isFinalTruthStatus = ['proven_positive','negative','no_effect','no_detectable_effect','confounded'].includes(String(truthStatusRaw || '').toLowerCase())
        // "VERDICT READY" only makes sense when a gatable final verdict exists (not too_early/confounded).
        const isGatableFinalVerdict = (() => {
          const st = normalizeTruthStatus(truthStatusRaw)
          return st === 'proven_positive' || st === 'negative' || st === 'no_effect' || st === 'no_detectable_effect'
        })()
        // Derive implicit from inferred_start_at + wearable_days (already computed above)
        const createdIso = String((r as any)?.createdAtIso || '').slice(0,10)
        const createdMs = createdIso ? Date.parse(`${createdIso}T00:00:00Z`) : NaN
        const supplement_age_days = Number.isFinite(createdMs) ? Math.floor((Date.now() - createdMs) / (24*60*60*1000)) : 9999
        // Gate: lock implicit unless (final verdict AND total user check-ins >= required confirmations).
        // Use the per-row confirmCheckinsRequired computed earlier (Bug 28), not a hard-coded 3.
        const confirmReq = Math.max(1, Number((r as any)?.confirmCheckinsRequired || 3))
        // IMPORTANT: if a final truth report exists (truthStatusRaw is final), do NOT gate-lock it into TESTING.
        // The Completed section is driven by the existence of supplement_truth_reports, not by check-in confirmation UI gates.
        const checkinsCompleted = Number((r as any)?.explicitCleanCheckins || 0)
        const is_gate_locked = Boolean(is_implicit && !isFinalTruthStatus && !(has_final_verdict && checkinsCompleted >= confirmReq))
        // Section and progress per rules
        let section: 'testing' | 'completed' = 'testing'
        let progress = Number(r.progressPercent || 0)
        let showVerdict = false
        // Map effectCategory directly to badge when a final verdict exists
        const ecToBadge: Record<string, { key: string; text: string }> = {
          // Completed verdicts come from supplement_truth_reports.status (not user_supplement.testing_status).
          'works': { key: 'keep', text: '✓ KEEP' },
          'proven_positive': { key: 'keep', text: '✓ KEEP' },
          // "no_effect" / "no_detectable_effect" should read as "NO CLEAR SIGNAL"
          'no_effect': { key: 'no_clear_signal', text: '○ NO CLEAR SIGNAL' },
          'no_detectable_effect': { key: 'no_clear_signal', text: '○ NO CLEAR SIGNAL' },
          // Actionable UI label for negative results
          'negative': { key: 'drop', text: '✗ DROP' }
        }
        let badge = has_final_verdict ? (ecToBadge[ec] || { key: 'testing', text: '◐ TESTING' }) : { key: 'testing', text: '◐ TESTING' }
        let label = ''
        let subtext = ''
        const usingUpload = String((r as any)?.analysisSource || '').toLowerCase() === 'implicit'

        // One free instant verdict per account:
        // If user already received an auto-unlocked verdict, all other final verdicts require 3 explicit clean check-ins.
        const shouldLockVerdictReady =
          Boolean(hasAutoUnlocked && isGatableFinalVerdict && !truthAutoUnlocked && checkinsCompleted < AUTO_UNLOCK_REQ)

        // If verdict is calculated but not unlocked yet, keep it in Testing.
        // IMPORTANT UX: do NOT show any "verdict ready" / lock messaging. It should look like normal testing.
        if (shouldLockVerdictReady) {
          ;(r as any).gateLocked = true
          // For the one-free-verdict gate, the requirement is always "3 check-ins" before unlock.
          ;(r as any).confirmCheckinsRequired = AUTO_UNLOCK_REQ
          section = 'testing'
          progress = Math.min(95, Math.max(5, Number((r as any)?.uploadProgress ?? r.progressPercent ?? 0) || 95))
          badge = { key: 'testing', text: '◐ TESTING' }
          label = usingUpload ? 'Signal from historical data' : 'Actively testing'
          subtext = `Check-ins completed: ${checkinsCompleted} of ${AUTO_UNLOCK_REQ}`
          showVerdict = false
          // IMPORTANT: Do not leak verdict details for locked rows.
          ;(r as any).truthStatus = ''
          ;(r as any).truthEffectSize = null
          ;(r as any).truthEffectDirection = null
          ;(r as any).truthSampleDaysOn = null
          ;(r as any).truthSampleDaysOff = null
          ;(r as any).primaryMetricLabel = null
          ;(r as any).confidence = null
          ;(r as any).effectCategory = null
        } else
        // HARD OVERRIDE (Wayne): if the stored truthStatus is a final verdict, force completed display.
        if (isFinalTruthStatus) {
          ;(r as any).gateLocked = false
          section = 'completed'
          progress = 100
          // Show verdict badge/details on completed cards (Wayne is Pro; also avoids "TESTING 100%" confusion).
          showVerdict = true
          badge = badgeFromTruth(truthStatusRaw)
        } else
        if (!is_implicit) {
          ;(r as any).gateLocked = false
          if (!has_final_verdict) {
            section = 'testing'
            label = 'Actively testing'
            subtext = 'Waiting for more data...'
          } else {
            section = 'completed'
            progress = 100
            showVerdict = (userTier === 'pro')
          }
        } else {
          ;(r as any).gateLocked = false
          if (is_gate_locked) {
            section = 'testing'
            // ensure cap (upload formula already applied upstream)
            const raw = Number((r as any)?.uploadProgress ?? r.progressPercent ?? 0)
            progress = raw <= 0 ? 0 : Math.min(95, Math.max(5, raw))
            badge = { key: 'testing', text: '◐ TESTING' }
            label = 'Signal from historical data'
            const x = Number((r as any)?.explicitCleanCheckins || 0)
            subtext = `Check-ins completed: ${x} of ${confirmReq}`
            showVerdict = false
          } else {
            if (has_final_verdict) {
              section = 'completed'
              progress = 100
              showVerdict = (userTier === 'pro')
              // Ensure badge reflects actual verdict (not testing)
              badge = ecToBadge[ec] || badge
            } else {
              section = 'testing'
              const raw = Number((r as any)?.uploadProgress ?? r.progressPercent ?? 0)
              progress = raw <= 0 ? 0 : Math.min(95, Math.max(5, raw))
              badge = { key: 'testing', text: '◐ TESTING' }
              label = 'Signal from historical data'
              subtext = 'Building toward a verdict...'
              showVerdict = false
            }
          }
        }
        // Free-tier completed rows should show locked verdict badge text
        if (section === 'completed' && !showVerdict) {
          badge = { key: 'locked', text: 'Verdict ready ✓' }
        }
        // Debug logs for Danny cases
        try {
          const truth_status: any = (r as any).effectCategory || ((r as any).display?.badgeKey ?? null)
          if (String(r.name || '').toLowerCase().includes('doctor\'s best') ||
              String(r.name || '').toLowerCase().includes('collagenup') ||
              String(r.name || '').toLowerCase().includes('multivitamin')) {
            console.log('[DISPLAY-STATE]', {
              id: r.id,
              name: r.name,
              analysis_source,
              truth_status,
              is_implicit,
              created_at: createdIso || null,
              supplement_age_days,
              totalUserCheckins,
              is_gate_locked,
              resolved: { section, progress, badgeKey: badge.key, badgeText: badge.text, showVerdict }
            })
          }
        } catch {}
        // Persist back on row for clients to consume
        r.progressPercent = progress
        ;(r as any).display = {
          section,
          badgeKey: badge.key,
          badgeText: badge.text,
          label,
          subtext,
          showVerdict
        }
      } catch {}
    }

    // Compute progress state labels and weighted stack progress
    const stateFor = (p: number): { label: string; color: 'gray'|'amber'|'green' } => {
      if (p <= 15) return { label: 'Collecting baseline', color: 'gray' }
      if (p <= 40) return { label: '◐ TESTING', color: 'gray' }
      if (p <= 70) return { label: 'Signal emerging', color: 'amber' }
      if (p <= 90) return { label: 'Approaching verdict', color: 'amber' }
      if (p < 100) return { label: 'Verdict pending', color: 'green' }
      return { label: 'Ready for verdict', color: 'green' }
    }
    for (const r of progressRows) {
      ;(r as any).progressState = stateFor(r.progressPercent).label
    }
    const totalCost = progressRows.reduce((s, r) => s + (Number(r.monthlyCost || 0)), 0)
    // Overall clarity progress = arithmetic mean of individual progress to ensure monotonicity:
    // if all individuals decrease, overall cannot increase.
    const stackProgress = Math.round(
      progressRows.reduce((s, r) => {
        const isImplicit = String(((r as any)?.analysisSource || '')).toLowerCase() === 'implicit'
        const pct = isImplicit ? Number((r as any)?.uploadProgress || r.progressPercent || 0) : r.progressPercent
        return s + pct
      }, 0) / Math.max(progressRows.length, 1)
    )

    // Compute readiness and derived summary fields (used by client for gating)
    for (const r of progressRows) {
      try {
        const onClean = Number((r as any).daysOnClean || (r as any).daysOn || 0)
        const offClean = Number((r as any).daysOffClean || (r as any).daysOff || 0)
        const reqOn = Number((r as any).requiredOnDays || r.requiredDays || 14)
        const reqOff = Number((r as any).requiredOffDays || Math.min(5, Math.max(3, Math.round((r.requiredDays || 14) / 4))))
        const isReady = onClean >= reqOn && offClean >= reqOff
        ;(r as any).isReady = isReady
        // If implicit and confirmatory threshold not met at USER level or per-supp timing, do not mark ready yet
        try {
          const isImp = String((r as any)?.analysisSource || '').toLowerCase() === 'implicit'
          const createdIso = String(((r as any)?.createdAtIso || '')).slice(0,10)
          const createdMs = createdIso ? Date.parse(`${createdIso}T00:00:00Z`) : NaN
          const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000
          const createdWithin7Days = Number.isFinite(createdMs) ? (createdMs >= sevenDaysAgoMs) : false
          let hasCheckinAfterAdd = false
          if (createdIso) {
            for (const d of allEntryDatesSet) { if (String(d) > createdIso) { hasCheckinAfterAdd = true; break } }
          }
          const extraGate = createdWithin7Days && !hasCheckinAfterAdd
          const req = Math.max(1, Number((r as any)?.confirmCheckinsRequired || 3))
          const perSuppCheckins = Number((r as any)?.explicitCleanCheckins || 0)
          if (isImp && ((perSuppCheckins < req) || extraGate)) {
            ;(r as any).isReady = false
          }
        } catch {}
        // Verdict mapping (if effect category present)
        const cat = String((r as any).effectCategory || '').toLowerCase()
        let verdict =
          cat === 'works' ? 'keep' :
          cat === 'no_effect' ? 'no_clear_signal' :
          cat === 'no_detectable_effect' ? 'no_clear_signal' :
          cat === 'negative' ? 'drop' :
          cat === 'inconsistent' ? 'testing' :
          cat === 'needs_more_data' ? 'testing' :
          isReady ? 'unclear' : null
        // For implicit analyses, allow KEEP/DROP when implicit verdict exists; otherwise remain testing
        // Hard override: if latest truth status is 'too_early', force Testing badge
        try {
          const uid = (r as any).userSuppId || nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())
          const ts = uid ? (truthBySupp.get(String(uid))?.status || '').toLowerCase() : ''
          if (ts === 'too_early') verdict = 'testing'
        } catch {}
        ;(r as any).verdict = verdict
        ;(r as any).effectPercent = typeof r.effectPct === 'number' ? Math.round(r.effectPct) : null
        ;(r as any).effectMetric = (cat === 'works' || cat === 'no_effect' || cat === 'inconsistent') ? 'energy' : null
        if (typeof r.confidence === 'number') {
          const c = Math.round(r.confidence as number)
          ;(r as any).confidenceText = c >= 80 ? 'high' : c >= 60 ? 'medium' : 'low'
        } else {
          ;(r as any).confidenceText = null
        }
        // Remove heuristic inconclusive text; rely solely on truth report mapping
        ;(r as any).inconclusiveReason = null
        ;(r as any).inconclusiveText = null
      } catch {}
    }

    // Auto-transition: if a testing supplement reached 100%, set status to 'complete' when significant, else 'inconclusive'
    try {
      for (const r of progressRows as any[]) {
        const uid = (r as any).userSuppId || nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())
        if (!uid) continue
        const currentStatus = testingStatusById.get(String(uid)) || 'inactive'
        const isTestingNow = currentStatus === 'testing'
        if (isTestingNow && r.progressPercent >= 100) {
          const insight = insightsById.get(String((r as any).id))
          const significant = !!(insight && String((insight as any).status || '').toLowerCase() === 'significant')
          const target: 'complete' | 'inconclusive' = significant ? 'complete' : 'inconclusive'
          await (supabase as any)
            .from('user_supplement')
            .update({ testing_status: target } as any)
            .eq('id', uid as any)
            .eq('user_id', user.id)
        }
      }
    } catch (e) {
      console.log('[progress/loop] auto-transition error:', (e as any)?.message || e)
    }

    // Debug: cards before section filtering
    try {
      console.log('[progress-loop] cards before filter:', {
        count: progressRows.length,
        sample: progressRows.slice(0, 12).map((r: any) => ({
          id: String(r?.id || ''),
          name: String(r?.name || ''),
          effectCategory: String((r as any)?.effectCategory || '').toLowerCase(),
          verdict: String((r as any)?.verdict || '').toLowerCase(),
          progressPercent: Number(r?.progressPercent || 0),
          isReady: Boolean((r as any)?.isReady || false)
        }))
      })
    } catch {}

    // Gate rule (simplified): For implicit supplements, LOCK unless (final verdict exists AND total user check-ins >=3).
    try {
      for (const r of progressRows as any[]) {
        // BUG 44: If a truth report exists, it is authoritative. Do not apply any additional "check-in gate"
        // that would hide/hold the verdict and keep the card stuck in TESTING.
        try {
          const uid = (r as any)?.userSuppId ? String((r as any).userSuppId) : ''
          const hasTruth = Boolean(uid && (truthBySupp.has(uid) || implicitTruthBySupp.has(uid)))
          if (hasTruth) {
            continue
          }
        } catch {}
        const isImp = String((r as any)?.analysisSource || '').toLowerCase() === 'implicit'
        const cat = String((r as any).effectCategory || '').toLowerCase()
        const hasFinal = (cat === 'works' || cat === 'no_effect' || cat === 'no_detectable_effect' || cat === 'negative' || cat === 'proven_positive')
        const req = Math.max(1, Number((r as any)?.confirmCheckinsRequired || 3))
        // Gate is per-supplement: count explicit daily_entries check-ins since this supplement was added.
        const perSuppCheckins = Number((r as any)?.explicitCleanCheckins || 0)
        const gateApplies = isImp && !(hasFinal && perSuppCheckins >= req)
        if (gateApplies) {
          if ((r as any).effectCategory) {
            (r as any).heldEffectCategory = (r as any).effectCategory
            ;(r as any).effectCategory = undefined
          }
          ;(r as any).isReady = false
          if (Number(r.progressPercent || 0) > 80) {
            r.progressPercent = 80
          }
          // Ensure client-side grouping keeps this in Testing by neutralizing verdict
          ;(r as any).verdict = 'testing'
        }
      }
    } catch {}
    // Compute total user check-in days (any supplement_intake present; do not exclude confounds)
    // Note: declared earlier due to use in row calculations
    // Apply exclusion filter (inactive/archived supplements should not appear on dashboard)
    const visibleRows = progressRows.filter(r => !(r as any)._excluded)
    if (dbg) {
      try { console.log('[dbg] visibleRows', { count: visibleRows.length }) } catch {}
      try { debugTrace.steps.push({ step: 'visibleRows', count: visibleRows.length }) } catch {}
    }
    // Group sections per rules (do not hide 100%+ without verdict):
    // - Clear Effects Detected: effectCategory='works'
    // - No Effect Detected: effectCategory='no_effect'
    // - Negative: effectCategory='negative' (final verdict; include in noSignal)
    // - Inconsistent: effectCategory='inconsistent'
    // - Needs Data: effectCategory='needs_more_data'
    // - Building: no effectCategory (includes <100% and 100% "Ready for verdict")
    const clearSignal = visibleRows.filter(r => (r as any).effectCategory === 'works')
    const noEffect = visibleRows.filter(r => {
      const cat = String((r as any).effectCategory || '').toLowerCase()
      return cat === 'negative' || cat === 'no_effect' || cat === 'no_detectable_effect'
    })
    const inconsistent = visibleRows.filter(r => (r as any).effectCategory === 'inconsistent')
    const needsData = visibleRows.filter(r => (r as any).effectCategory === 'needs_more_data')
    const building = visibleRows.filter(r => !(r as any).effectCategory)
    if (dbg) {
      try {
        const sectionCounts = { clearSignal: clearSignal.length, noSignal: noEffect.length, inconsistent: inconsistent.length, needsData: needsData.length, building: building.length }
        console.log('[dbg] sections', sectionCounts)
        debugTrace.steps.push({ step: 'sections', ...sectionCounts })
      } catch {}
    }

    // Debug: log every supplement row and where it landed (Issue 1).
    if (TRACE_BUCKETS) {
      try {
        const bucketOf = (r: any) => {
          const cat = String((r as any)?.effectCategory || '').toLowerCase()
          if (cat === 'works') return 'clearSignal'
          if (cat === 'negative') return 'negative'
          if (cat === 'no_effect' || cat === 'no_detectable_effect') return 'noSignal'
          if (cat === 'inconsistent') return 'inconsistent'
          if (cat === 'needs_more_data') return 'needsData'
          return 'building'
        }
        const rows = (visibleRows || []).map((r: any) => {
          const uid = String((r as any)?.userSuppId || '')
          const truth = uid ? truthBySupp.get(uid) : undefined
          const impTruth = uid ? implicitTruthBySupp.get(uid) : undefined
          const meta = uid ? suppMetaById.get(uid) : undefined
          return {
            bucket: bucketOf(r),
            rowId: String((r as any)?.id || ''),
            userSuppId: uid || null,
            name: String((r as any)?.name || ''),
            testing_status: uid ? (testingStatusById.get(uid) || null) : null,
            is_active: undefined, // not loaded here; see items source log above
            effectCategory: String((r as any)?.effectCategory || '').toLowerCase() || null,
            verdict: String((r as any)?.verdict || '').toLowerCase() || null,
            hasTruth: Boolean(truth || impTruth),
            truthStatus: (truth as any)?.status || (impTruth as any)?.status || null,
            analysisSource: String((r as any)?.analysisSource || '') || null,
            retest_started_at: (meta as any)?.restart || null,
          }
        })
        console.log('[progress/loop][TRACE] bucket placement:', {
          userId: user.id,
          rowsCount: rows.length,
          rows,
          counts: rows.reduce((acc: any, x: any) => { acc[x.bucket] = (acc[x.bucket] || 0) + 1; return acc }, {})
        })
      } catch {}
    }

    // Debug: cards after section filtering
    try {
      console.log('[progress-loop] cards after filter:', {
        clearSignal: clearSignal.length,
        noEffect: noEffect.length,
        inconsistent: inconsistent.length,
        needsData: needsData.length,
        building: building.length,
        sampleClear: clearSignal.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name })),
        sampleNoEffect: noEffect.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name })),
        sampleBuilding: building.slice(0, 5).map((r: any) => ({ id: r.id, name: r.name })),
      })
    } catch {}

    // Today’s progress + next likely
    const todaysProgress = {
      streakDays: await getStreakDays(supabase, user.id),
      // Only "works" belongs in "improved" messaging; keep negative/no-signal out even if present in completed buckets.
      improved: clearSignal
        .filter(r => String((r as any)?.effectCategory || '').toLowerCase() === 'works')
        .slice(0, 2)
        // IMPORTANT: effectPct is already a human-scale magnitude (usually truth.percent_change, i.e. a real % value).
        // Never multiply by 100 here — that would accidentally scale Cohen's d (effect_size) and/or double-scale % change.
        .map(r => ({ name: r.name, delta: Math.round(Number(r.effectPct || 0)) })),
      almostReady: building
        .filter(r => r.progressPercent >= 90)
        .slice(0, 2)
        .map(r => ({ name: r.name, percent: r.progressPercent, etaDays: Math.max(0, r.requiredDays - r.daysOfData) })),
      phase: getPhaseLabel(Math.max(...visibleRows.map(r => r.daysOfData), 0)) // rough phase by max days of data
    }
    // Next result likely
    try {
      const allCandidates = progressRows.filter(r => (r as any).testingActive && r.progressPercent < 100)
      try {
        console.log('[NEXT-RESULT] all candidates:', allCandidates.map((c: any) => ({
          name: c.name,
          daysOn: (c as any).daysOnClean ?? (c as any).daysOn ?? 0,
          daysOff: (c as any).daysOffClean ?? (c as any).daysOff ?? 0,
          analysisSource: (c as any).analysisSource
        })))
      } catch {}
      const candidates = allCandidates.filter(r => {
        const onClean = Number((r as any).daysOnClean ?? (r as any).daysOn ?? 0)
        const offClean = Number((r as any).daysOffClean ?? (r as any).daysOff ?? 0)
        return (onClean + offClean) > 0
      })
      try {
        console.log('[NEXT-RESULT] filtered candidates:', candidates.map((c: any) => ({ name: c.name })))
      } catch {}
      if (candidates.length > 0) {
        const next = candidates.sort((a, b) => (b.progressPercent - a.progressPercent))[0]
        const nm = (next as any).name || 'Supplement'
        const cat = inferCategory(nm, (next as any).primary_goal_tags)
        const remaining = Math.max(0, next.requiredDays - next.daysOfData)
        const rnd = Math.floor(hash01(String(next.id) + new Date().toISOString().slice(0,10)) * 3)
        let est = remaining
        if (cat === 'sleep') est = remaining + (rnd - 1)
        else if (cat === 'cognitive') est = remaining + rnd
        else est = remaining + rnd
        ;(todaysProgress as any).nextLikely = { name: nm, estimate: `~${Math.max(0, est)} days` }
      }
    } catch {}

    // Build debug payload
    const supplementStartDates: Record<string, string | null> = {}
    for (const it of items || []) {
      const name = (it as any).name || 'Supplement'
      const sdRaw = (it as any).start_date || (it as any).inferred_start_at
      const sd = sdRaw ? String(sdRaw).slice(0,10) : null
      supplementStartDates[name] = sd
    }
    const debug = {
      userId: user.id,
      totalDailyEntries: (entries365 || []).length > 0 ? (entries365 || []).length : distinctCheckinDays.size,
      cleanDatesCount: cleanDatesSet.size,
      cleanDates: Array.from(cleanDatesSet).sort().slice(0, 10),
      supplementStartDates,
      queryTable,
      supplementsFound: (items || []).length,
      supplementQueryError: lastQueryError
    }

    try {
      console.log('[progress/loop] sections', {
        clearSignal: clearSignal.length,
        noSignal: noEffect.length,
        inconsistent: inconsistent.length,
        building: building.length,
        needsData: needsData.length
      })
    } catch {}
    // Rotation intelligence
    // Build ON/OFF requirement status per supplement id to prioritize OFF-day needs
    const progressById: Record<string, { daysOn: number; daysOff: number; reqOn: number; reqOff: number; daysOfData: number }> = {}
    try {
      for (const r of progressRows) {
        const id = String((r as any).id || '')
        if (!id) continue
        const isImplicit = String(((r as any)?.analysisSource || '')).toLowerCase() === 'implicit'
        // Prefer clean counts; implicit rows will have daysOnClean/daysOffClean injected from implicit truth
        const daysOn = isImplicit ? Number((r as any).daysOnClean ?? (r as any).daysOn ?? 0) : Number((r as any).daysOn ?? 0)
        const daysOff = isImplicit ? Number((r as any).daysOffClean ?? (r as any).daysOff ?? 0) : Number((r as any).daysOff ?? 0)
        const reqOn = Number((r as any).requiredDays || 14)
        const reqOff = Math.min(5, Math.max(3, Math.round(reqOn / 4)))
        const daysOfData = Number((r as any).daysOfData || 0)
        progressById[id] = { daysOn, daysOff, reqOn, reqOff, daysOfData }
      }
    } catch {}
    // Build stack items exclusively from testing-active supplements to drive rotation
    const stackItems = progressRows
      .filter(r => (r as any).testingActive && r.progressPercent < 100)
      .map((r: any) => {
        const cat = inferCategory(String(r?.name || ''), ((r as any)?.category ? [String((r as any).category)] : []))
        const cost = Number(r?.monthlyCost || 0)
        return { id: String(r?.id), name: String(r?.name || 'Supplement'), category: cat, monthlyCost: cost }
      })
    const stackSize = stackItems.length
    const groupsByCategory = new Map<string, typeof stackItems>()
    for (const s of stackItems) {
      const arr = groupsByCategory.get(s.category) || []
      arr.push(s)
      groupsByCategory.set(s.category, arr)
    }
  // Add a synthetic priority group for items with met ON requirement but lacking OFF days
  try {
    const priorityAll = (stackItems || []).filter(s => {
      const p = progressById[s.id]
      if (!p) return false
      const onMet = p.daysOn >= p.reqOn
      const offDef = Math.max(0, p.reqOff - p.daysOff)
      return onMet && offDef > 0
    })
    // Log top-5 needs based on OFF deficits with implicit-aware counts
    const top5 = priorityAll
      .map(s => {
        const p = progressById[s.id]
        return {
          name: s.name,
          on: p.daysOn,
          off: p.daysOff,
          reqOn: p.reqOn,
          reqOff: p.reqOff,
          onMet: p.daysOn >= p.reqOn,
          offDef: Math.max(0, p.reqOff - p.daysOff)
        }
      })
      .sort((a, b) => b.offDef - a.offDef)
      .slice(0, 5)
    console.log('[rotation-debug] top5', top5)
    if (priorityAll.length > 0) {
      groupsByCategory.set('priority_override', priorityAll as any)
    }
  } catch {}
    const categoryPriority = ['sleep','energy','mood','stress','recovery','cognitive','digestion','other']
    const groupEntries = Array.from(groupsByCategory.entries()).sort((a, b) => {
      const costA = a[1].reduce((sum, s) => sum + (s.monthlyCost || 0), 0)
      const costB = b[1].reduce((sum, s) => sum + (s.monthlyCost || 0), 0)
      if (costB !== costA) return costB - costA
      return categoryPriority.indexOf(a[0]) - categoryPriority.indexOf(b[0])
    })
    const skipPerCycle = (n: number) => {
      if (n <= 4) return 1
      if (n <= 8) return 2
      if (n <= 15) return 3
      return Number.MAX_SAFE_INTEGER // entire category
    }
    const cycleLenDays = 3
    const baselineDaysNeeded = 3
    // New supplements should build baseline before OFF days are scheduled
    const perItemBaselineDays = 3
    const rotation: any = {}
    // Collect eligible candidates that need OFF days (testing-active, not complete)
    const testingCandidates = progressRows.filter(r => (r as any).testingActive && r.progressPercent < 100)
    const offNeedCandidates = testingCandidates.filter(r => {
      const id = String((r as any).id || '')
      const p = id ? (progressById[id] || null) : null
      if (!p) return false
      // Require a few baseline days before considering OFF scheduling
      if (p.daysOfData < perItemBaselineDays) return false
      return p.daysOff < p.reqOff
    })
    try {
      console.log('[rotation] eligibility', {
        testingCandidates: testingCandidates.length,
        offNeedCandidates: offNeedCandidates.length,
        stackSize,
        groupEntries: groupEntries.length,
        totalProgressRows: progressRows.length,
      })
    } catch {}
    if (totalDistinctDays < baselineDaysNeeded) {
      rotation.phase = 'baseline'
      rotation.action = {
        headline: "TODAY'S ACTION",
        primary: 'Take your supplements as normal.',
        note: `We\'re establishing your baseline. Rotation starts in ${Math.max(0, baselineDaysNeeded - totalDistinctDays)} day(s).`
      }
    } else if (groupEntries.length > 0) {
      rotation.phase = 'rotation'
      const cycleIndex = Math.floor((totalDistinctDays - baselineDaysNeeded) / cycleLenDays)
      // Choose category to prioritize supplements that need OFF days first
      let bestIdx = -1
      let bestScore = -1
      for (let i = 0; i < groupEntries.length; i++) {
        const [, groupSupps] = groupEntries[i]
        const score = groupSupps.reduce((acc, s) => {
          const p = progressById[s.id]
          if (!p) return acc
          const onMet = p.daysOn >= p.reqOn
          const offDeficit = Math.max(0, p.reqOff - p.daysOff)
          return acc + (onMet && offDeficit > 0 ? (100 + offDeficit) : 0)
        }, 0)
        if (score > bestScore) {
          bestScore = score
          bestIdx = i
        }
      }
      const groupIdx = bestIdx >= 0 ? bestIdx : (cycleIndex % groupEntries.length)
      const [cat, groupSupps] = groupEntries[groupIdx]
      try {
        // Debug chosen category and its OFF‑day need score
        const debugScores = groupSupps.map(s => {
          const p = progressById[s.id]
          const onMet = p ? (p.daysOn >= p.reqOn) : false
          const offDef = p ? Math.max(0, p.reqOff - p.daysOff) : 0
          const needOffScore = onMet && offDef > 0 ? (100 + offDef) : 0
        return {
            id: s.id,
            name: s.name,
            category: s.category,
            monthlyCost: s.monthlyCost || 0,
            daysOn: p?.daysOn ?? null,
            daysOff: p?.daysOff ?? null,
            reqOn: p?.reqOn ?? null,
            reqOff: p?.reqOff ?? null,
            onMet,
            offDef,
            score: needOffScore
          }
        })
        const topPreview = [...debugScores]
          .sort((a, b) => (b.score - a.score) || (b.monthlyCost - a.monthlyCost))
          .slice(0, 5)
        console.log('[rotation-debug] chosenCategory:', cat, 'categoryIndex:', groupIdx)
        console.log('[rotation-debug] top5 (by need OFF days):', topPreview)
        rotationDebug = { chosenCategory: String(cat), categoryIndex: Number(groupIdx), top5: topPreview }
      } catch (e) {
        console.log('[rotation-debug] log error:', (e as any)?.message || e)
      }
      const toSkipCount = Math.min(skipPerCycle(stackSize), groupSupps.length)
      const skipList = [...groupSupps]
        // Exclude very new supplements from OFF scheduling
        .filter(s => {
          const p = progressById[s.id]
          return p ? p.daysOfData >= perItemBaselineDays : false
        })
        .sort((a, b) => {
          const pa = progressById[a.id]; const pb = progressById[b.id]
          const aOnMet = pa ? (pa.daysOn >= pa.reqOn) : false
          const bOnMet = pb ? (pb.daysOn >= pb.reqOn) : false
          const aOffDef = pa ? Math.max(0, pa.reqOff - pa.daysOff) : 0
          const bOffDef = pb ? Math.max(0, pb.reqOff - pb.daysOff) : 0
          // Priority: need OFF days (onMet && offDeficit>0), then larger deficit, then higher monthly cost
          const aNeed = aOnMet && aOffDef > 0 ? 1 : 0
          const bNeed = bOnMet && bOffDef > 0 ? 1 : 0
          if (bNeed !== aNeed) return bNeed - aNeed
          if (bOffDef !== aOffDef) return bOffDef - aOffDef
          return (b.monthlyCost || 0) - (a.monthlyCost || 0)
        })
        .slice(0, toSkipCount)
      const skipIds = new Set(skipList.map(s => s.id))
      const takeList = stackItems.filter(s => !skipIds.has(s.id))
      const reasonByCat: Record<string, string> = {
        sleep: "This helps us isolate what's affecting your sleep.",
        energy: "This helps us isolate what impacts your daytime energy.",
        mood: "This helps us isolate mood-related effects.",
        stress: "This helps us isolate stress-related effects.",
        recovery: "This helps us isolate recovery and inflammation effects.",
        cognitive: "This helps us isolate cognitive effects.",
        digestion: "This helps us isolate digestion effects.",
        other: "This helps us isolate effects in this category."
      }
      // If the category pass did not pick anyone but we have deficits, schedule a fallback single OFF
      if (skipList.length === 0 && offNeedCandidates.length > 0) {
        try {
          // Deterministic pick based on day index
          const todayStr = new Date().toISOString().slice(0,10)
          const hash01 = (s: string): number => {
            let h = 2166136261
            for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0 }
            return h % 1000 / 1000
          }
          const idx = Math.floor(hash01(todayStr) * offNeedCandidates.length)
          const chosen = offNeedCandidates[idx]
          const chosenId = String((chosen as any)?.id)
          const chosenName = String((chosen as any)?.name || 'Supplement')
          const takeListFallback = stackItems.filter(s => s.id !== chosenId)
          rotation.action = {
            headline: "TODAY'S ACTION",
            skipCategory: 'priority_override',
            skip: [{ id: chosenId, name: chosenName }],
            take: takeListFallback.map(s => ({ id: s.id, name: s.name })),
            reason: "This supplement needs OFF days to complete testing."
          }
          console.log('[rotation] fallback scheduled OFF:', { chosenId, chosenName })
        } catch (e) {
          console.log('[rotation] fallback error:', (e as any)?.message || e)
          rotation.action = {
            headline: "TODAY'S ACTION",
            primary: 'Take your supplements as normal.',
            note: "Rotation fallback failed to select a skip candidate."
          }
        }
      } else {
        rotation.action = {
          headline: "TODAY'S ACTION",
          skipCategory: cat,
          skip: skipList.map(s => ({ id: s.id, name: s.name })),
          take: takeList.map(s => ({ id: s.id, name: s.name })),
          reason: reasonByCat[cat] || "This helps us isolate category effects."
        }
      }
    }
    try { console.log('[loop] todaySummary being returned:', todaySummary) } catch {}
    // Build today's actual skipped names from supplement_intake if available
    let todaySkippedNames: string[] | undefined = undefined
    try {
      const intakeToday = intakeByDate.get(todayKey)
      if (intakeToday && typeof intakeToday === 'object') {
        const offKeys = Object.keys(intakeToday).filter(k => {
          const v = (intakeToday as any)[k]
          const vn = String(v).toLowerCase()
          return v === 'off' || v === 'skipped' || vn === 'false' || vn === '0'
        })
        if (offKeys.length > 0) {
          todaySkippedNames = offKeys.map(k => userSuppIdToName.get(String(k)) || String(k))
        }
      }
    } catch {}
    // Supplements flat array with state fields for client UI
    const supplements = visibleRows.map(r => {
      const uid = (r as any).userSuppId || nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())
      const testingStatus = uid ? (testingStatusById.get(String(uid)) || null) : null
      const insight = insightsById.get(String((r as any).id))
      const significant = !!(insight && String((insight as any).status || '').toLowerCase() === 'significant')
      const cat = String((r as any)?.effectCategory || '').toLowerCase()
      const isFinal = cat === 'works' || cat === 'negative' || cat === 'no_effect' || cat === 'no_detectable_effect'
      const effectiveStatus = isFinal ? 'complete' : (testingStatus || 'inactive')
      const progressOut = isFinal ? 100 : r.progressPercent
      return {
        id: r.id,
        name: r.name,
        testing_status: effectiveStatus,
        progressPercent: progressOut,
        isStatisticallySignificant: significant,
      }
    })
    try {
      console.log('[progress-loop] supplements payload sample:', supplements.slice(0, 10))
    } catch {}
    const responsePayload = {
      _v: DASHBOARD_CACHE_VERSION,
      debug,
      ...(dbg ? { _debugTrace: debugTrace } : {}),
      userId: user.id,
      daysTracked: totalDistinctDays,
      firstCheckin,
      latestCheckin,
      todaysProgress,
      rotation,
      stackProgress,
      supplements,
      checkins: {
        totalDistinctDays,
        hasCheckedInToday,
        todaySummary,
        gapsDays,
        todaySkippedNames,
        last30: {
          total: totalLast30,
          noise: noiseEvents,
          clean: cleanLast30,
          tagCounts: tagCountsLast30,
        },
        last7: {
          total: totalLast7,
          noise: noiseEvents7,
          clean: cleanLast7,
          tagCounts: tagCountsLast7,
        },
      },
      _debug: rotationDebug,
      sections: { clearSignal, noSignal: noEffect, inconsistent, building, needsData }
    }
    try {
      const ts = new Date().toISOString()
      await supabaseAdmin
        .from('dashboard_cache')
        .upsert({
          user_id: user.id,
          payload: responsePayload,
          computed_at: ts
        } as any, { onConflict: 'user_id' } as any)
      try { console.log('CACHE WRITE', { computed_at: ts, size: JSON.stringify(responsePayload).length }) } catch {}
    } catch (e) { try { console.log('[dashboard_cache] write error (ignored):', (e as any)?.message || e) } catch {} }
    return new NextResponse(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    })
  } catch (error: any) {
    console.error('[progress/loop] FATAL ERROR:', error?.message || error)
    console.error('[progress/loop] STACK:', error?.stack)
    return NextResponse.json({
      error: 'Internal server error',
      message: error?.message,
      stack: error?.stack
    }, { status: 500 })
  }
}

async function getStreakDays(supabase: any, userId: string): Promise<number> {
  // Use daily_entries.local_date so streak counts any source of check-ins
  const since = new Date()
  since.setDate(since.getDate() - 60)
  const { data } = await supabase
    .from('daily_entries')
    .select('local_date')
    .eq('user_id', userId)
    .gte('local_date', since.toISOString().slice(0,10))
    .order('local_date', { ascending: false })
  let set = new Set<string>((data || []).map((c: any) => String((c as any).local_date).slice(0,10)))
  // Fallback to checkin.created_at if daily_entries is empty
  if (set.size === 0) {
    const { data: ch } = await supabase
      .from('checkin')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
    set = new Set<string>(
      (ch || [])
        .map((c: any) => {
          try {
            const t = (c as any).created_at
            const d = t ? new Date(t) : null
            return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0,10) : ''
          } catch {
            return ''
          }
        })
        .filter(Boolean)
    )
  }
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  let start = todayStr
  if (!set.has(todayStr)) {
    if (set.has(yesterdayStr)) start = yesterdayStr
    else return 0
  }
  let streak = 0
  let cursor = new Date(start)
  while (true) {
    const key = cursor.toISOString().split('T')[0]
    if (set.has(key)) {
      streak += 1
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000)
    } else {
      break
    }
  }
  return streak
}

// Implicit signal strength should be derived from real ON/OFF sample days + check-in confirmation progress.
// Key: avoid fixed floors (e.g. 50%) and ensure varied values across different supplements.
function computeImplicitSignalStrength(args: {
  sampleDaysOn: number
  sampleDaysOff: number
  checkInsCompleted: number
  checkInsRequired: number
  onThreshold: number
  offThreshold: number
}): number {
  const sampleDaysOn = Math.max(0, Number(args.sampleDaysOn || 0))
  const sampleDaysOff = Math.max(0, Number(args.sampleDaysOff || 0))
  const checkInsCompleted = Math.max(0, Number(args.checkInsCompleted || 0))
  const checkInsRequired = Math.max(1, Number(args.checkInsRequired || 3))
  const onThreshold = Math.max(1, Number(args.onThreshold || 1000))
  const offThreshold = Math.max(1, Number(args.offThreshold || 1000))

  // Component 1: Data completeness (0–40%)
  const onRatio = Math.min(sampleDaysOn / Math.max(onThreshold, 14), 1)
  const offRatio = Math.min(sampleDaysOff / Math.max(offThreshold, 5), 1)
  const dataCompleteness = (onRatio * 0.5 + offRatio * 0.5) * 40

  // Component 2: Balance (0–20%)
  const total = sampleDaysOn + sampleDaysOff
  const balance = total > 0 ? (1 - Math.abs(sampleDaysOn - sampleDaysOff) / total) : 0
  const balanceScore = balance * 20

  // Component 3: Check-in progress (0–30%)
  const checkinScore = (Math.min(checkInsCompleted, checkInsRequired) / checkInsRequired) * 30

  // Component 4: Volume bonus (0–10%)
  const volumeBonus = Math.min(total / 1000, 1) * 10

  const raw = dataCompleteness + balanceScore + checkinScore + volumeBonus
  return Math.round(Math.max(5, Math.min(95, raw)))
}

function computeConfirmCheckinsRequired(args: {
  analysisSource: string | null | undefined
  confidenceScore: number | null | undefined
  sampleDaysOn: number | null | undefined
  sampleDaysOff: number | null | undefined
}): number {
  const src = String(args.analysisSource || '').toLowerCase()
  if (src !== 'implicit') return 3
  const conf = typeof args.confidenceScore === 'number' ? args.confidenceScore : Number(args.confidenceScore || 0)
  const on = typeof args.sampleDaysOn === 'number' ? args.sampleDaysOn : Number(args.sampleDaysOn || 0)
  const off = typeof args.sampleDaysOff === 'number' ? args.sampleDaysOff : Number(args.sampleDaysOff || 0)
  // Bug 28: for strong implicit (wearables) analyses, require only 1 check-in to confirm engagement.
  if (Number.isFinite(conf) && conf >= 0.5 && on >= 30 && off >= 30) return 1
  return 3
}

function getPhaseLabel(day: number): string {
  if (day <= 3) return `Early analysis (Day ${day}/30)`
  if (day <= 10) return `Signal Building (Day ${day}/30)`
  if (day <= 21) return `Effects becoming clearer (Day ${day}/30)`
  return `Strong results phase (Day ${day}/30)`
}


