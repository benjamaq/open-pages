import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'
import { persistTruthReportSingle } from '@/lib/truth/persistTruthReportSingle'

type ReanalysisResult = {
  attemptedSupplements: number
  updatedTruthReportRows: number
  supplementsReanalyzed: string[]
}

function buildTruthReportUpdatePayload(userId: string, userSupplementId: string, report: any) {
  return {
    user_id: userId,
    user_supplement_id: userSupplementId,
    canonical_id: null as string | null,
    status: report.status,
    primary_metric: report.primaryMetricLabel,
    effect_direction: report.effect?.direction,
    effect_size: report.effect?.effectSize,
    absolute_change: report.effect?.absoluteChange,
    percent_change: report.effect?.percentChange,
    confidence_score: report.confidence?.score,
    sample_days_on: report.meta?.sampleOn,
    sample_days_off: report.meta?.sampleOff,
    days_excluded_confounds: report.meta?.daysExcluded,
    onset_days: report.meta?.onsetDays,
    responder_percentile: report.community?.userPercentile,
    responder_label: report.community?.responderLabel,
    confounds: [], // v1 summary string already present in raw_context
    mechanism_inference: report.mechanism?.label,
    biology_profile: report.biologyProfile,
    next_steps: report.nextSteps,
    science_note: report.scienceNote,
    raw_context: report,
    analysis_source: (report as any)?.analysisSource || (report as any)?.analysis_source || null,
  }
}

/**
 * After wearable import, re-run implicit truth engine for supplements that were previously "too_early".
 *
 * IMPORTANT:
 * - We UPDATE existing rows (no INSERTs) to avoid creating duplicates.
 * - We only target implicit + too_early rows.
 * - We also invalidate dashboard_cache so the dashboard recomputes.
 */
export async function reanalyzeImplicitTooEarlyAfterWearableUpload(
  userId: string,
  opts?: { maxSupplements?: number }
): Promise<ReanalysisResult> {
  const maxSupplements = Math.max(1, Math.min(50, Number(opts?.maxSupplements ?? 25)))
  try { console.log('[reanalyze] Starting for user:', userId, 'maxSupplements:', maxSupplements) } catch {}

  // 1) Load active user supplements
  const { data: supps, error: suppErr } = await supabaseAdmin
    .from('user_supplement')
    .select('id,name,inferred_start_at')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')

  if (suppErr || !supps || supps.length === 0) {
    try { console.log('[reanalyze] No active supplements found (or error):', suppErr?.message || null) } catch {}
    // Still invalidate cache on wearable upload success, even if no supplements
    try {
      await supabaseAdmin
        .from('dashboard_cache')
        .update({ invalidated_at: new Date().toISOString() } as any)
        .eq('user_id', userId)
    } catch {}
    return { attemptedSupplements: 0, updatedTruthReportRows: 0, supplementsReanalyzed: [] }
  }

  const ids = supps.map((s: any) => String((s as any).id)).filter(Boolean)
  try { console.log('[reanalyze] Active supplements:', ids.length) } catch {}

  // 2) Find implicit + too_early truth reports for those supplements (including duplicates)
  const { data: rows, error: rowsErr } = await supabaseAdmin
    .from('supplement_truth_reports')
    .select('id,user_supplement_id,status,analysis_source,created_at')
    .eq('user_id', userId)
    .in('user_supplement_id', ids as any)
    .eq('status', 'too_early')
    // Some older rows may have NULL analysis_source; treat those as implicit for back-compat.
    .or('analysis_source.eq.implicit,analysis_source.is.null')

  try {
    console.log('[reanalyze] too_early report rows:', Array.isArray(rows) ? rows.length : 0, 'error:', rowsErr?.message || null)
  } catch {}

  const rowIdsBySupplement = new Map<string, string[]>()
  for (const r of rows || []) {
    const usid = String((r as any)?.user_supplement_id || '').trim()
    const rid = String((r as any)?.id || '').trim()
    if (!usid || !rid) continue
    const arr = rowIdsBySupplement.get(usid) || []
    arr.push(rid)
    rowIdsBySupplement.set(usid, arr)
  }

  const tooEarlyIds = Array.from(
    new Set((rows || []).map((r: any) => String((r as any).user_supplement_id)).filter(Boolean))
  ).slice(0, maxSupplements)
  try { console.log('[reanalyze] Unique supplements to reanalyze:', tooEarlyIds.length) } catch {}

  let updatedTruthReportRows = 0
  const supplementsReanalyzed: string[] = []

  // 3) Re-run truth engine and persist exactly ONE truth-report row per supplement (delete + insert)
  for (const userSupplementId of tooEarlyIds) {
    try {
      const sRow = (supps as any[]).find(s => String((s as any)?.id) === String(userSupplementId))
      try {
        console.log('[reanalyze] Analyzing supplement:', {
          userSupplementId,
          name: (sRow as any)?.name || null,
          inferred_start_at: (sRow as any)?.inferred_start_at || null,
          truthReportRowIds: rowIdsBySupplement.get(userSupplementId) || []
        })
      } catch {}
      const report = await generateTruthReportForSupplement(userId, userSupplementId)
      try {
        console.log('[reanalyze] Truth engine result:', {
          userSupplementId,
          status: (report as any)?.status,
          analysisSource: (report as any)?.analysisSource,
          sampleOn: (report as any)?.meta?.sampleOn,
          sampleOff: (report as any)?.meta?.sampleOff,
        })
      } catch {}
      const payload = buildTruthReportUpdatePayload(userId, userSupplementId, report)
      await persistTruthReportSingle(payload)

      try {
        console.log('[reanalyze] Persisted truth_report row (deduped):', {
          userSupplementId,
          previousRowIds: rowIdsBySupplement.get(userSupplementId) || []
        })
      } catch {}

      updatedTruthReportRows += 1
      supplementsReanalyzed.push(userSupplementId)

      // Best-effort: mark supplement as having a truth report
      try {
        await (supabaseAdmin as any)
          .from('user_supplement')
          .update({ has_truth_report: true } as any)
          .eq('id', userSupplementId)
          .eq('user_id', userId)
      } catch {}
    } catch (e: any) {
      try { console.error('[reanalyze] Failed for supplement:', userSupplementId, e?.message || e) } catch {}
    }
  }

  // 4) Invalidate dashboard cache so progress/loop recomputes with new reports
  try {
    const { error: cacheErr } = await supabaseAdmin
      .from('dashboard_cache')
      .update({ invalidated_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
    try { console.log('[reanalyze] dashboard_cache invalidated:', cacheErr?.message || 'ok') } catch {}
  } catch {}

  return {
    attemptedSupplements: tooEarlyIds.length,
    updatedTruthReportRows,
    supplementsReanalyzed,
  }
}


