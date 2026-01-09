import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
        .select('id,name,inferred_start_at,start_date,monthly_cost,created_at,primary_goal_tags,tags')
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
      const startDate = ((it as any).inferred_start_at as string | null) || ((it as any).start_date as string | null)
      const createdAtRaw = (it as any).created_at as string | null
      const goals = (it as any).primary_goal_tags || (it as any).tags || []
      const category = inferCategory(name, goals)

      // Days of data = ALL check-in days since start_date (count today's check-in even if noisy)
      // Clean/Noise is still tracked separately for insights, but baseline progress uses all days
      let daysOfData = 0
      // Prefer explicit start date; else created_at; else first entry date
      const effectiveStart = (startDate && String(startDate).slice(0,10)) || (createdAtRaw ? String(createdAtRaw).slice(0,10) : earliestEntryDate)
      if (effectiveStart) {
        const startKey = String(effectiveStart).slice(0,10)
        const startTs = toTs(startKey)
        // Prefer daily_entries dates; fallback to distinctCheckinDays if daily_entries empty
        const candidateDates = allEntryDatesSet.size > 0 ? Array.from(allEntryDatesSet) : Array.from(distinctCheckinDays)
        daysOfData = candidateDates.reduce((acc, d) => acc + (toTs(d) >= startTs ? 1 : 0), 0)
      } else {
        // If no explicit start date, use all entry days (not just clean)
        daysOfData = allEntryDatesSet.size > 0 ? allEntryDatesSet.size : distinctCheckinDays.size
      }
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
      if (VERBOSE) { try { console.log('[progress/loop] row:', { id, name, startDate: (it as any).inferred_start_at || (it as any).start_date, daysOfData, progressPercent }) } catch {} }

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
    const { data: effects } = await supabase
      .from('user_supplement_effect')
      .select('user_supplement_id,effect_category,effect_magnitude,effect_confidence,days_on,days_off,clean_days')
      .eq('user_id', user.id)
    const effBySupp = new Map<string, any>()
    for (const e of effects || []) effBySupp.set((e as any).user_supplement_id, e)
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
    // Mark rows with testingActive and optionally drop non-testing from rotation/progress candidates
    for (const r of progressRows) {
      try {
        const nm = String((r as any).name || '').trim().toLowerCase()
        const uid = nameToUserSuppId.get(nm) || String((r as any).id)
        ;(r as any).testingActive = testingActiveIds.has(uid)
        ;(r as any).testingStatus = testingStatusById.get(String(uid)) || 'inactive'
      } catch { (r as any).testingActive = true }
    }
    for (const r of progressRows) {
      const eff = effBySupp.get(r.id)
      if (eff) {
        // Normalize effect_category from various schemas:
        // positive -> works, none/neutral -> no_effect, negative/harmful -> inconsistent
        const rawCat = String((eff as any).effect_category || '').toLowerCase()
        const normalizedCat =
          rawCat === 'positive' ? 'works' :
          rawCat === 'none' ? 'no_effect' :
          rawCat === 'neutral' ? 'no_effect' :
          rawCat === 'negative' ? 'inconsistent' :
          rawCat === 'harmful' ? 'inconsistent' :
          rawCat // passthrough for 'works','no_effect','inconsistent','needs_more_data'
        ;(r as any).effectCategory = normalizedCat
        r.effectPct = typeof (eff as any).effect_magnitude === 'number' ? Number((eff as any).effect_magnitude) : r.effectPct ?? null
        r.confidence = typeof (eff as any).effect_confidence === 'number' ? Number((eff as any).effect_confidence) : r.confidence ?? null
        ;(r as any).daysOn = (eff as any).days_on ?? null
        ;(r as any).daysOff = (eff as any).days_off ?? null
        ;(r as any).cleanDays = (eff as any).clean_days ?? null
      }
      // Derive daysOn/Off from daily_entries intake; if retest is active, recompute from retest start
      try {
        const nm = String((r as any).name || '').trim().toLowerCase()
        const suppId = nameToUserSuppId.get(nm) || String((r as any).id)
        ;(r as any).userSuppId = suppId
        const meta = (suppMetaById ? suppMetaById.get(suppId) : undefined)
        const restartIso: string | null = meta && (meta as any).restart ? String((meta as any).restart) : null
        const currentOn = Number((r as any).daysOn || 0)
        const currentOff = Number((r as any).daysOff || 0)
        const needRecompute = !!restartIso || (currentOn + currentOff) === 0
        if (needRecompute) {
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
              const v = (intake as any)[suppId]
              if (v !== undefined) {
                hasRecord = true
                const s = String(v).toLowerCase()
                if (s === 'skipped' || s === 'off' || s === 'not_taken' || s === 'false' || s === '0') {
                  isOff = true
                } else if (s === 'taken' || s === 'true' || s === '1') {
                  isTaken = true
                }
              }
            }
            if (!hasRecord) continue
            const isClean = !(Array.isArray((entry as any).tags) && (entry as any).tags.length > 0)
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
          if (restartIso) {
            ;(r as any).retestStartedAt = restartIso
            ;(r as any).trialNumber = (suppMetaById && suppMetaById.get(suppId) ? (suppMetaById.get(suppId) as any).trial : null) ?? null
            ;(r as any).effectCategory = undefined
            r.effectPct = null
            r.confidence = null
            r.trend = undefined
          }
        }
      } catch {}
      // Recompute progressPercent with bonuses now that we have some quality data
      try {
        const name = (r as any).name || ''
        const goals = (r as any).primary_goal_tags || (r as any).tags || []
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
      if (p <= 40) return { label: 'Collecting data', color: 'gray' }
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
        const verdict =
          cat === 'works' ? 'keep' :
          cat === 'no_effect' ? 'drop' :
          cat === 'inconsistent' ? 'testing' :
          cat === 'needs_more_data' ? 'testing' :
          isReady ? 'unclear' : null
        ;(r as any).verdict = verdict
        ;(r as any).effectPercent = typeof r.effectPct === 'number' ? Math.round(r.effectPct) : null
        ;(r as any).effectMetric = (cat === 'works' || cat === 'no_effect' || cat === 'inconsistent') ? 'energy' : null
        if (typeof r.confidence === 'number') {
          const c = Math.round(r.confidence as number)
          ;(r as any).confidenceText = c >= 80 ? 'high' : c >= 60 ? 'medium' : 'low'
        } else {
          ;(r as any).confidenceText = null
        }
        // Heuristic inconclusive reason/text for ready-but-unclear cases
        if (isReady && (!cat || cat === 'needs_more_data' || (r as any).verdict === 'unclear')) {
          const eff = Number((r as any).effectPercent || 0)
          const clean = Number((r as any).cleanDays || 0)
          const total = Number(r.daysOfData || 0)
          const ratio = total > 0 ? (clean / total) : 0
          let reason: string | null = null
          let text: string | null = null
          if (Math.abs(eff) <= 5) {
            reason = 'small_effect'
            text = 'Small effect (<5%) — not statistically clear'
          } else if (ratio < 0.6) {
            reason = 'high_noise'
            text = 'High noise — many disrupted days reduce clarity'
          } else {
            reason = 'insufficient_signal'
            text = 'More data needed for a confident verdict'
          }
          ;(r as any).inconclusiveReason = reason
          ;(r as any).inconclusiveText = text
        } else {
          ;(r as any).inconclusiveReason = null
          ;(r as any).inconclusiveText = null
        }
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

    // Group sections per rules (do not hide 100%+ without verdict):
    // - Clear Effects Detected: effectCategory='works'
    // - No Effect Detected: effectCategory='no_effect'
    // - Inconsistent: effectCategory='inconsistent'
    // - Needs Data: effectCategory='needs_more_data'
    // - Building: no effectCategory (includes <100% and 100% "Ready for verdict")
    const clearSignal = progressRows.filter(r => (r as any).effectCategory === 'works')
    const noEffect = progressRows.filter(r => (r as any).effectCategory === 'no_effect')
    const inconsistent = progressRows.filter(r => (r as any).effectCategory === 'inconsistent')
    const needsData = progressRows.filter(r => (r as any).effectCategory === 'needs_more_data')
    const building = progressRows.filter(r => !(r as any).effectCategory)

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
      const sdRaw = (it as any).inferred_start_at || (it as any).start_date
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
      .filter(r => (r as any).testingActive)
      .map((r: any) => {
        const cat = inferCategory(String(r?.name || ''), (r?.primary_goal_tags || r?.tags))
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
      rotation.action = {
        headline: "TODAY'S ACTION",
        skipCategory: cat,
        skip: skipList.map(s => ({ id: s.id, name: s.name })),
        take: takeList.map(s => ({ id: s.id, name: s.name })),
        reason: reasonByCat[cat] || "This helps us isolate category effects."
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
    return NextResponse.json({
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


