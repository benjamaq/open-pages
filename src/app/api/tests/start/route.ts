import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = String(body?.action || '')
    const payload = body?.payload || {}

    // Derive validation test payload
    type Insert = {
      user_id: string
      kind: 'timing' | 'removal' | 'dose' | 'synergy'
      state: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
      user_supplement_ids: string[]
      days_planned: number
      started_at: string
      adherence?: number
      note?: string | null
    }

    const today = new Date().toISOString().slice(0, 10)
    const base: Omit<Insert, 'kind' | 'user_supplement_ids'> = {
      user_id: user.id,
      state: 'active',
      days_planned: Number(payload?.days_planned || 7),
      started_at: today,
      adherence: 0,
      note: null
    }
    let insert: Insert | null = null

    if (action === 'start_removal') {
      const sid = String(payload?.user_supplement_id || payload?.user_supplement_ids?.[0] || '')
      insert = { ...base, kind: 'removal', user_supplement_ids: [sid], user_id: user.id, started_at: today }
    } else if (action === 'start_timing') {
      const sid = String(payload?.user_supplement_id || payload?.user_supplement_ids?.[0] || '')
      const timing = String(payload?.timing || 'evening')
      insert = { ...base, kind: 'timing', user_supplement_ids: [sid], user_id: user.id, started_at: today, note: `timing:${timing}` }
    } else if (action === 'start_dose') {
      const sid = String(payload?.user_supplement_id || payload?.user_supplement_ids?.[0] || '')
      const delta = String(payload?.dose_delta || 'increase_25pct')
      insert = { ...base, kind: 'dose', user_supplement_ids: [sid], user_id: user.id, started_at: today, note: `dose:${delta}` }
    } else if (action === 'start_synergy') {
      const sids: string[] = (payload?.user_supplement_ids || []).map((x: any) => String(x))
      insert = { ...base, kind: 'synergy', user_supplement_ids: sids, user_id: user.id, started_at: today }
    } else if (action === 'finish_active_test') {
      // Mark most recent active test completed
      const { data: test } = await supabase
        .from('validation_test')
        .select('id')
        .eq('user_id', user.id)
        .eq('state', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!(test as any)?.id) return NextResponse.json({ ok: false, error: 'no_active_test' }, { status: 400 })
      const { error } = await (supabase as any)
        .from('validation_test')
        .update({ state: 'completed' } as any)
        .eq('id', (test as any).id)
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, status: 'completed', testId: (test as any).id })
    } else {
      return NextResponse.json({ error: 'unsupported_action' }, { status: 400 })
    }

    if (!insert) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })

    const { data, error } = await (supabase as any)
      .from('validation_test')
      .insert(insert as any)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}






