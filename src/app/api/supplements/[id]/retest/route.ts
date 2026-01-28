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
    const { data: updated, error } = await supabase
      .from('user_supplement')
      .update({
        testing_status: 'testing',
        trial_number: newTrial,
        retest_started_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id,testing_status,trial_number,retest_started_at')
      .maybeSingle()
    if (error || !updated) {
      return NextResponse.json({ error: error?.message || 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, id: (updated as any).id, testing_status: (updated as any).testing_status, trial_number: (updated as any).trial_number })
  } catch (e: any) {
    console.error('[retest API] ERROR:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


