import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const today = new Date().toLocaleDateString('sv-SE')
    const { error: delErr } = await supabase
      .from('supplement_logs')
      .delete()
      .eq('user_id', user.id)
      .eq('local_date', today)

    if (delErr) {
      return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, deleted_today_for_user: user.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


