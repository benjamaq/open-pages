import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const userSupplementId = String(body?.userSupplementId || '')
    if (!userSupplementId) return nerror('Missing userSupplementId')

    // Ensure the supplement belongs to this user
    const { data: row } = await supabase
      .from('user_supplement')
      .select('id,user_id,trial_number')
      .eq('id', userSupplementId)
      .maybeSingle()
    if (!row || (row as any).user_id !== user.id) {
      return nerror('Not found or not owned', 404)
    }

    const baseTrial = (() => {
      const n = Number((row as any).trial_number)
      return Number.isFinite(n) && n > 0 ? n : 1
    })()
    const nextTrial = (baseTrial + 1) as number

    // Match the canonical retest behavior used by the dashboard:
    // - set testing_status='testing'
    // - set retest_started_at=NOW
    // - increment trial_number
    // - invalidate dashboard_cache
    // - clear any existing truth report so the card doesn't snap back to completed
    const ts = new Date().toISOString()
    try {
      await (supabaseAdmin as any)
        .from('supplement_truth_reports')
        .delete()
        .eq('user_id', user.id)
        .eq('user_supplement_id', userSupplementId as any)
    } catch {}
    try {
      await (supabaseAdmin as any)
        .from('dashboard_cache')
        .delete()
        .eq('user_id', user.id)
    } catch {}

    const { error } = await supabaseAdmin
      .from('user_supplement')
      .update({
        testing_status: 'testing',
        retest_started_at: ts,
        trial_number: nextTrial,
      })
      .eq('id', userSupplementId)
      .eq('user_id', user.id)
    if (error) return nerror(error.message)

    return NextResponse.json({ ok: true, userSupplementId, trial: nextTrial })
  } catch (e: any) {
    return nerror(e?.message || 'Failed')
  }
}

function nerror(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code })
}


