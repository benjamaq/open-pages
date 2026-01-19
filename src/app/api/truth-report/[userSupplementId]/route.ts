import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTruthReportForSupplement } from '@/lib/truthEngine'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, context: any) {
  try {
    // eslint-disable-next-line no-console
    console.log('=== TRUTH REPORT API START ===')
  } catch {}
  try {
    // Robust param resolution for Next.js 14 (params can be a Promise) and different param keys
    let userSupplementId: string = ''
    try {
      const p = context?.params
      if (p && typeof p?.then === 'function') {
        const resolved = await p
        userSupplementId = String(resolved?.userSupplementId || resolved?.id || '')
      } else {
        userSupplementId = String((p as any)?.userSupplementId || (p as any)?.id || '')
      }
      // eslint-disable-next-line no-console
      console.log('[truth-report] Received ID:', userSupplementId)
      console.log('[truth-report] Full params:', p)
    } catch {}
    if (!userSupplementId || userSupplementId === 'undefined') {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    try { console.log('[truth-report] ID extracted:', userSupplementId) } catch {}
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    try { console.log('[truth-report] User:', (user as any)?.id || null) } catch {}
    if (!user) {
      try { console.log('[truth-report] Unauthorized request') } catch {}
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const force = request.nextUrl.searchParams.get('force') === 'true'

    try { console.log('[truth-report] Starting report generation for:', userSupplementId, 'user:', user.id) } catch {}

    // Verify supplement exists and belongs to user (avoid generating for missing/foreign IDs)
    try {
      const { data: supplement, error: suppError } = await supabase
        .from('user_supplement')
        .select('*')
        .eq('id', userSupplementId)
        .eq('user_id', user.id)
        .maybeSingle()
      try { console.log('[truth-report] Supplement lookup:', { found: !!supplement, error: suppError?.message }) } catch {}
      if (!supplement) {
        return NextResponse.json({ error: 'Supplement not found', id: userSupplementId }, { status: 404 })
      }
    } catch (lookupErr: any) {
      try { console.error('[truth-report] Supplement lookup failed:', lookupErr?.message || lookupErr) } catch {}
      return NextResponse.json({ error: 'Supplement lookup failed', details: lookupErr?.message || 'lookup_failed' }, { status: 500 })
    }

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
    try { console.log('[truth-report] Calling generateTruthReportForSupplement') } catch {}
    let report: any = null
    try {
      // Note: signature is (userId, userSupplementId)
      report = await generateTruthReportForSupplement(user.id, userSupplementId)
      try {
        const preview = typeof report === 'string' ? String(report).slice(0, 200) : JSON.stringify(report || {}).slice(0, 200)
        console.log('[truth-report] Report generated:', preview)
      } catch {}
    } catch (reportError: any) {
      try { console.error('[truth-report] Report generation failed:', reportError?.message || reportError) } catch {}
      return NextResponse.json({ error: 'Report generation failed', details: reportError?.message || 'generate_failed' }, { status: 500 })
    }

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
    try {
      console.error('=== TRUTH REPORT ERROR ===')
      console.error('Error message:', e?.message)
      console.error('Error stack:', e?.stack)
      console.error('Full error:', e)
    } catch {}
    return NextResponse.json({
      error: 'Internal server error',
      message: e?.message || 'Failed'
    }, { status: 500 })
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




