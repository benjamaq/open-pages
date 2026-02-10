import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Prefs = {
  reminder_enabled: boolean
  reminder_time: string
  reminder_timezone: string | null
  reminder_popup_dismissed?: boolean
  commitment_message_shown?: boolean
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const meta = (user as any)?.user_metadata || {}
    const { data: prof, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const pm = (prof as any)?.public_modules || {}
    const stored: Prefs = {
      // Prefer real columns if present; otherwise fall back to JSON bucket
      reminder_enabled: (prof as any)?.reminder_enabled ?? pm?.settings?.reminder_enabled ?? (meta?.reminder_enabled ?? false),
      reminder_time: (prof as any)?.reminder_time ?? pm?.settings?.reminder_time ?? (meta?.reminder_time ?? '06:00'),
      reminder_timezone: (prof as any)?.reminder_timezone ?? pm?.settings?.reminder_timezone ?? (meta?.reminder_timezone ?? null),
      reminder_popup_dismissed: (prof as any)?.reminder_popup_dismissed ?? pm?.settings?.reminder_popup_dismissed ?? false,
      commitment_message_shown: (prof as any)?.commitment_message_shown ?? pm?.settings?.commitment_message_shown ?? false,
    }
    return NextResponse.json({
      email: user.email,
      ...stored,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as Partial<Prefs>
  const nextPrefs: Prefs = {
    reminder_enabled: Boolean(body.reminder_enabled),
    reminder_time: String(body.reminder_time || '06:00'),
    reminder_timezone: body.reminder_timezone ? String(body.reminder_timezone) : null,
    reminder_popup_dismissed: body.reminder_popup_dismissed != null ? Boolean(body.reminder_popup_dismissed) : undefined,
    commitment_message_shown: body.commitment_message_shown != null ? Boolean(body.commitment_message_shown) : undefined,
  }
  try {
    // First attempt: write to concrete columns (if they exist)
    const sbAny = supabase as any
    const { error: upErr } = await sbAny
      .from('profiles')
      .update({
        reminder_enabled: nextPrefs.reminder_enabled as any,
        reminder_time: nextPrefs.reminder_time as any,
        reminder_timezone: nextPrefs.reminder_timezone as any,
        ...(nextPrefs.reminder_popup_dismissed != null ? { reminder_popup_dismissed: nextPrefs.reminder_popup_dismissed as any } : {}),
        ...(nextPrefs.commitment_message_shown != null ? { commitment_message_shown: nextPrefs.commitment_message_shown as any } : {}),
      })
      .eq('user_id', user.id)
    if (!upErr) {
      // Also mirror into auth user metadata so reminders can be read from auth
      try { await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: nextPrefs.reminder_timezone } as any }) } catch {}
      return NextResponse.json({ ok: true, saved: nextPrefs })
    }
    // Fallback: persist into public_modules.settings
    const { data: prof } = await sbAny
      .from('profiles')
      .select('public_modules')
      .eq('user_id', user.id)
      .maybeSingle()
    const pm = (prof as any)?.public_modules || {}
    const updatedSettings = { ...(pm?.settings || {}), reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: nextPrefs.reminder_timezone }
    if (nextPrefs.reminder_popup_dismissed != null) (updatedSettings as any).reminder_popup_dismissed = nextPrefs.reminder_popup_dismissed
    if (nextPrefs.commitment_message_shown != null) (updatedSettings as any).commitment_message_shown = nextPrefs.commitment_message_shown
    const updated = { ...(pm || {}), settings: updatedSettings }
    const { error: jsonErr } = await sbAny
      .from('profiles')
      .update({ public_modules: updated as any })
      .eq('user_id', user.id)
    if (jsonErr) return NextResponse.json({ error: jsonErr.message }, { status: 500 })
    try { await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: nextPrefs.reminder_timezone } as any }) } catch {}
    return NextResponse.json({ ok: true, saved: nextPrefs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


