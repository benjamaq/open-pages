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
      const rawParams = context?.params
      if (rawParams && typeof (rawParams as any)?.then === 'function') {
        const resolved = await rawParams
        userSupplementId = String(resolved?.userSupplementId || resolved?.id || '')
      } else {
        userSupplementId = String((rawParams as any)?.userSupplementId || (rawParams as any)?.id || '')
      }
      // eslint-disable-next-line no-console
      console.log('[truth-report] Received ID:', userSupplementId)
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
    let effectiveUserSuppId: string = userSupplementId
    try {
      // Capture auth user id for debug
      const authUserId = (user as any)?.id || 'no_user'
      // Pre-check existence without owner filter for better diagnosis
      const { data: suppCheck } = await supabase
        .from('user_supplement')
        .select('id, user_id, name')
        .eq('id', effectiveUserSuppId)
        .maybeSingle()
      // Actual lookup with owner filter
      const { data: supplement, error: suppError } = await supabase
        .from('user_supplement')
        .select('*')
        .eq('id', effectiveUserSuppId)
        .eq('user_id', user.id)
        .maybeSingle()
      try { console.log('[truth-report] Supplement lookup:', { found: !!supplement, error: suppError?.message }) } catch {}
      if (!supplement) {
        // Strict fallback: frontend may pass a stack_items.id — resolve to user_supplement_id via linkage only
        try {
          const { data: stackItem } = await supabase
            .from('stack_items')
            .select('id,profile_id,user_supplement_id')
            .eq('id', userSupplementId)
            .maybeSingle()
          // Resolve the caller's profile id to validate ownership
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
          const profileId = (profile as any)?.id || null
          const stackProfileId = (stackItem as any)?.profile_id || null
          const linkedUserSuppId = (stackItem as any)?.user_supplement_id || null
          if (stackItem && profileId && String(stackProfileId) === String(profileId) && linkedUserSuppId) {
            effectiveUserSuppId = String(linkedUserSuppId)
            try { console.log('[truth-report] Resolved via stack_items linkage:', { from: userSupplementId, to: effectiveUserSuppId }) } catch {}
          } else {
            return NextResponse.json({
              error: 'Supplement not found',
              debug: {
                requestedId: userSupplementId,
                effectiveRequestedId: effectiveUserSuppId,
                authUserId,
                supplementExistsInDb: !!suppCheck,
                supplementOwnerId: (suppCheck as any)?.user_id || null,
                ownerMatches: ((suppCheck as any)?.user_id || null) === authUserId,
                supplementName: (suppCheck as any)?.name || null,
                attemptedFallback: 'stack_items_linkage',
                stackItemFound: !!stackItem,
                stackProfileMatches: (profileId && stackProfileId) ? (String(stackProfileId) === String(profileId)) : null,
                linkedUserSupplementId: linkedUserSuppId || null
              }
            }, { status: 404 })
          }
        } catch (resolveErr: any) {
          try { console.error('[truth-report] Resolution attempt failed:', resolveErr?.message || resolveErr) } catch {}
          return NextResponse.json({
            error: 'Supplement not found',
            debug: {
              requestedId: userSupplementId,
              effectiveRequestedId: effectiveUserSuppId,
              authUserId,
              supplementExistsInDb: !!suppCheck,
              supplementOwnerId: (suppCheck as any)?.user_id || null,
              ownerMatches: ((suppCheck as any)?.user_id || null) === authUserId,
              supplementName: (suppCheck as any)?.name || null,
              attemptedFallback: 'stack_items_linkage_failed',
              resolutionError: resolveErr?.message || String(resolveErr)
            }
          }, { status: 404 })
        }
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
        .eq('user_supplement_id', effectiveUserSuppId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (existing) {
        return NextResponse.json(toResponse(existing))
      }
    }

    // Optional debug: surface environment readiness without relying on server logs
    const debugMode = request.nextUrl.searchParams.get('debug') === '1'
    let debugInfo: any = {}
    if (debugMode) {
      try {
        const since = new Date(); since.setDate(since.getDate() - 60)
        const sinceStr = since.toISOString().slice(0,10)
        const dm = await supabase.from('daily_metrics').select('date', { count: 'exact', head: true }).eq('user_id', user.id).gte('date', sinceStr)
        const si = await supabase.from('supplement_intake_days').select('date', { count: 'exact', head: true }).eq('user_id', user.id).eq('user_supplement_id', userSupplementId).gte('date', sinceStr)
        debugInfo = {
          dailyMetricsCount: dm.count ?? null,
          dailyMetricsError: (dm as any)?.error?.message || null,
          intakeDaysCount: si.count ?? null,
          intakeDaysError: (si as any)?.error?.message || null
        }
        console.log('[truth-report] Debug table counts:', debugInfo)
      } catch (dbgErr: any) {
        try { console.log('[truth-report] Debug counts failed:', dbgErr?.message || dbgErr) } catch {}
      }
    }

    // Generate fresh report
    try { console.log('[truth-report] Calling generateTruthReportForSupplement') } catch {}
    let report: any = null
    try {
      // Note: signature is (userId, userSupplementId)
      report = await generateTruthReportForSupplement(user.id, effectiveUserSuppId)
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
      user_supplement_id: effectiveUserSuppId,
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
      await supabase.from('user_supplement').update({ has_truth_report: true }).eq('id', effectiveUserSuppId).eq('user_id', user.id)
    } catch {}

    return NextResponse.json(debugMode ? { ...report, _debug: debugInfo } : report)
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




