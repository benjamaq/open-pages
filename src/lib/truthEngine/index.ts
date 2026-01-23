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
  if (k === 'sleep_quality' || k === 'sleep_score') return 10
  if (k === 'subjective_energy') return 12
  if (k === 'subjective_mood') return 14
  if (k === 'focus') return 14
  return 14
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
    const created = (supp as any)?.created_at ? String((supp as any).created_at).slice(0,10) : null
    sinceLowerBound = restart || inferred || created || null
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
    const created = (stackItem as any)?.created_at ? String((stackItem as any).created_at).slice(0,10) : null
    sinceLowerBound = startDate || created || null
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
    }
  } catch {}
  debugLog(`CANDIDATE_KEYS: ${Array.from(candidateIntakeKeys).join(',')}`)

  // Load canonical
  let canonical: CanonicalSupplement | null = null
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
  // Choose the widest safe range: prefer supplement start/restart; otherwise 365-day fallback
  let querySince: string | null = sinceLowerBound
  if (!querySince) {
    const since365 = new Date()
    since365.setDate(since365.getDate() - 365)
    querySince = since365.toISOString().slice(0,10)
  }
  debugLog(`QUERY daily_entries: user_id=${userId}, since=${querySince || 'NONE'}, fields=local_date,energy,focus,mood,sleep_quality,supplement_intake`)

  const { data: dailyRows, error: dailyError } = await supabase
    .from('daily_entries')
    .select('local_date, energy, focus, mood, sleep_quality, supplement_intake')
    .eq('user_id', userId)
    // Only apply lower bound when we actually have it; else read broad set
    .gte('local_date', querySince as any)
    .order('local_date', { ascending: false })
  
  console.log('[truth-engine] daily_entries result:', {
    count: dailyRows?.length || 0,
    error: dailyError?.message || null,
    firstDate: dailyRows?.[0]?.local_date || null
  })
  try {
    const allKeys = new Set<string>()
    for (const r of dailyRows || []) {
      const intake = (r as any)?.supplement_intake || {}
      if (intake && typeof intake === 'object') {
        for (const k of Object.keys(intake)) allKeys.add(String(k))
      }
    }
    debugLog(`INTAKE_KEYS_PRESENT: ${Array.from(allKeys).slice(0, 15).join(',')}${allKeys.size > 15 ? ',...' : ''}`)
  } catch {}
  
  if (!dailyRows || dailyRows.length === 0) {
    console.log('[truth-engine] No daily_entries found!')
  }
  
  // Map to metrics format (coerce to numbers)
  const metrics = (dailyRows || []).map((r: any) => ({
    date: r.local_date,
    subjective_energy: safeNum(r.energy),
    subjective_mood: safeNum(r.mood),
    sleep_quality: safeNum(r.sleep_quality),
    focus: safeNum(r.focus)
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
  const intake = (dailyRows || []).map((r: any) => {
    const intakeObj = r.supplement_intake || {}
    // Try all candidate keys; first match wins
    let value: any = undefined
    for (const k of candidateIntakeKeys) {
      if (k in intakeObj) { value = (intakeObj as any)[k]; break }
    }
    const taken = normalizeTaken(value)
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
    const confounded =
      !!(m.alcohol_flag || m.late_caffeine_flag || m.travel_flag || m.illness_flag) ||
      (Array.isArray((m as any)?._raw?.tags) && (m as any)._raw.tags.length > 0)
    const secondaryMetrics: Record<string, number | null> = {}
    for (const key of secondaryKeys) {
      secondaryMetrics[key] = safeNum(m[key] ?? (m?._raw ? (m as any)._raw[key] : undefined))
    }
    const metricValue =
      m[primaryMetric] != null
        ? safeNum(m[primaryMetric])
        : (m?._raw ? (() => {
            const key = (primaryMetric || '').toLowerCase()
            if (key === 'subjective_energy') return safeNum((m as any)._raw?.energy)
            if (key === 'subjective_mood') return safeNum((m as any)._raw?.mood)
            if (key === 'sleep_quality' || key === 'sleep_score') return safeNum((m as any)._raw?.sleep_quality ?? (m as any)._raw?.sleep)
            return null
          })() : null)
    return {
      date: d,
      metric: metricValue,
      secondaryMetrics,
      taken: (typeof i.taken === 'boolean') ? i.taken : (null as any),
      confounded
    }
  })
  const samples: DaySample[] = samplesPre.filter(s => s.taken === true || s.taken === false)
  try {
    const total = samples.length
    const withMetric = samples.filter(s => s.metric !== null && s.metric !== undefined).length
    const onDays = samples.filter(s => s.taken === true).length
    const offDays = samples.filter(s => s.taken === false).length
    try { console.log('[truth-engine] Samples:', { total, withMetric, onDays, offDays }) } catch {}
    debugLog(`SAMPLES_JOINED: total=${total}, withMetric=${withMetric}, onDays=${onDays}, offDays=${offDays}`)
  } catch {}

  // Exclude confounded days for effect calculation
  const cleanSamples = samples.filter(s => !s.confounded)
  const effect: EffectStats = computeEffectStats(cleanSamples, primaryMetric)
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
      cohort: null
    })
  }

  const confidence = estimateConfidence(effect.effectSize, effect.sampleOn, effect.sampleOff)
  // Decision tree when thresholds are met:
  // If small effect OR low confidence → completed test with no detectable effect
  // Else classify positive/negative as usual
  let status: TruthStatus
  if (Math.abs(effect.effectSize) < 0.5 || confidence < 0.6) {
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
    confidenceOverride: confidence
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

  const metricLabel = labelForMetric(primaryMetric)
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
      sampleOn: effect.sampleOn,
      sampleOff: effect.sampleOff,
      daysExcluded: args.confoundedDays,
      onsetDays: null,
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




