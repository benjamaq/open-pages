'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateUserBaseline } from '@/lib/engine/calibration'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { mood, energy, focus, day } = await req.json()
  const today = new Date().toISOString().slice(0, 10)
  const dayToUse = typeof day === 'string' && day.length >= 10 ? day.slice(0,10) : today

  // Write into canonical check-ins table
  const { data: saved, error } = await supabase.from('checkins').upsert(
    { user_id: user.id, date: dayToUse, mood },
    { onConflict: 'user_id,date' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mirror to daily_entries (energy/focus optional)
  const { error: deErr } = await supabase
    .from('daily_entries')
    .upsert(
      {
        user_id: user.id,
        local_date: dayToUse,
        mood: mood ?? null,
        energy: typeof energy === 'number' ? energy : null,
        focus: typeof focus === 'number' ? focus : null
      },
      { onConflict: 'user_id,local_date' }
    )
  if (deErr) console.error('Failed to upsert daily_entries:', deErr)

  // Fire-and-forget baseline update
  updateUserBaseline(user.id).catch(err => {
    console.error('Failed to update baseline:', err)
  })

  // Optional: nudge UI
  return NextResponse.json({ ok: true, saved, nudged: true })
}

