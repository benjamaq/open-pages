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
    if (!row || row.user_id !== user.id) {
      return nerror('Not found or not owned', 404)
    }

    const nextTrial = (row.trial_number || 1) + 1
    const { error } = await supabaseAdmin
      .from('user_supplement')
      .update({
        retest_started_at: new Date().toISOString(),
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


