import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    // Allow retest from any non-testing state (complete, inconclusive, inactive)
    if (currentStatus === 'testing') {
      return NextResponse.json({ error: 'Already testing' }, { status: 400 })
    }

    // Clear any existing truth report so the dashboard no longer treats this supplement as completed.
    // The progress loop may regenerate a new (likely "too_early") truth report based on the new retest window.
    try {
      const { error: delErr } = await (supabase as any)
        .from('supplement_truth_reports')
        .delete()
        .eq('user_id', user.id)
        .eq('user_supplement_id', id as any)
      if (delErr) {
        console.log('[retest API] truth delete failed:', delErr?.message || delErr)
      } else {
        console.log('[retest API] truth deleted:', { user_supplement_id: id })
      }
    } catch (e: any) {
      console.log('[retest API] truth delete threw:', e?.message || e)
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

    const newTrial = (Number((row as any).trial_number || 1) || 1) + 1
    const { data: updated, error } = await (supabase as any)
      .from('user_supplement')
      .update({
        testing_status: 'testing',
        trial_number: newTrial,
        retest_started_at: new Date().toISOString()
      } as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id,testing_status,trial_number,retest_started_at')
      .maybeSingle()
    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
    }

    // Invalidate dashboard cache so the UI reflects the retest immediately.
    try {
      const ts = new Date().toISOString()
      const { error: cacheErr } = await (supabase as any)
        .from('dashboard_cache')
        .upsert({ user_id: user.id, invalidated_at: ts } as any, { onConflict: 'user_id' } as any)
      if (cacheErr) {
        console.log('[retest API] dashboard_cache invalidate failed:', cacheErr?.message || cacheErr)
      }
    } catch (e: any) {
      console.log('[retest API] dashboard_cache invalidate threw:', e?.message || e)
    }
    return NextResponse.json({ ok: true, id: (updated as any).id, testing_status: (updated as any).testing_status, trial_number: (updated as any).trial_number })
  } catch (e: any) {
    console.error('[retest API] ERROR:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


