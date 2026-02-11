import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'

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

  // 1) Load active user supplements
  const { data: supps, error: suppErr } = await supabaseAdmin
    .from('user_supplement')
    .select('id')
    .eq('user_id', userId)
    .or('is_active.eq.true,is_active.is.null')

  if (suppErr || !supps || supps.length === 0) {
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

  // 2) Find implicit + too_early truth reports for those supplements (including duplicates)
  const { data: rows } = await supabaseAdmin
    .from('supplement_truth_reports')
    .select('id,user_supplement_id,status,analysis_source,created_at')
    .eq('user_id', userId)
    .in('user_supplement_id', ids as any)
    .eq('status', 'too_early')
    .eq('analysis_source', 'implicit')

  const tooEarlyIds = Array.from(
    new Set((rows || []).map((r: any) => String((r as any).user_supplement_id)).filter(Boolean))
  ).slice(0, maxSupplements)

  let updatedTruthReportRows = 0
  const supplementsReanalyzed: string[] = []

  // 3) Re-run truth engine and UPDATE existing too_early rows (no inserts)
  for (const userSupplementId of tooEarlyIds) {
    try {
      const report = await generateTruthReportForSupplement(userId, userSupplementId)
      const payload = buildTruthReportUpdatePayload(userId, userSupplementId, report)

      const { data: updated } = await (supabaseAdmin as any)
        .from('supplement_truth_reports')
        .update(payload as any)
        .eq('user_id', userId)
        .eq('user_supplement_id', userSupplementId)
        .eq('status', 'too_early')
        .eq('analysis_source', 'implicit')
        .select('id')

      updatedTruthReportRows += Array.isArray(updated) ? updated.length : (updated ? 1 : 0)
      supplementsReanalyzed.push(userSupplementId)

      // Best-effort: mark supplement as having a truth report
      try {
        await (supabaseAdmin as any)
          .from('user_supplement')
          .update({ has_truth_report: true } as any)
          .eq('id', userSupplementId)
          .eq('user_id', userId)
      } catch {}
    } catch {
      // ignore per-supplement failures; don't block upload success
    }
  }

  // 4) Invalidate dashboard cache so progress/loop recomputes with new reports
  try {
    await supabaseAdmin
      .from('dashboard_cache')
      .update({ invalidated_at: new Date().toISOString() } as any)
      .eq('user_id', userId)
  } catch {}

  return {
    attemptedSupplements: tooEarlyIds.length,
    updatedTruthReportRows,
    supplementsReanalyzed,
  }
}


