import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest, ctx: any) {
  // Resolve params (Next 14+)
  let id: string | null = null
  try {
    const p = ctx?.params
    if (p && typeof (p as any)?.then === 'function') {
      const resolved = await p
      id = String(resolved?.id || '')
    } else {
      id = String((p as any)?.id || '')
    }
  } catch {}
  const supabase = await createClient()
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Verify ownership and current status
    const { data: row } = await supabase
      .from('user_supplement')
      .select('id,user_id,testing_status,trial_number')
      .eq('id', id)
      .maybeSingle()
    if (!row || String((row as any).user_id) !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const currentStatus = String((row as any).testing_status || 'inactive')

    // Always clear any existing truth report so the dashboard no longer treats this supplement as completed.
    // Use service role (admin) so RLS cannot block the delete.
    let truthDeleteCount = 0
    try {
      const where = { user_id: user.id, user_supplement_id: id }
      console.log('[retest API] delete supplement_truth_reports where=', where)
      const { data: deleted, error: delErr } = await (supabaseAdmin as any)
        .from('supplement_truth_reports')
        .delete()
        .eq('user_id', user.id)
        .eq('user_supplement_id', id as any)
        .select('id')
      if (delErr) {
        console.log('[retest API] truth delete failed (admin):', delErr?.message || delErr)
      } else {
        truthDeleteCount = Array.isArray(deleted) ? deleted.length : 0
        console.log('[retest API] truth delete ok (admin):', { deletedCount: truthDeleteCount, ids: (deleted || []).slice(0, 5) })
      }
    } catch (e: any) {
      console.log('[retest API] truth delete threw (admin):', e?.message || e)
    }

    // Hard proof: immediately query remaining rows for this supplement + user and log count.
    let remainingReports = 0
    try {
      const { count: remainingCount, error: remErr } = await (supabaseAdmin as any)
        .from('supplement_truth_reports')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('user_supplement_id', id as any)
      if (remErr) {
        console.log('[retest API] remainingReports count failed (admin):', remErr?.message || remErr)
      } else {
        remainingReports = Number(remainingCount || 0)
      }
      console.log('[retest API] remainingReports (admin):', { user_supplement_id: id, remainingReports })
    } catch (e: any) {
      console.log('[retest API] remainingReports count threw (admin):', e?.message || e)
    }

    // Invalidate dashboard cache so the UI reflects the retest immediately.
    try {
      // IMPORTANT: dashboard_cache.payload is NOT NULL in some deployments; INSERT ... ON CONFLICT can fail
      // because the insert path tries to write payload=NULL before the conflict handler runs.
      // Use DELETE (or UPDATE) instead of UPSERT to avoid NOT NULL violations.
      const { error: cacheErr } = await (supabaseAdmin as any)
        .from('dashboard_cache')
        .delete()
        .eq('user_id', user.id)
      if (cacheErr) {
        console.log('[retest API] dashboard_cache delete failed:', cacheErr?.message || cacheErr)
        try {
          const { error: updErr } = await (supabaseAdmin as any)
            .from('dashboard_cache')
            .update({ invalidated_at: new Date().toISOString() } as any)
            .eq('user_id', user.id)
          if (updErr) console.log('[retest API] dashboard_cache update invalidated_at failed:', updErr?.message || updErr)
        } catch (e: any) {
          console.log('[retest API] dashboard_cache update invalidated_at threw:', e?.message || e)
        }
      }
    } catch (e: any) {
      console.log('[retest API] dashboard_cache invalidate threw:', e?.message || e)
    }

    // If we're already testing, don't bump trial_number again, but DO ensure retest_started_at is set.
    // IMPORTANT: do not silently succeed if this write fails (otherwise progress loop will include historical data).
    if (currentStatus === 'testing') {
      const ts = new Date().toISOString()
      let updated: any = null
      try {
        const res = await (supabaseAdmin as any)
          .from('user_supplement')
          // IMPORTANT: only update columns confirmed to exist.
          .update({ testing_status: 'testing', retest_started_at: ts } as any)
          .eq('id', id)
          .eq('user_id', user.id)
          .select('id,testing_status,trial_number,retest_started_at')
          .maybeSingle()
        updated = res?.data || null
        const err = res?.error || null
        if (err || !updated) {
          try { console.log('[retest API] user_supplement update failed (already testing):', err?.message || err) } catch {}
          return NextResponse.json({ error: err?.message || 'Retest update failed' }, { status: 500 })
        }
      } catch (e: any) {
        try { console.log('[retest API] user_supplement update threw (already testing):', e?.message || e) } catch {}
        return NextResponse.json({ error: e?.message || 'Retest update failed' }, { status: 500 })
      }
      try {
        await (supabaseAdmin as any)
          .from('user_supplement_effect')
          .delete()
          .eq('user_id', user.id)
          .eq('user_supplement_id', id as any)
      } catch {}
      return NextResponse.json({
        ok: true,
        truthDeleteCount,
        remainingReports,
        id: (updated as any).id,
        testing_status: (updated as any).testing_status,
        trial_number: (updated as any).trial_number ?? null,
        retest_started_at: (updated as any).retest_started_at ?? null,
      })
    }

    // Starter limit check when re-entering testing
    let isPremium = false
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('user_id', user.id)
        .maybeSingle()
      const tier = String((profile as any)?.tier || '').toLowerCase()
      isPremium = ['pro','premium','creator'].includes(tier)
    } catch {}
    // For Starter, retesting an already tested supplement does not increase lifetime count,
    // so we allow retest even if they have reached the 5-tested limit.
    // No additional limit check here.

    // Bump trial_number: COALESCE(trial_number,1) + 1 semantics
    const baseTrial = (() => {
      const n = Number((row as any).trial_number)
      return Number.isFinite(n) && n > 0 ? n : 1
    })()
    const newTrial = baseTrial + 1
    // Reset supplement state for retest (admin client so it always writes)
    let updated: any = null
    try {
      const res = await (supabaseAdmin as any)
        .from('user_supplement')
        .update({
          testing_status: 'testing',
          trial_number: newTrial,
          retest_started_at: new Date().toISOString(),
        } as any)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id,testing_status,trial_number,retest_started_at')
        .maybeSingle()
      updated = res?.data || null
      const err = res?.error || null
      if (err || !updated) {
        try { console.log('[retest API] user_supplement update failed:', err?.message || err) } catch {}
        return NextResponse.json({ error: err?.message || 'Update failed' }, { status: 500 })
      }
    } catch (e: any) {
      try { console.log('[retest API] user_supplement update threw:', e?.message || e) } catch {}
      return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 500 })
    }

    // Also clear cached effect rows so any secondary cached verdict/effect data is reset (best-effort).
    try {
      await (supabaseAdmin as any)
        .from('user_supplement_effect')
        .delete()
        .eq('user_id', user.id)
        .eq('user_supplement_id', id as any)
    } catch {}

    return NextResponse.json({
      ok: true,
      truthDeleteCount,
      remainingReports,
      id: (updated as any).id,
      testing_status: String((updated as any).testing_status || 'testing'),
      trial_number: (updated as any).trial_number ?? null,
      retest_started_at: (updated as any).retest_started_at ?? null,
    })
  } catch (e: any) {
    console.error('[retest API] ERROR:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


