import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Prefs = {
  reminder_enabled: boolean
  reminder_time: string
  reminder_timezone: string | null
  reminder_timezone_autodetected?: boolean
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
    reminder_timezone_autodetected: body.reminder_timezone_autodetected != null ? Boolean(body.reminder_timezone_autodetected) : undefined,
    reminder_popup_dismissed: body.reminder_popup_dismissed != null ? Boolean(body.reminder_popup_dismissed) : undefined,
    commitment_message_shown: body.commitment_message_shown != null ? Boolean(body.commitment_message_shown) : undefined,
  }
  try {
    // If timezone is autodetected, do not overwrite an existing reminder_timezone (user may have set manually).
    let tzToWrite: string | null = nextPrefs.reminder_timezone
    try {
      if (nextPrefs.reminder_enabled && nextPrefs.reminder_timezone_autodetected) {
        const { data: existing } = await (supabase as any)
          .from('profiles')
          .select('reminder_timezone')
          .eq('user_id', user.id)
          .maybeSingle()
        const existingTz = (existing as any)?.reminder_timezone ?? null
        if (existingTz) tzToWrite = existingTz
      }
    } catch {}

    // First attempt: write to concrete columns (if they exist)
    const sbAny = supabase as any
    const { error: upErr } = await sbAny
      .from('profiles')
      .update({
        reminder_enabled: nextPrefs.reminder_enabled as any,
        reminder_time: nextPrefs.reminder_time as any,
        reminder_timezone: tzToWrite as any,
        ...(nextPrefs.reminder_popup_dismissed != null ? { reminder_popup_dismissed: nextPrefs.reminder_popup_dismissed as any } : {}),
        ...(nextPrefs.commitment_message_shown != null ? { commitment_message_shown: nextPrefs.commitment_message_shown as any } : {}),
      })
      .eq('user_id', user.id)
    if (!upErr) {
      // Also mirror into auth user metadata so reminders can be read from auth
      try { await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any }) } catch {}
      return NextResponse.json({ ok: true, saved: { ...nextPrefs, reminder_timezone: tzToWrite } })
    }

    // Second attempt: admin fallback (RLS-safe) so the UI can't "pretend save" while the DB stays false.
    try {
      const { error: adminErr } = await (supabaseAdmin as any)
        .from('profiles')
        .update({
          reminder_enabled: nextPrefs.reminder_enabled as any,
          reminder_time: nextPrefs.reminder_time as any,
          reminder_timezone: tzToWrite as any,
          ...(nextPrefs.reminder_popup_dismissed != null ? { reminder_popup_dismissed: nextPrefs.reminder_popup_dismissed as any } : {}),
          ...(nextPrefs.commitment_message_shown != null ? { commitment_message_shown: nextPrefs.commitment_message_shown as any } : {}),
        })
        .eq('user_id', user.id)
      if (!adminErr) {
        try { await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any }) } catch {}
        return NextResponse.json({ ok: true, saved: { ...nextPrefs, reminder_timezone: tzToWrite } })
      }
    } catch {}

    // Fallback: persist into public_modules.settings
    const { data: prof } = await sbAny
      .from('profiles')
      .select('public_modules')
      .eq('user_id', user.id)
      .maybeSingle()
    const pm = (prof as any)?.public_modules || {}
    const updatedSettings = { ...(pm?.settings || {}), reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite }
    if (nextPrefs.reminder_popup_dismissed != null) (updatedSettings as any).reminder_popup_dismissed = nextPrefs.reminder_popup_dismissed
    if (nextPrefs.commitment_message_shown != null) (updatedSettings as any).commitment_message_shown = nextPrefs.commitment_message_shown
    const updated = { ...(pm || {}), settings: updatedSettings }
    const { error: jsonErr } = await sbAny
      .from('profiles')
      .update({ public_modules: updated as any })
      .eq('user_id', user.id)
    if (jsonErr) return NextResponse.json({ error: jsonErr.message }, { status: 500 })
    try { await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any }) } catch {}
    return NextResponse.json({ ok: true, saved: { ...nextPrefs, reminder_timezone: tzToWrite } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


