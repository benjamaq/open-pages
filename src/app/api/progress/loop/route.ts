import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { statusToCategory } from '@/lib/verdictMapping'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'

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
    try {
      const url = new URL(request.url)
      debugSuppId = url.searchParams.get('debugSuppId') || url.searchParams.get('dbg') || url.searchParams.get('supp')
    } catch {}
    // Attach rotation selection debug in response for easier inspection
    let rotationDebug: { chosenCategory?: string; categoryIndex?: number; top5?: any[] } = {}
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (VERBOSE) { try { console.log('[progress/loop] user:', user.id) } catch {} }

    // Resolve profile (auto-create minimal if missing)
    let { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
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
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        if (adminProfile) {
          profileId = (adminProfile as any).id
        }
      } catch {}
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
      .select('local_date,mood,energy,focus,sleep_quality,tags,skipped_supplements,supplement_intake')
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
    if (VERBOSE) {
      try {
        console.log('[progress/loop] items:', (items || []).length)
        console.log('[progress/loop] cleanDatesSet size:', cleanDatesSet.size, 'first5:', Array.from(cleanDatesSet).sort().slice(0,5))
      } catch {}
    }

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
          if (!intake || typeof intake !== 'object' || !suppId) continue
          if ((intake as any)[suppId] !== undefined) daysOfData++
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
        progressPercent,
        daysOfData,
        requiredDays,
        status,
        trend,
        effectPct,
        confidence,
        monthlyCost: typeof (it as any).monthly_cost === 'number' ? (it as any).monthly_cost : ((it as any).monthly_cost ? Number((it as any).monthly_cost) : null)
      })
    }

    // Attach effect categories when available (map by user_supplement_id; aligns with fallback path)
    // Also overlay with latest truth-engine reports for consistency with TruthReport
    const { data: effects } = await supabase
      .from('user_supplement_effect')
      .select('user_supplement_id,effect_category,effect_magnitude,effect_confidence,days_on,days_off,clean_days')
      .eq('user_id', user.id)
    const effBySupp = new Map<string, any>()
    for (const e of effects || []) effBySupp.set((e as any).user_supplement_id, e)
    // Load latest truth reports (ordered newest first); first seen per id wins
    const { data: truths } = await supabase
      .from('supplement_truth_reports')
      .select('user_supplement_id,status,effect_direction,effect_size,percent_change,confidence_score,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const truthBySupp = new Map<string, { status: string; effect_direction?: string | null; effect_size?: number | null; percent_change?: number | null; confidence_score?: number | null }>()
    for (const t of truths || []) {
      const uid = String((t as any).user_supplement_id || '')
      if (!uid) continue
      if (!truthBySupp.has(uid)) {
        truthBySupp.set(uid, {
          status: String((t as any).status || ''),
          effect_direction: (t as any).effect_direction ?? null,
          effect_size: (t as any).effect_size ?? null,
          percent_change: (t as any).percent_change ?? null,
          confidence_score: (t as any).confidence_score ?? null
        })
      }
    }
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
    // Map names -> user_supplement ids for when items are from stack_items
    const { data: userSuppRows } = await supabase
      .from('user_supplement')
      .select('id,name,retest_started_at,trial_number,testing_status')
      .eq('user_id', user.id)
    const nameToUserSuppId = new Map<string, string>()
    const userSuppIdToName = new Map<string, string>()
    const suppMetaById = new Map<string, { restart?: string | null; trial?: number | null; testing?: boolean; status?: string }>()
    const testingActiveIds = new Set<string>()
    const testingStatusById = new Map<string, string>()
    for (const u of userSuppRows || []) {
      const nm = String((u as any).name || '').trim().toLowerCase()
      const uid = String((u as any).id)
      if (nm) nameToUserSuppId.set(nm, uid)
      userSuppIdToName.set(uid, String((u as any).name || ''))
      const isTesting = String((u as any).testing_status || 'inactive') === 'testing'
      const status = String((u as any).testing_status || 'inactive')
      suppMetaById.set(uid, { restart: (u as any).retest_started_at ?? null, trial: (u as any).trial_number ?? null, testing: isTesting, status })
      if (isTesting) testingActiveIds.add(uid)
      testingStatusById.set(uid, status)
    }
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
        const byStack = stackIdToUserSuppId.get(String((r as any).id || '')) || null
        const explicitUid = byStack || (() => {
          try {
            const match = (items || []).find((it: any) => String(it?.name || '').trim().toLowerCase() === nm)
            return match && match.user_supplement_id ? String(match.user_supplement_id) : null
          } catch { return null }
        })()
        const uid = explicitUid || nameToUserSuppId.get(nm) || String((r as any).id)
        ;(r as any).testingActive = testingActiveIds.has(uid)
        ;(r as any).testingStatus = testingStatusById.get(String(uid)) || 'inactive'
        ;(r as any).userSuppId = uid
      } catch { (r as any).testingActive = true }
    }
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
        const uid = (r as any).userSuppId || (nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())) || String((r as any).id)
        // Ensure a relatively fresh truth exists; regenerate if missing or stale (>1h)
        try {
          const truthRec = uid ? (truths || []).find((t: any) => String((t as any).user_supplement_id || '') === String(uid)) : null
          const createdAt = truthRec ? (new Date((truthRec as any).created_at as any)).getTime() : 0
          const STALE_MS = 60 * 60 * 1000
          const stale = !truthRec || (Date.now() - createdAt > STALE_MS)
          if (stale && uid) {
            try { if (VERBOSE) console.log('[overlay-refresh] generating truth for', uid) } catch {}
            const fresh = await generateTruthReportForSupplement(user.id, uid)
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
              await supabase.from('supplement_truth_reports').insert(payloadToStore)
              // Seed the truth map immediately to avoid a requery race
              truthBySupp.set(String(uid), {
                status: String(fresh.status),
                effect_direction: fresh.effect.direction,
                effect_size: fresh.effect.effectSize,
                percent_change: fresh.effect.percentChange ?? null,
                confidence_score: fresh.confidence.score
              })
              if (VERBOSE) { try { console.log('[overlay-refresh] saved fresh truth for', uid, 'status=', String(fresh.status)) } catch {} }
            } catch (saveErr: any) {
              try { console.log('[overlay-refresh] save failed:', saveErr?.message || saveErr) } catch {}
            }
            // Requery latest truth for this UID
            try {
              const { data: latest } = await supabase
                .from('supplement_truth_reports')
                .select('user_supplement_id,status,effect_direction,effect_size,percent_change,confidence_score,created_at')
                .eq('user_id', user.id)
                .eq('user_supplement_id', uid)
                .order('created_at', { ascending: false })
                .limit(1)
              if ((latest || []).length > 0) {
                truthBySupp.set(String(uid), {
                  status: String((latest![0] as any).status || ''),
                  effect_direction: (latest![0] as any).effect_direction ?? null,
                  effect_size: (latest![0] as any).effect_size ?? null,
                  percent_change: (latest![0] as any).percent_change ?? null,
                  confidence_score: (latest![0] as any).confidence_score ?? null
                })
                if (VERBOSE) { try { console.log('[overlay-refresh] updated truth map for', uid, 'status=', String((latest![0] as any).status || '')) } catch {} }
              }
            } catch {}
          }
        } catch {}
        const truth = uid ? truthBySupp.get(String(uid)) : undefined
        const mapped = truth ? mapTruthToCategory(truth.status) : undefined
        if (mapped) {
          ;(r as any).effectCategory = mapped
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
              effectCategory: (r as any).effectCategory || null
            })
          } catch {}
        }
      } catch {}
      // Derive daysOn/Off from daily_entries intake; if retest is active, recompute from retest start
      try {
        const nm = String((r as any).name || '').trim().toLowerCase()
        // Prefer explicit linkage if available
        const explicitUid = (() => {
          try {
            const match = (items || []).find((it: any) => String(it?.name || '').trim().toLowerCase() === nm)
            return match && match.user_supplement_id ? String(match.user_supplement_id) : null
          } catch { return null }
        })()
        const suppId = explicitUid || nameToUserSuppId.get(nm) || String((r as any).id)
        ;(r as any).userSuppId = suppId
        const meta = (suppMetaById ? suppMetaById.get(suppId) : undefined)
        const restartIso: string | null = meta && (meta as any).restart ? String((meta as any).restart) : null
        // Always recompute to avoid stale effect table counts
        let on = 0, off = 0
        let onClean = 0, offClean = 0
        for (const entry of (entries365 || [])) {
          const dKey = String((entry as any).local_date).slice(0,10)
          if (restartIso && dKey < restartIso.slice(0,10)) continue
          const intake = (entry as any).supplement_intake || null
          let isOff = false
          let isTaken = false
          let hasRecord = false
          if (intake && typeof intake === 'object') {
            // Try multiple candidate keys to handle historical data keyed by stack_items.id
            const candidates = [suppId, String((r as any).id || '')].filter(Boolean)
            for (const k of candidates) {
              if (hasRecord) break
              const val = (intake as any)[k]
              if (val === undefined) continue
              hasRecord = true
              const s = String(val).toLowerCase()
              if (s === 'skipped' || s === 'off' || s === 'not_taken' || s === 'false' || s === '0') {
                isOff = true
              } else if (s === 'taken' || s === 'true' || s === '1') {
                isTaken = true
              }
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
        // Days tracked for this supplement = ON + OFF (any quality)
        ;(r as any).daysOfData = on + off
        if (restartIso) {
          ;(r as any).retestStartedAt = restartIso
          ;(r as any).trialNumber = (suppMetaById && suppMetaById.get(suppId) ? (suppMetaById.get(suppId) as any).trial : null) ?? null
          ;(r as any).effectCategory = undefined
          r.effectPct = null
          r.confidence = null
          r.trend = undefined
        }
        // Re-apply truth overlay AFTER any reset due to retest so category is not wiped
        try {
          const uid = (r as any).userSuppId || (nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())) || String((r as any).id)
          const truth = uid ? truthBySupp.get(String(uid)) : undefined
          const mapped = truth ? mapTruthToCategory(truth.status) : undefined
          if (mapped) {
            ;(r as any).effectCategory = mapped
            if (truth && typeof truth.percent_change === 'number') {
              r.effectPct = Number(truth.percent_change)
            } else if (truth && typeof truth.effect_size === 'number') {
              r.effectPct = Number(truth.effect_size)
            }
            if (truth && typeof truth.confidence_score === 'number') {
              r.confidence = Number(truth.confidence_score)
            }
          }
        } catch {}
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
        const finalPct = Math.max(0, Math.min(100, Math.round(evidencePct)))
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
        r.progressPercent = finalPct
        r.requiredDays = requiredDays
        // Persist required ON/OFF for client-side gating
        ;(r as any).requiredOnDays = requiredOnDays
        ;(r as any).requiredOffDays = requiredOffDays
      }
      catch {}
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
    const stackProgress = totalCost > 0
      ? Math.round(progressRows.reduce((s, r) => s + (r.progressPercent * (Number(r.monthlyCost || 0))), 0) / totalCost)
      : Math.round(progressRows.reduce((s, r) => s + r.progressPercent, 0) / Math.max(progressRows.length, 1))

    // Compute readiness and derived summary fields (used by client for gating)
    for (const r of progressRows) {
      try {
        const onClean = Number((r as any).daysOnClean || (r as any).daysOn || 0)
        const offClean = Number((r as any).daysOffClean || (r as any).daysOff || 0)
        const reqOn = Number((r as any).requiredOnDays || r.requiredDays || 14)
        const reqOff = Number((r as any).requiredOffDays || Math.min(5, Math.max(3, Math.round((r.requiredDays || 14) / 4))))
        const isReady = onClean >= reqOn && offClean >= reqOff
        ;(r as any).isReady = isReady
        // Verdict mapping (if effect category present)
        const cat = String((r as any).effectCategory || '').toLowerCase()
        let verdict =
          cat === 'works' ? 'keep' :
          cat === 'no_effect' ? 'drop' :
          cat === 'no_detectable_effect' ? 'drop' :
          cat === 'inconsistent' ? 'testing' :
          cat === 'needs_more_data' ? 'testing' :
          isReady ? 'unclear' : null
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
            .eq('id', uid)
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

    // Group sections per rules (do not hide 100%+ without verdict):
    // - Clear Effects Detected: effectCategory='works'
    // - No Effect Detected: effectCategory='no_effect'
    // - Inconsistent: effectCategory='inconsistent'
    // - Needs Data: effectCategory='needs_more_data'
    // - Building: no effectCategory (includes <100% and 100% "Ready for verdict")
    const clearSignal = progressRows.filter(r => (r as any).effectCategory === 'works')
    const noEffect = progressRows.filter(r => {
      const cat = String((r as any).effectCategory || '').toLowerCase()
      return cat === 'no_effect' || cat === 'no_detectable_effect'
    })
    const inconsistent = progressRows.filter(r => (r as any).effectCategory === 'inconsistent')
    const needsData = progressRows.filter(r => (r as any).effectCategory === 'needs_more_data')
    const building = progressRows.filter(r => !(r as any).effectCategory)

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
      improved: clearSignal.slice(0, 2).map(r => ({ name: r.name, delta: Math.round((r.effectPct || 0) * 100) })),
      almostReady: building
        .filter(r => r.progressPercent >= 90)
        .slice(0, 2)
        .map(r => ({ name: r.name, percent: r.progressPercent, etaDays: Math.max(0, r.requiredDays - r.daysOfData) })),
      phase: getPhaseLabel(Math.max(...progressRows.map(r => r.daysOfData), 0)) // rough phase by max days of data
    }
    // Next result likely
    try {
      const candidates = progressRows.filter(r => (r as any).testingActive && r.progressPercent < 100)
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
    const progressById: Record<string, { daysOn: number; daysOff: number; reqOn: number; reqOff: number }> = {}
    try {
      for (const r of progressRows) {
        const id = String((r as any).id || '')
        if (!id) continue
        const daysOn = Number((r as any).daysOn || 0)
        const daysOff = Number((r as any).daysOff || 0)
        const reqOn = Number((r as any).requiredDays || 14)
        const reqOff = Math.min(5, Math.max(3, Math.round(reqOn / 4)))
        progressById[id] = { daysOn, daysOff, reqOn, reqOff }
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
    const rotation: any = {}
    // Collect eligible candidates that need OFF days (testing-active, not complete)
    const testingCandidates = progressRows.filter(r => (r as any).testingActive && r.progressPercent < 100)
    const offNeedCandidates = testingCandidates.filter(r => {
      const id = String((r as any).id || '')
      const p = id ? (progressById[id] || null) : null
      return !!(p && p.daysOff < p.reqOff)
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
    const supplements = progressRows.map(r => {
      const uid = (r as any).userSuppId || nameToUserSuppId.get(String((r as any).name || '').trim().toLowerCase())
      const testingStatus = uid ? (testingStatusById.get(String(uid)) || 'inactive') : 'inactive'
      const insight = insightsById.get(String((r as any).id))
      const significant = !!(insight && String((insight as any).status || '').toLowerCase() === 'significant')
      return {
        id: r.id,
        name: r.name,
        testing_status: testingStatus,
        progressPercent: r.progressPercent,
        isStatisticallySignificant: significant,
      }
    })
    try {
      console.log('[progress-loop] supplements payload sample:', supplements.slice(0, 10))
    } catch {}
    return new NextResponse(JSON.stringify({
      debug,
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
    }), {
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

function getPhaseLabel(day: number): string {
  if (day <= 3) return `Early analysis (Day ${day}/30)`
  if (day <= 10) return `Signal Building (Day ${day}/30)`
  if (day <= 21) return `Effects becoming clearer (Day ${day}/30)`
  return `Strong results phase (Day ${day}/30)`
}


