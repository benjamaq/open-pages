import { createClient } from '@/lib/supabase/server'
import type { CanonicalSupplement, DaySample, EffectStats, TruthReport, TruthStatus } from './types'
import { computeEffectStats, estimateConfidence, classifyStatus } from './stats'
import { inferMechanism, inferBiologyProfile } from './inference'
import { verdictLabels, verdictTitles, fill } from './copyTemplates'
import { buildNextSteps, buildScienceNote } from './nextSteps'
import { getCohortStats, percentileFromDistribution, responderLabelForPercentile } from './cohort'
import fs from 'fs'

// Align truth-engine readiness thresholds with dashboard logic
function requiredOnDaysForMetric(metricKey: string): number {
  const k = (metricKey || '').toLowerCase()
  // Align product expectation: 10 ON days across primary metrics
  if (k === 'sleep_quality' || k === 'sleep_score') return 10
  if (k === 'subjective_energy') return 10
  if (k === 'subjective_mood') return 10
  if (k === 'focus') return 10
  return 10
}
function requiredOffDaysForMetric(metricKey: string): number {
  const on = requiredOnDaysForMetric(metricKey)
  return Math.min(5, Math.max(3, Math.round(on / 4)))
}

export async function generateTruthReportForSupplement(userId: string, userSupplementId: string): Promise<TruthReport> {
  const supabase = await createClient()
  // Write to file since console output may be suppressed in some runtimes
  const debugLog = (msg: string) => {
    try {
      const line = `${new Date().toISOString()} - ${msg}\n`
      fs.appendFileSync('/tmp/truth-debug.log', line)
    } catch {
      // ignore fs errors
    }
  }
  debugLog(`START: userId=${userId}, userSupplementId=${userSupplementId}`)

  // Load supplement row
  let primaryMetric: string = 'subjective_energy'
  // If we fall back to wearables-derived metric, set a more accurate display label
  let metricLabelOverride: string | null = null
  let secondaryKeys: string[] = []
  let canonicalId: string | null = null
  let supplementName: string | null = null
  // Resolve profile id for the user (needed to map stack_items keys)
  let profileId: string | null = null
  // Lower bound for analysis window (prefer start date; else inferred; else created; else wide fallback)
  let sinceLowerBound: string | null = null
  try {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    profileId = (profileRow as any)?.id || null
  } catch {}
  // Prefer user_supplement
  const { data: supp, error: suppError } = await supabase
    .from('user_supplement')
    .select('id, user_id, name, monthly_cost_usd, created_at, retest_started_at, inferred_start_at')
    .eq('id', userSupplementId)
    .maybeSingle()
  debugLog(
    `LOOKUP: found=${!!supp}, suppUserId=${(supp as any)?.user_id || 'null'}, inputUserId=${userId}, match=${
      !!supp && String((supp as any).user_id) === String(userId)
    }, error=${(supp as any)?.message || (suppError as any)?.message || 'null'}`
  )
  if (!suppError && supp && supp.user_id === userId) {
    // Keep defaults for primaryMetric/secondaryKeys/canonicalId; set name from record
    supplementName = (supp as any)?.name || null
    // Determine analysis lower bound for this supplement
    const restart = (supp as any)?.retest_started_at ? String((supp as any).retest_started_at).slice(0,10) : null
    const inferred = (supp as any)?.inferred_start_at ? String((supp as any).inferred_start_at).slice(0,10) : null
    // IMPORTANT: Do NOT gate analysis by created_at; seeded entries may predate record creation
    // Only use restart bound; DO NOT clamp by inferred_start_at or we lose implicit OFF days
    sinceLowerBound = restart || null
    // Preserve inferred for implicit ON/OFF boundary later
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var inferredStartGlobal: string | null = inferred || null
  } else {
    // Fallback: treat id as stack_items id for this user
    const { data: stackItem } = await supabase
      .from('stack_items')
      .select('id, profile_id, name, user_supplement_id, start_date, created_at')
      .eq('id', userSupplementId)
      .maybeSingle()
    debugLog(
      `FALLBACK_STACK_ITEM: profileId=${profileId || 'null'}, stackItemFound=${!!stackItem}, stackProfileId=${
        (stackItem as any)?.profile_id || 'null'
      }, name=${(stackItem as any)?.name || 'null'}`
    )
    if (!stackItem || !profileId || String((stackItem as any).profile_id) !== String(profileId)) {
      throw new Error('Not found')
    }
    // When using stack_items id, we won't have canonical or custom metrics; defaults apply
    supplementName = (stackItem as any)?.name || null
    canonicalId = null
    secondaryKeys = []
    const startDate = (stackItem as any)?.start_date ? String((stackItem as any).start_date).slice(0,10) : null
    // Prefer explicit start_date; avoid gating by created_at for backfilled data
    sinceLowerBound = startDate || null
  }

  // Build candidate intake keys: prefer user_supplement id, but also include any linked stack_items ids
  const candidateIntakeKeys = new Set<string>([String(userSupplementId)])
  try {
    if (profileId) {
      const { data: linkedItems } = await supabase
        .from('stack_items')
        .select('id')
        .eq('profile_id', profileId)
        .eq('user_supplement_id', userSupplementId)
      for (const li of linkedItems || []) {
        const kid = String((li as any).id || '')
        if (kid) candidateIntakeKeys.add(kid)
      }
      // Also include sibling user_supplement ids with the same (case-insensitive) name
      if (supplementName) {
        const nm = String(supplementName).trim()
        const { data: sameNameSupps } = await supabase
          .from('user_supplement')
          .select('id,name')
          .eq('user_id', userId)
          .ilike('name', nm)
          .limit(50)
        for (const us of sameNameSupps || []) {
          const sid = String((us as any).id || '')
          if (sid) candidateIntakeKeys.add(sid)
        }
      }
    }
  } catch {}
  debugLog(`CANDIDATE_KEYS: ${Array.from(candidateIntakeKeys).join(',')}`)

  // Load canonical and derive primary metric from stack_items category when available
  let canonical: CanonicalSupplement | null = null
  try {
    if (!canonicalId && profileId) {
      const { data: si } = await supabase
        .from('stack_items')
        .select('id,category')
        .eq('profile_id', profileId)
        .eq('user_supplement_id', userSupplementId)
        .limit(1)
        .maybeSingle()
      const cat = (si as any)?.category ? String((si as any).category).toLowerCase() : ''
      if (cat) {
        if (cat.includes('mood') || cat.includes('stress')) primaryMetric = 'subjective_mood'
        else if (cat.includes('sleep')) primaryMetric = 'sleep_quality'
        else if (cat.includes('cogn') || cat.includes('focus') || cat.includes('memory')) primaryMetric = 'focus'
        else if (cat.includes('energy') || cat.includes('stamina')) primaryMetric = 'subjective_energy'
      }
    }
  } catch {}
  if (canonicalId) {
    const { data: cano } = await supabase
      .from('canonical_supplements')
      .select('id, name, generic_name, category, primary_goals, mechanism_tags, pathway_summary')
      .eq('id', canonicalId)
      .maybeSingle()
    if (cano) canonical = cano as any
  }

  // ===== LOAD DATA FROM DAILY_ENTRIES =====
  console.log('[truth-engine] Loading daily_entries for user:', userId)
  // Load ALL history when we have an inferred start date to allow implicit OFF (pre-start) + ON (post-start).
  // Otherwise, fall back to the widest safe range: restart date if present, else 365 days.
  const loadAllForImplicit = !!(typeof inferredStartGlobal === 'string' && inferredStartGlobal)
  let querySince: string | null = sinceLowerBound
  if (!loadAllForImplicit) {
    if (!querySince) {
      const since365 = new Date()
      since365.setDate(since365.getDate() - 365)
      querySince = since365.toISOString().slice(0,10)
    }
  }
  debugLog(`QUERY daily_entries: user_id=${userId}, since=${loadAllForImplicit ? 'ALL' : (querySince || 'NONE')}, fields=local_date,energy,focus,mood,sleep_quality,supplement_intake,wearables`)

  let q = supabase
    .from('daily_entries')
    .select('local_date, energy, focus, mood, sleep_quality, supplement_intake, tags, wearables')
    .eq('user_id', userId)
  if (!loadAllForImplicit && querySince) {
    q = q.gte('local_date', querySince as any)
  }
  const { data: dailyRows, error: dailyError } = await q.order('local_date', { ascending: false })
  
  console.log('[truth-engine] daily_entries result:', {
    count: dailyRows?.length || 0,
    error: dailyError?.message || null,
    firstDate: dailyRows?.[0]?.local_date || null
  })
  // Debug: show a small sample of wearables keys to validate extraction
  try {
    const sampleWearables = []
    let shown = 0
    for (const r of dailyRows || []) {
      const w = (r as any)?.wearables
      if (w && (typeof w === 'object' || typeof w === 'string')) {
        let obj: any = w
        if (typeof obj === 'string') {
          try { obj = JSON.parse(obj) } catch {}
        }
        if (obj && typeof obj === 'object') {
          sampleWearables.push({ date: String((r as any).local_date).slice(0,10), keys: Object.keys(obj).slice(0, 12) })
          shown++
          if (shown >= 5) break
        }
      }
    }
    if (sampleWearables.length > 0) {
      console.log('[truth-engine] wearables keys sample:', sampleWearables)
    } else {
      console.log('[truth-engine] wearables keys sample: none')
    }
  } catch {}
  try {
    const allKeys = new Set<string>()
    for (const r of dailyRows || []) {
      const intake = (r as any)?.supplement_intake || {}
      if (intake && typeof intake === 'object') {
        for (const k of Object.keys(intake)) allKeys.add(String(k))
      }
    }
    debugLog(`INTAKE_KEYS_PRESENT: ${Array.from(allKeys).slice(0, 15).join(',')}${allKeys.size > 15 ? ',...' : ''}`)
    // Per-candidate hit diagnostics
    const hits: Record<string, { total: number; on: number; off: number }> = {}
    for (const k of Array.from(candidateIntakeKeys)) {
      hits[k] = { total: 0, on: 0, off: 0 }
    }
    for (const r of dailyRows || []) {
      const intake = (r as any)?.supplement_intake || {}
      for (const k of Array.from(candidateIntakeKeys)) {
        if (k in (intake || {})) {
          const v = String((intake as any)[k]).toLowerCase()
          hits[k].total++
          if (v === 'taken' || v === 'on' || v === 'true' || v === '1') hits[k].on++
          if (v === 'off' || v === 'skipped' || v === 'false' || v === '0' || v === 'not_taken') hits[k].off++
        }
      }
    }
    debugLog(`INTAKE_KEY_HITS: ${JSON.stringify(hits)}`)
  } catch {}
  
  if (!dailyRows || dailyRows.length === 0) {
    console.log('[truth-engine] No daily_entries found!')
  }
  
  // Map to metrics format (coerce to numbers)
  let debugExtractCount = 0
  const metrics = (dailyRows || []).map((r: any) => ({
    date: r.local_date,
    subjective_energy: safeNum(r.energy),
    subjective_mood: safeNum(r.mood),
    sleep_quality: safeNum(r.sleep_quality),
    focus: safeNum(r.focus),
    _raw: { 
      tags: Array.isArray((r as any)?.tags) ? (r as any).tags : [],
      wearables: (r as any)?.wearables || null
    }
  }))
  
  // Normalize various encodings of intake into taken/off
  function normalizeTaken(val: any): boolean | null {
    if (val === 'taken' || val === 'on') return true
    if (val === 'off' || val === 'skipped' || val === 'skip') return false
    if (val === true || val === 1 || val === '1' || val === 'true') return true
    if (val === false || val === 0 || val === '0' || val === 'false') return false
    return null
  }

  // Parse intake for this specific supplement
  let implicitOn = 0, implicitOff = 0, explicitOn = 0, explicitOff = 0
  const intake = (dailyRows || []).map((r: any) => {
    const intakeObj = r.supplement_intake || {}
    // Try all candidate keys; first match wins
    let value: any = undefined
    for (const k of candidateIntakeKeys) {
      if (k in intakeObj) { value = (intakeObj as any)[k]; break }
    }
    let taken = normalizeTaken(value)
    // Implicit ON/OFF from wearables when no explicit intake and inferred start exists
    if (taken === null) {
      const hasWearable = r?.wearables != null
      const inferredStart: string | null = (typeof inferredStartGlobal === 'string' && inferredStartGlobal) ? String(inferredStartGlobal).slice(0,10) : null
      if (hasWearable && inferredStart) {
        const dKey = String(r.local_date).slice(0,10)
        if (dKey >= inferredStart) {
          taken = true
          implicitOn++
        } else {
          taken = false
          implicitOff++
        }
      }
    } else {
      // Explicit record present
      if (taken === true) explicitOn++
      if (taken === false) explicitOff++
    }
    return { date: r.local_date, taken, raw: value }
  }).filter((x: any) => x.taken !== null)
  
  console.log('[truth-engine] Parsed data:', {
    metricsCount: metrics.length,
    intakeCount: intake.length,
    sampleIntake: intake.slice(0, 3)
  })
  try {
    // Summarize ON/OFF counts by raw value for debugging
    const rawMap: Record<string, number> = {}
    for (const i of intake as any[]) {
      const key = String((i as any).raw)
      rawMap[key] = (rawMap[key] || 0) + 1
    }
    debugLog(`INTAKE_VALUE_COUNTS: ${JSON.stringify(rawMap)}`)
  } catch {}
  
  // ===== END DATA LOADING =====

  // Join per-day samples
  const metricsByDate = new Map<string, any>()
  ;(metrics || []).forEach((m: any) => {
    // Normalize keys: prefer m.date or local_date
    const key = String((m as any).date || (m as any).local_date || (m as any)?._raw?.local_date || '').slice(0,10)
    if (!key) return
    metricsByDate.set(key, m)
  })
  const intakeByDate = new Map<string, any>()
  ;(intake || []).forEach((i: any) => {
    const key = String((i as any).date || '').slice(0,10)
    if (!key) return
    intakeByDate.set(key, i)
  })

  const allDates = Array.from(new Set<string>([...metricsByDate.keys(), ...intakeByDate.keys()])).sort()
  const samplesPre: DaySample[] = allDates.map(d => {
    const m = metricsByDate.get(d) || {}
    const i = intakeByDate.get(d) || {}
    // Confound flags: prefer explicit flags, else infer from tags array
    const tagArr: string[] = Array.isArray((m as any)?._raw?.tags) ? (m as any)._raw.tags : []
    const confoundTags = new Set(['alcohol','illness','high_stress','travel','poor_sleep','sick','jetlag','hangover'])
    const hasConfoundTag = tagArr
      .map(t => String(t || '').toLowerCase())
      .some(t => confoundTags.has(t))
    const confounded =
      !!(m.alcohol_flag || m.late_caffeine_flag || m.travel_flag || m.illness_flag) ||
      hasConfoundTag
    const secondaryMetrics: Record<string, number | null> = {}
    for (const key of secondaryKeys) {
      secondaryMetrics[key] = safeNum(m[key] ?? (m?._raw ? (m as any)._raw[key] : undefined))
    }
    const metricValue = (() => {
      // 1) Direct column value
      if (m[primaryMetric] != null) {
        const v = safeNum(m[primaryMetric])
        if (debugExtractCount < 10) {
          try {
            console.log('[truth-engine] metric extraction', {
              date: (m as any).date,
              primaryMetric,
              source: 'direct',
              primaryValue: m[primaryMetric],
              metricValue: v
            })
          } catch {}
          debugExtractCount++
        }
        return v
      }
      const key = (primaryMetric || '').toLowerCase()
      // 2) Legacy raw mappings (subjective fields)
      if (key === 'subjective_energy') {
        const v = safeNum((m as any)._raw?.energy)
        if (v != null) {
          if (debugExtractCount < 10) {
            try { console.log('[truth-engine] metric extraction', { date: (m as any).date, primaryMetric, source: 'rawSubjective:energy', metricValue: v }) } catch {}
            debugExtractCount++
          }
          return v
        }
      }
      if (key === 'subjective_mood') {
        const v = safeNum((m as any)._raw?.mood)
        if (v != null) {
          if (debugExtractCount < 10) {
            try { console.log('[truth-engine] metric extraction', { date: (m as any).date, primaryMetric, source: 'rawSubjective:mood', metricValue: v }) } catch {}
            debugExtractCount++
          }
          return v
        }
      }
      if (key === 'focus') {
        const v = safeNum((m as any)._raw?.focus)
        if (v != null) {
          if (debugExtractCount < 10) {
            try { console.log('[truth-engine] metric extraction', { date: (m as any).date, primaryMetric, source: 'rawSubjective:focus', metricValue: v }) } catch {}
            debugExtractCount++
          }
          return v
        }
      }
      if (key === 'sleep_quality' || key === 'sleep_score') {
        const v = safeNum((m as any)._raw?.sleep_quality ?? (m as any)._raw?.sleep)
        if (v != null) {
          if (debugExtractCount < 10) {
            try { console.log('[truth-engine] metric extraction', { date: (m as any).date, primaryMetric, source: 'rawSubjective:sleep', metricValue: v }) } catch {}
            debugExtractCount++
          }
          return v
        }
      }
      // 3) Wearables fallback: infer a usable metric from wearables blob
      let w = (m as any)._raw?.wearables || null
      if (w && typeof w === 'string') {
        try { w = JSON.parse(w) } catch {}
      }
      if (!w || typeof w !== 'object') return null
      // Prefer sleep-related if primary metric is sleep-like
      const isSleep = key.includes('sleep')
      const tryKeys = [
        ...(isSleep ? ['sleep_performance_pct', 'sleep_score', 'sleep_quality', 'sleep_hours', 'sleep_min', 'deep_sleep_min', 'rem_sleep_min'] : []),
        // General fallbacks from WHOOP/Oura
        // Include sleep_performance_pct as general fallback as well so non-sleep primaries (e.g., energy) can still use it
        'sleep_performance_pct', 'recovery_score', 'readiness', 'hrv_rmssd', 'hrv_ms', 'hrv', 'hrv_sdnn_ms', 'strain', 'resting_hr_bpm', 'resting_hr', 'deep_sleep_min', 'rem_sleep_min'
      ]
      const labelForWearableKey = (k: string): string | null => {
        const kk = String(k || '').toLowerCase()
        if (kk === 'sleep_performance_pct' || kk === 'sleep_score' || kk === 'sleep_quality') return 'Sleep Performance'
        if (kk === 'sleep_hours' || kk === 'sleep_min') return 'Sleep Duration'
        if (kk === 'deep_sleep_min') return 'Deep Sleep (h)'
        if (kk === 'rem_sleep_min') return 'REM Sleep (h)'
        if (kk === 'recovery_score' || kk === 'readiness') return 'Recovery'
        if (kk === 'hrv' || kk === 'hrv_ms' || kk === 'hrv_rmssd' || kk === 'hrv_sdnn_ms') return 'HRV'
        if (kk === 'resting_hr' || kk === 'resting_hr_bpm' || kk === 'rhr') return 'Resting HR'
        if (kk === 'strain') return 'Strain'
        return null
      }
      for (const k of tryKeys) {
        const raw = (w as any)[k]
        if (raw == null) continue
        let num = Number(raw)
        if (!Number.isFinite(num)) continue
        // Normalize percentages to 0-100 if they look like 0-1
        if (String(k).endsWith('_pct') && num <= 1) num = num * 100
        // Convert minutes to hours for readability if minutes key
        if ((k === 'sleep_min' || k === 'deep_sleep_min' || k === 'rem_sleep_min') && num > 0) num = num / 60
        // Capture effective label for report display if not set yet
        if (!metricLabelOverride) {
          metricLabelOverride = labelForWearableKey(k)
        }
        if (debugExtractCount < 10) {
          try {
            console.log('[truth-engine] metric extraction', {
              date: (m as any).date,
              primaryMetric,
              source: `wearables:${k}`,
              metricValue: num
            })
          } catch {}
          debugExtractCount++
        }
        return num
      }
      // Debug when no wearable key matched
      try {
        const keys = Object.keys(w as any)
        console.log('[truth-engine] wearable metric not found. primary=', key, 'availableKeys=', keys.slice(0, 20))
      } catch {}
      return null
    })()
    return {
      date: d,
      metric: metricValue,
      secondaryMetrics,
      taken: (typeof i.taken === 'boolean') ? i.taken : (null as any),
      confounded
    }
  })
  const samples: DaySample[] = samplesPre.filter(s => s.taken === true || s.taken === false)
  // Total ON/OFF day counts for persistence (independent of metric presence or confound removal)
  const sampleOnCount = samples.filter(s => s.taken === true).length
  const sampleOffCount = samples.filter(s => s.taken === false).length
  try {
    const total = samples.length
    const withMetric = samples.filter(s => s.metric !== null && s.metric !== undefined).length
    const onDays = sampleOnCount
    const offDays = sampleOffCount
    try { console.log('[truth-engine] Samples:', { total, withMetric, onDays, offDays }) } catch {}
    debugLog(`SAMPLES_JOINED: total=${total}, withMetric=${withMetric}, onDays=${onDays}, offDays=${offDays}`)
  } catch {}

  // Exclude confounded days for effect calculation
  const cleanSamples = samples.filter(s => !s.confounded)
  const effect: EffectStats = computeEffectStats(cleanSamples, primaryMetric)
  try {
    console.log('[truth-engine][implicit-summary]', {
      userId,
      userSupplementId,
      inferredStart: (typeof inferredStartGlobal === 'string' ? inferredStartGlobal : null),
      explicitOn,
      explicitOff,
      implicitOn,
      implicitOff,
      samplesTotal: samples.length,
      cleanSamples: cleanSamples.length
    })
  } catch {}
  // Compute missing-metric counts (labeled ON/OFF days that lacked usable metric)
  const missingOnMetrics = Math.max(0, sampleOnCount - (effect.sampleOn || 0))
  const missingOffMetrics = Math.max(0, sampleOffCount - (effect.sampleOff || 0))
  try {
    console.log('[truth-engine] Effect computed:', {
      metric: primaryMetric,
      meanOn: effect.meanOn,
      meanOff: effect.meanOff,
      absoluteChange: effect.absoluteChange,
      effectSize: effect.effectSize,
      percentChange: effect.percentChange,
      direction: effect.direction,
      sampleOn: effect.sampleOn,
      sampleOff: effect.sampleOff
    })
  } catch {}

  // Early exit if too few days — use same thresholds as dashboard/email
  const REQ_ON = requiredOnDaysForMetric(primaryMetric)
  const REQ_OFF = requiredOffDaysForMetric(primaryMetric)
  if (effect.sampleOn < REQ_ON || effect.sampleOff < REQ_OFF) {
    return buildReport({
      supplementName: supplementName || undefined,
      status: 'too_early',
      effect,
      primaryMetric,
      canonical,
      confoundedDays: samples.length - cleanSamples.length,
      cohort: null,
      sampleOnOverride: sampleOnCount,
      sampleOffOverride: sampleOffCount,
      metricLabelOverride: metricLabelOverride || undefined,
      missingOnMetrics,
      missingOffMetrics
    })
  }

  const confidence = estimateConfidence(effect.effectSize, effect.sampleOn, effect.sampleOff)
  // Decision tree when thresholds are met:
  // If small effect (|d| < 0.3) OR low confidence → completed test with no detectable effect
  // Else classify positive/negative as usual
  let status: TruthStatus
  if (Math.abs(effect.effectSize) < 0.3 || confidence < 0.6) {
    status = 'no_detectable_effect'
  } else if (effect.direction === 'positive') {
    status = 'proven_positive'
  } else if (effect.direction === 'negative') {
    status = 'negative'
  } else {
    status = 'no_detectable_effect'
  }

  // Cohort stats
  const cohort = await getCohortStats(canonicalId, primaryMetric)

  return buildReport({
    supplementName: supplementName || undefined,
    status,
    effect,
    primaryMetric,
    canonical,
    confoundedDays: samples.length - cleanSamples.length,
    cohort,
    confidenceOverride: confidence,
    sampleOnOverride: sampleOnCount,
    sampleOffOverride: sampleOffCount,
    metricLabelOverride: metricLabelOverride || undefined,
    missingOnMetrics,
    missingOffMetrics
  })
}

function buildReport(args: {
  supplementName?: string
  status: TruthStatus
  effect: EffectStats
  primaryMetric: string
  canonical: CanonicalSupplement | null
  confoundedDays: number
  cohort: Awaited<ReturnType<typeof getCohortStats>> | null
  confidenceOverride?: number
  sampleOnOverride?: number
  sampleOffOverride?: number
  metricLabelOverride?: string
  missingOnMetrics?: number
  missingOffMetrics?: number
}): TruthReport {
  const { effect, primaryMetric, canonical, cohort } = args
  const confidenceScore = typeof args.confidenceOverride === 'number'
    ? args.confidenceOverride
    : estimateConfidence(effect.effectSize, effect.sampleOn, effect.sampleOff)

  const confidenceLabel: 'high' | 'medium' | 'low' =
    confidenceScore >= 0.75 ? 'high' : confidenceScore >= 0.5 ? 'medium' : 'low'

  const mechanism = inferMechanism({
    canonical,
    effect,
    status: args.status,
    primaryMetric
  })
  const biologyProfile = inferBiologyProfile({ canonical, effect, status: args.status, primaryMetric })
  const scienceNote = buildScienceNote(canonical, mechanism.mechanismLabel)
  const nextSteps = buildNextSteps({ status: args.status, effect, canonical: canonical })

  const metricLabel = (args.metricLabelOverride && String(args.metricLabelOverride).trim().length > 0)
    ? String(args.metricLabelOverride)
    : labelForMetric(primaryMetric)
  const verdictLabel = verdictLabels[args.status]
  const verdictTitle = fill(verdictTitles[args.status], { metricLabel })

  let userPercentile: number | null = null
  let responderLabel: string | null = null
  if (cohort) {
    userPercentile = percentileFromDistribution(effect.effectSize, cohort.distribution)
    responderLabel = responderLabelForPercentile(userPercentile)
  }

  const confoundsSummary = `${effect.sampleOn + effect.sampleOff} days analysed, ${args.confoundedDays} day(s) excluded due to confounds`

  return {
    supplementName: args.supplementName,
    status: args.status,
    verdictTitle,
    verdictLabel,
    primaryMetricLabel: metricLabel,
    effect,
    confidence: {
      score: confidenceScore,
      label: confidenceLabel,
      explanation: 'More days and larger effects increase confidence.'
    },
    confoundsSummary,
    mechanism: {
      label: mechanism.mechanismLabel,
      text: mechanism.mechanismText
    },
    community: {
      sampleSize: cohort?.sampleSize || 0,
      avgEffect: cohort?.avgEffect ?? null,
      userPercentile,
      responderLabel
    },
    biologyProfile,
    nextSteps,
    scienceNote,
    meta: {
      sampleOn: typeof args.sampleOnOverride === 'number' ? args.sampleOnOverride : effect.sampleOn,
      sampleOff: typeof args.sampleOffOverride === 'number' ? args.sampleOffOverride : effect.sampleOff,
      daysExcluded: args.confoundedDays,
      onsetDays: null,
      missingOnMetrics: typeof args.missingOnMetrics === 'number' ? args.missingOnMetrics : 0,
      missingOffMetrics: typeof args.missingOffMetrics === 'number' ? args.missingOffMetrics : 0,
      generatedAt: new Date().toISOString()
    }
  }
}

function labelForMetric(key: string): string {
  const map: Record<string, string> = {
    sleep_latency_minutes: 'Sleep latency',
    deep_sleep_pct: 'Deep sleep %',
    hrv_evening: 'Evening HRV',
    subjective_energy: 'Energy',
    subjective_mood: 'Mood'
  }
  return map[key] || key
}

function safeNum(x: any): number | null {
  const n = typeof x === 'number' ? x : (x == null ? null : Number(x))
  return Number.isFinite(n as number) ? (n as number) : null
}




