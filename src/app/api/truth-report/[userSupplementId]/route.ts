import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: { params: { userSupplementId: string } }) {
  try {
    const { userSupplementId } = context.params
    try {
      // eslint-disable-next-line no-console
      console.log('[truth-report] Received ID:', userSupplementId)
      console.log('[truth-report] Full params:', context?.params)
    } catch {}
    if (!userSupplementId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      try { console.log('[truth-report] Unauthorized request') } catch {}
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const force = request.nextUrl.searchParams.get('force') === 'true'

    if (!force) {
      // Return cached report if exists
      const { data: existing } = await supabase
        .from('supplement_truth_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('user_supplement_id', userSupplementId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing) {
        return NextResponse.json(toResponse(existing))
      }
    }

    // Generate fresh report
    try { console.log('[truth-report] Generating report for', { userId: user.id, userSupplementId }) } catch {}
    const report = await generateTruthReportForSupplement(user.id, userSupplementId)

    // Save
    const payloadToStore = {
      user_id: user.id,
      user_supplement_id: userSupplementId,
      canonical_id: null as string | null,
      status: report.status,
      primary_metric: report.primaryMetricLabel, // store label for readability; also could store key
      effect_direction: report.effect.direction,
      effect_size: report.effect.effectSize,
      absolute_change: report.effect.absoluteChange,
      percent_change: report.effect.percentChange,
      confidence_score: report.confidence.score,
      sample_days_on: report.meta.sampleOn,
      sample_days_off: report.meta.sampleOff,
      days_excluded_confounds: report.meta.daysExcluded,
      onset_days: report.meta.onsetDays,
      responder_percentile: report.community.userPercentile,
      responder_label: report.community.responderLabel,
      confounds: [], // v1 summary string already present
      mechanism_inference: report.mechanism.label,
      biology_profile: report.biologyProfile,
      next_steps: report.nextSteps,
      science_note: report.scienceNote,
      raw_context: report
    }
    try {
      await supabase.from('supplement_truth_reports').insert(payloadToStore)
    } catch (e: any) {
      try { console.log('[truth-report] insert failed (non-fatal):', e?.message || e) } catch {}
    }

    // Mark supplement record flag if present
    try {
      await supabase.from('user_supplement').update({ has_truth_report: true }).eq('id', userSupplementId).eq('user_id', user.id)
    } catch {}

    return NextResponse.json(report)
  } catch (e: any) {
    try { console.error('[truth-report] Error:', e) } catch {}
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

function toResponse(row: any) {
  // If we stored raw_context from last generation, prefer returning it
  if (row?.raw_context) return row.raw_context
  // Minimal adapter fallback
  return {
    status: row?.status || 'too_early',
    verdictTitle: '',
    verdictLabel: '',
    primaryMetricLabel: row?.primary_metric || 'Metric',
    effect: {
      meanOn: 0,
      meanOff: 0,
      absoluteChange: row?.absolute_change ?? 0,
      percentChange: row?.percent_change ?? null,
      effectSize: row?.effect_size ?? 0,
      direction: (row?.effect_direction || 'neutral') as 'positive' | 'negative' | 'neutral',
      sampleOn: row?.sample_days_on ?? 0,
      sampleOff: row?.sample_days_off ?? 0
    },
    confidence: {
      score: row?.confidence_score ?? 0,
      label: 'low',
      explanation: 'Cached result.'
    },
    confoundsSummary: '',
    mechanism: { label: row?.mechanism_inference || '', text: '' },
    community: {
      sampleSize: 0,
      avgEffect: null,
      userPercentile: row?.responder_percentile ?? null,
      responderLabel: row?.responder_label ?? null
    },
    biologyProfile: row?.biology_profile || '',
    nextSteps: row?.next_steps || '',
    scienceNote: row?.science_note || '',
    meta: {
      sampleOn: row?.sample_days_on ?? 0,
      sampleOff: row?.sample_days_off ?? 0,
      daysExcluded: row?.days_excluded_confounds ?? 0,
      onsetDays: row?.onset_days ?? null,
      generatedAt: row?.created_at || new Date().toISOString()
    }
  }
}




