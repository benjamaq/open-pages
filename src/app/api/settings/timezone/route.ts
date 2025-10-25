import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profErr || !profile) return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 })

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('timezone')
    .eq('profile_id', profile.id)
    .maybeSingle()

  return NextResponse.json({ ok: true, timezone: prefs?.timezone || null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(()=>({}))
  const tz = typeof body?.timezone === 'string' && body.timezone ? body.timezone : null
  if (!tz) return NextResponse.json({ ok: false, error: 'Missing timezone' }, { status: 400 })

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profErr || !profile) return NextResponse.json({ ok: false, error: 'Profile not found' }, { status: 404 })

  const { error: updErr } = await supabase
    .from('notification_preferences')
    .upsert({ profile_id: profile.id, timezone: tz }, { onConflict: 'profile_id' })

  if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


