import { createClient } from '@/lib/supabase/server'
import type { CanonicalSupplement, DaySample, EffectStats, TruthReport, TruthStatus } from './types'
import { computeEffectStats, estimateConfidence, classifyStatus } from './stats'
import { inferMechanism, inferBiologyProfile } from './inference'
import { verdictLabels, verdictTitles, fill } from './copyTemplates'
import { buildNextSteps, buildScienceNote } from './nextSteps'
import { getCohortStats, percentileFromDistribution, responderLabelForPercentile } from './cohort'

const MIN_ON_DAYS = 7
const MIN_OFF_DAYS = 7

export async function generateTruthReportForSupplement(userId: string, userSupplementId: string): Promise<TruthReport> {
  const supabase = await createClient()

  // Load supplement row
  const { data: supp, error: suppError } = await supabase
    .from('user_supplement')
    .select('id, user_id, canonical_id, primary_metric, secondary_metrics')
    .eq('id', userSupplementId)
    .maybeSingle()
  if (suppError || !supp || supp.user_id !== userId) {
    throw new Error('Not found')
  }
  const primaryMetric: string = (supp as any)?.primary_metric || 'sleep_latency_minutes'
  const secondaryKeys: string[] = Array.isArray((supp as any)?.secondary_metrics) ? (supp as any).secondary_metrics : []

  // Load canonical
  let canonical: CanonicalSupplement | null = null
  if ((supp as any)?.canonical_id) {
    const { data: cano } = await supabase
      .from('canonical_supplements')
      .select('id, name, generic_name, category, primary_goals, mechanism_tags, pathway_summary')
      .eq('id', (supp as any).canonical_id)
      .maybeSingle()
    if (cano) canonical = cano as any
  }

  // Time window: last 60 days
  const since = new Date()
  since.setDate(since.getDate() - 60)
  const sinceStr = since.toISOString().slice(0, 10)

  // Load daily metrics for user
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  // Load intake days for this supplement
  const { data: intake } = await supabase
    .from('supplement_intake_days')
    .select('date, taken, dose_fraction')
    .eq('user_id', userId)
    .eq('user_supplement_id', userSupplementId)
    .gte('date', sinceStr)
    .order('date', { ascending: true })

  // Join per-day samples
  const metricsByDate = new Map<string, any>()
  ;(metrics || []).forEach((m: any) => {
    metricsByDate.set(m.date, m)
  })
  const intakeByDate = new Map<string, any>()
  ;(intake || []).forEach((i: any) => {
    intakeByDate.set(i.date, i)
  })

  const allDates = Array.from(new Set<string>([...metricsByDate.keys(), ...intakeByDate.keys()])).sort()
  const samples: DaySample[] = allDates.map(d => {
    const m = metricsByDate.get(d) || {}
    const i = intakeByDate.get(d) || {}
    const confounded = !!(m.alcohol_flag || m.late_caffeine_flag || m.travel_flag || m.illness_flag)
    const secondaryMetrics: Record<string, number | null> = {}
    for (const key of secondaryKeys) {
      secondaryMetrics[key] = safeNum(m[key])
    }
    return {
      date: d,
      metric: safeNum(m[primaryMetric]),
      secondaryMetrics,
      taken: !!i.taken,
      confounded
    }
  })

  // Exclude confounded days for effect calculation
  const cleanSamples = samples.filter(s => !s.confounded)
  const effect: EffectStats = computeEffectStats(cleanSamples, primaryMetric)

  // Early exit if too few days
  if (effect.sampleOn < MIN_ON_DAYS || effect.sampleOff < MIN_OFF_DAYS) {
    return buildReport({
      status: 'too_early',
      effect,
      primaryMetric,
      canonical,
      confoundedDays: samples.length - cleanSamples.length,
      cohort: null
    })
  }

  const confidence = estimateConfidence(effect.effectSize, effect.sampleOn, effect.sampleOff)
  const status: TruthStatus = classifyStatus(effect, confidence)

  // Cohort stats
  const cohort = await getCohortStats((supp as any)?.canonical_id || null, primaryMetric)

  return buildReport({
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




