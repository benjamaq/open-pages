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
  console.log('[progress/loop] === V2 CODE RUNNING ===')
  console.log('[progress/loop] === START ===')
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try { console.log('[progress/loop] user:', user.id) } catch {}

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
          last30: { total: 0, noise: 0, clean: 0 },
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
    let hasCheckedInToday = distinctCheckinDays.has(todayKey)
    let todaySummary: { mood?: number; energy?: number; focus?: number } | null = null
    if (hasCheckedInToday) {
      const todayRow = (checkins || []).find((c: any) => getDayKey(c) === todayKey)
      if (todayRow) todaySummary = { mood: (todayRow as any).mood ?? undefined, energy: (todayRow as any).energy ?? undefined, focus: (todayRow as any).focus ?? undefined }
    }

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
    const tagCountsLast7: Record<string, number> = {
      alcohol: 0,
      travel: 0,
      high_stress: 0,
      poor_sleep: 0,
      illness: 0,
      intense_exercise: 0,
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
      .select('local_date,tags,skipped_supplements')
      .eq('user_id', user.id)
      .gte('local_date', since365.toISOString().slice(0,10))
    const allEntryDatesSet = new Set<string>((entries365 || []).map((e: any) => String(e.local_date).slice(0,10)))
    const totalDistinctDaysFromEntries = allEntryDatesSet.size
    try {
      console.log('[progress/loop] user:', user.id, 'entries365:', (entries365 || []).length, 'distinctDates:', totalDistinctDaysFromEntries)
    } catch {}
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
    // Use max of sources to avoid undercounting
    const totalDistinctDaysFromCheckins = distinctCheckinDays.size
    const totalDistinctDays = Math.max(totalDistinctDaysFromEntries, cleanDatesSet.size, totalDistinctDaysFromCheckins)
    try {
      console.log('[progress/loop] daysTracked debug', {
        entriesDistinct: totalDistinctDaysFromEntries,
        cleanDates: cleanDatesSet.size,
        checkinsDistinct: totalDistinctDaysFromCheckins,
        chosen: totalDistinctDays
      })
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
    try {
      console.log('[progress/loop] items:', (items || []).length)
      console.log('[progress/loop] cleanDatesSet size:', cleanDatesSet.size, 'first5:', Array.from(cleanDatesSet).sort().slice(0,5))
    } catch {}

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
      try { console.log('[progress/loop] row:', { id, name, startDate: (it as any).inferred_start_at || (it as any).start_date, daysOfData, progressPercent }) } catch {}

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
      .select('id,name')
      .eq('user_id', user.id)
    const nameToUserSuppId = new Map<string, string>()
    for (const u of userSuppRows || []) {
      const nm = String((u as any).name || '').trim().toLowerCase()
      if (nm) nameToUserSuppId.set(nm, String((u as any).id))
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
      // Derive daysOn/Off from daily_entries intake if effect rows are missing or zeroed
      try {
        const currentOn = Number((r as any).daysOn || 0)
        const currentOff = Number((r as any).daysOff || 0)
        if ((currentOn + currentOff) === 0) {
          const nm = String((r as any).name || '').trim().toLowerCase()
          const suppId = nameToUserSuppId.get(nm) || String((r as any).id)
          let on = 0, off = 0
          for (const entry of (entries365 || [])) {
            const skippedArr = (entry as any).skipped_supplements || []
            const isOff = Array.isArray(skippedArr) && (skippedArr as any[]).includes(suppId)
            if (isOff) {
              off++
            } else {
              on++
            }
          }
          ;(r as any).daysOn = on
          ;(r as any).daysOff = off
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
        // Gate by ON vs OFF evidence: progress = min(on_pct, off_pct)
        const requiredOnDays = requiredDays
        const requiredOffDays = Math.min(5, Math.max(3, Math.round(requiredDays / 4))) // 3–5 off-days required
        const onPct = requiredOnDays > 0 ? (daysOn / requiredOnDays) * 100 : 0
        const offPct = requiredOffDays > 0 ? (daysOff / requiredOffDays) * 100 : 0
        // If we have any ON/OFF accounting, gate the ceiling by min(onPct, offPct)
        if ((daysOn > 0) || (daysOff > 0)) {
          const gate = Math.min(onPct, offPct)
          adjusted = Math.min(adjusted, gate)
        } else {
          // If no OFF evidence yet, do not allow 100% even if base hits it
          if (adjusted >= 100) adjusted = 99
        }
        r.progressPercent = Math.max(0, Math.min(100, Math.round(adjusted)))
        r.requiredDays = requiredDays
      }
      catch {}
    }

    // Compute progress state labels and weighted stack progress
    const stateFor = (p: number): { label: string; color: 'gray'|'amber'|'green' } => {
      if (p <= 15) return { label: 'Collecting baseline', color: 'gray' }
      if (p <= 40) return { label: 'Building pattern', color: 'gray' }
      if (p <= 70) return { label: 'Signal emerging', color: 'amber' }
      if (p <= 90) return { label: 'Almost ready', color: 'amber' }
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
      const candidates = progressRows.filter(r => r.progressPercent < 100)
      if (candidates.length > 0) {
        const next = candidates.sort((a, b) => (b.progressPercent - a.progressPercent))[0]
        const nm = (next as any).name || 'Supplement'
        // estimate with variance by category
        const cat = inferCategory(nm, (next as any).primary_goal_tags)
        const remaining = Math.max(0, next.requiredDays - next.daysOfData)
        const rnd = Math.floor(hash01(String(next.id) + new Date().toISOString().slice(0,10)) * 3)
        let est = remaining
        if (cat === 'sleep') est = remaining + (rnd - 1) // -1..+1
        else if (cat === 'cognitive') est = remaining + rnd // 0..2
        else est = remaining + (rnd - 0) // 0..2
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
    const stackItems = (items || []).map((it: any) => {
      const cat = inferCategory(String(it?.name || ''), (it?.primary_goal_tags || it?.tags))
      const cost = Number(it?.monthly_cost || 0)
      return { id: String(it?.id), name: String(it?.name || 'Supplement'), category: cat, monthlyCost: cost }
    })
    const stackSize = stackItems.length
    const groupsByCategory = new Map<string, typeof stackItems>()
    for (const s of stackItems) {
      const arr = groupsByCategory.get(s.category) || []
      arr.push(s)
      groupsByCategory.set(s.category, arr)
    }
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
      const groupIdx = cycleIndex % groupEntries.length
      const [cat, groupSupps] = groupEntries[groupIdx]
      const toSkipCount = Math.min(skipPerCycle(stackSize), groupSupps.length)
      const skipList = [...groupSupps]
        .sort((a, b) => (b.monthlyCost || 0) - (a.monthlyCost || 0))
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
    return NextResponse.json({
      debug,
      userId: user.id,
      daysTracked: totalDistinctDays,
      firstCheckin,
      latestCheckin,
      todaysProgress,
      rotation,
      stackProgress,
      checkins: {
        totalDistinctDays,
        hasCheckedInToday,
        todaySummary,
        last30: {
          total: totalLast30,
          noise: noiseEvents,
          clean: cleanLast30,
        },
        last7: {
          total: totalLast7,
          noise: noiseEvents7,
          clean: cleanLast7,
          tagCounts: tagCountsLast7,
        },
      },
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


