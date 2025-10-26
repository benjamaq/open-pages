import type { DailyEntry, TagCorrelationResult, MetricCorrelationResult, FormattedInsight } from './types'
import type { TagCorrelationConfig, MetricCorrelationConfig, CorrelationResult } from './types'
import { analyzeTagVsMetric } from './tag-analyzer'
import { analyzeMetricVsMetric } from './metric-analyzer'
import { findBestLag } from './lag-analyzer'
import { HIGH_PRIORITY_CORRELATIONS, LAG_ENABLED_TAGS, TYPE_PRIORITY } from './config'
import { applyFDR } from '../utils/statistics'
import { formatInsight } from '../formatters/insight-formatter'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getConfigsByPriority(priority: 'high' | 'normal' | 'low') {
  if (priority === 'high') return HIGH_PRIORITY_CORRELATIONS
  // Normal/low to be implemented later
  return []
}

export async function runCorrelationBatch(userId: string, priority: 'high' | 'normal' | 'low'): Promise<FormattedInsight[]> {
  const startTs = Date.now()
  console.log('[insights] START', { userId, priority, t: new Date().toISOString() })
  console.log('[insights] Fetching entries for last 14 days')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  console.log('[insights] Service role key loaded:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('[insights] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  // --- Robust data fetch with diagnostics and fallback ---
  let entries: any[] = []
  try {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000)
    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]
    console.log('[insights] Query params:', { userId, startStr, endStr })

    // Primary query: filter by local_date
    const { data: rawEntries, error } = await supabase
      .from('daily_entries')
      .select('local_date, pain, mood, sleep_quality, sleep_hours, tags, lifestyle_factors, symptoms')
      .eq('user_id', userId)
      .gte('local_date', startStr)
      .lte('local_date', endStr)
      .order('local_date', { ascending: true })

    console.log('[insights] Query error?', error)
    console.log('[insights] Raw entries count:', rawEntries?.length || 0)
    if (rawEntries && rawEntries.length > 0) {
      console.log('[insights] First entry:', rawEntries[0])
      console.log('[insights] Last entry:', rawEntries[rawEntries.length - 1])
    }

    let sourceEntries = rawEntries || []

    // FALLBACK: use created_at if local_date returned 0
    if (!sourceEntries || sourceEntries.length === 0) {
      console.log('[insights] FALLBACK: Trying created_at instead of local_date')
      const { data: fallbackEntries, error: fbErr } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (fbErr) console.log('[insights] Fallback query error?', fbErr)
      console.log('[insights] Fallback entries:', fallbackEntries?.length || 0)
      sourceEntries = fallbackEntries || []
    }

    entries = (sourceEntries || []).map((e: any) => ({
      ...e,
      tags: Array.isArray(e?.tags) && e.tags.length ? e.tags : (Array.isArray(e?.lifestyle_factors) ? e.lifestyle_factors : []),
    }))
    console.log('[insights] Entries fetched:', entries.length)
  } catch (fetchErr) {
    console.error('[insights] ERROR during entries fetch:', fetchErr)
    return []
  }

  const configs = getConfigsByPriority(priority)
  if (!entries || entries.length === 0 || configs.length === 0) return []

  const tasks = configs.map(async (cfg) => {
    try {
      if ((cfg as any).type === 'tag') {
        const tcfg = cfg as TagCorrelationConfig
        const needsLag = (LAG_ENABLED_TAGS as readonly string[]).includes(tcfg.tag) && typeof tcfg.lagDays === 'number'
        if (needsLag) {
          const lag = findBestLag(entries as any, tcfg.tag, tcfg.metric, Math.max(0, tcfg.lagDays || 3))
          return lag?.result || null
        }
        return analyzeTagVsMetric(entries as any, tcfg)
      } else {
        const mcfg = cfg as MetricCorrelationConfig
        return analyzeMetricVsMetric(entries as any, mcfg)
      }
    } catch (e) {
      console.error('[insights] Analyzer error for cfg:', cfg, e)
      return null
    }
  })

  const raw = await Promise.all(tasks)
  const nonNull = raw.filter(Boolean) as CorrelationResult[]
  console.log('[insights] Raw results before FDR:', nonNull.length)
  if (nonNull.length === 0) return []

  let passed: CorrelationResult[] = []
  try {
    passed = applyFDR(nonNull, 0.1)
  } catch (e) {
    console.error('[insights] FDR error:', e)
    passed = nonNull
  }
  console.log('[insights] After FDR:', passed.length)
  if (passed.length > 3) {
    console.error('[insights] SAFETY: Too many insights!', passed.length)
    return []
  }
  const formatted = passed.map((r) => formatInsight(r))
  formatted.sort((a, b) => {
    if (a.type !== b.type) return (TYPE_PRIORITY as any)[a.type] - (TYPE_PRIORITY as any)[b.type]
    const aD = (a.data?.cohensD || 0) as number
    const bD = (b.data?.cohensD || 0) as number
    return bD - aD
  })
  const runtime = Date.now() - startTs
  console.log('[insights] Analyzed', { totalCorrelations: raw.length, passedFDR: passed.length, selected: formatted[0]?.insightKey })
  console.log('[insights] END', { userId, insightKey: formatted[0]?.insightKey, runtime })
  return formatted
}

export async function selectTodaysInsight(allInsights: FormattedInsight[]): Promise<FormattedInsight | null> {
  if (!allInsights || allInsights.length === 0) return null
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 14)

  const { data: recent } = await supabase
    .from('elli_messages')
    .select('context')
    .eq('message_type', 'insight')
    .gte('created_at', cutoff.toISOString())

  const recentKeys = new Set((recent || []).map((r: any) => r.context?.insightKey).filter(Boolean))
  const novel = allInsights.filter((i) => !recentKeys.has(i.insightKey))
  if (novel.length === 0) return null

  novel.sort((a, b) => {
    if (a.type !== b.type) return (TYPE_PRIORITY as any)[a.type] - (TYPE_PRIORITY as any)[b.type]
    const aD = (a.data?.cohensD || 0) as number
    const bD = (b.data?.cohensD || 0) as number
    return bD - aD
  })
  return novel[0]
}


