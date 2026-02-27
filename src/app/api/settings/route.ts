import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Prefs = {
  reminder_enabled: boolean
  reminder_time: string
  reminder_timezone: string | null
  reminder_timezone_autodetected?: boolean
  reminder_popup_dismissed?: boolean
  wearable_info_dismissed?: boolean
  wearable_prompt_dismissed?: boolean
  welcome_back_banner_dismissed?: boolean
  welcome_back_banner_dismissed_at?: string | null
  commitment_message_shown?: boolean
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const meta = (user as any)?.user_metadata || {}
    // Profiles is the source of truth. Use service role and a non-single query so we
    // don't accidentally fall back to defaults if duplicate rows exist.
    let prof: any = null
    try {
      const { data: rows, error } = await (supabaseAdmin as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
      if (!error && Array.isArray(rows) && rows.length > 0) prof = rows[0]
    } catch {}
    const pm = (prof as any)?.public_modules || {}
    const stored: Prefs = {
      // Prefer real columns if present; otherwise fall back to JSON bucket
      reminder_enabled: (prof as any)?.reminder_enabled ?? pm?.settings?.reminder_enabled ?? (meta?.reminder_enabled ?? false),
      reminder_time: (prof as any)?.reminder_time ?? pm?.settings?.reminder_time ?? (meta?.reminder_time ?? '06:00'),
      reminder_timezone: (prof as any)?.reminder_timezone ?? pm?.settings?.reminder_timezone ?? (meta?.reminder_timezone ?? 'UTC'),
      reminder_popup_dismissed: (prof as any)?.reminder_popup_dismissed ?? pm?.settings?.reminder_popup_dismissed ?? false,
      wearable_info_dismissed: (prof as any)?.wearable_info_dismissed ?? pm?.settings?.wearable_info_dismissed ?? false,
      wearable_prompt_dismissed: (prof as any)?.wearable_prompt_dismissed ?? pm?.settings?.wearable_prompt_dismissed ?? false,
      welcome_back_banner_dismissed: (prof as any)?.welcome_back_banner_dismissed ?? pm?.settings?.welcome_back_banner_dismissed ?? false,
      welcome_back_banner_dismissed_at: (prof as any)?.welcome_back_banner_dismissed_at ?? pm?.settings?.welcome_back_banner_dismissed_at ?? null,
      commitment_message_shown: (prof as any)?.commitment_message_shown ?? pm?.settings?.commitment_message_shown ?? false,
    }
    // FINAL AUTHORITY: profiles.reminder_enabled wins after all fallback chains.
    const response: any = {
      email: user.email,
      ...stored,
    }
    if ((prof as any)?.reminder_enabled != null) response.reminder_enabled = Boolean((prof as any).reminder_enabled)
    if ((prof as any)?.reminder_time != null) response.reminder_time = String((prof as any).reminder_time)
    if ((prof as any)?.reminder_timezone != null) response.reminder_timezone = (prof as any).reminder_timezone
    return NextResponse.json(response)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as Partial<Prefs> & Record<string, any>
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k)

  // Load existing so this endpoint is PATCH-like (safe for dismissal-only updates).
  const meta = (user as any)?.user_metadata || {}
  const { data: prof, error: profErr } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 })
  const pm = (prof as any)?.public_modules || {}
  const existing: Prefs = {
    reminder_enabled: (prof as any)?.reminder_enabled ?? pm?.settings?.reminder_enabled ?? (meta?.reminder_enabled ?? false),
    reminder_time: (prof as any)?.reminder_time ?? pm?.settings?.reminder_time ?? (meta?.reminder_time ?? '06:00'),
    reminder_timezone: (prof as any)?.reminder_timezone ?? pm?.settings?.reminder_timezone ?? (meta?.reminder_timezone ?? 'UTC'),
    reminder_popup_dismissed: (prof as any)?.reminder_popup_dismissed ?? pm?.settings?.reminder_popup_dismissed ?? false,
    wearable_info_dismissed: (prof as any)?.wearable_info_dismissed ?? pm?.settings?.wearable_info_dismissed ?? false,
    wearable_prompt_dismissed: (prof as any)?.wearable_prompt_dismissed ?? pm?.settings?.wearable_prompt_dismissed ?? false,
    welcome_back_banner_dismissed: (prof as any)?.welcome_back_banner_dismissed ?? pm?.settings?.welcome_back_banner_dismissed ?? false,
    welcome_back_banner_dismissed_at: (prof as any)?.welcome_back_banner_dismissed_at ?? pm?.settings?.welcome_back_banner_dismissed_at ?? null,
    commitment_message_shown: (prof as any)?.commitment_message_shown ?? pm?.settings?.commitment_message_shown ?? false,
  }

  // Only overwrite keys explicitly provided.
  const nextPrefs: Prefs = {
    reminder_enabled: has('reminder_enabled') ? Boolean(body.reminder_enabled) : existing.reminder_enabled,
    reminder_time: has('reminder_time') ? String(body.reminder_time || existing.reminder_time || '06:00') : existing.reminder_time,
    reminder_timezone: has('reminder_timezone') ? (body.reminder_timezone ? String(body.reminder_timezone) : null) : existing.reminder_timezone,
    reminder_timezone_autodetected: has('reminder_timezone_autodetected') ? Boolean(body.reminder_timezone_autodetected) : undefined,
    reminder_popup_dismissed: has('reminder_popup_dismissed') ? Boolean(body.reminder_popup_dismissed) : undefined,
    wearable_info_dismissed: has('wearable_info_dismissed') ? Boolean(body.wearable_info_dismissed) : undefined,
    wearable_prompt_dismissed: has('wearable_prompt_dismissed') ? Boolean(body.wearable_prompt_dismissed) : undefined,
    welcome_back_banner_dismissed: has('welcome_back_banner_dismissed') ? Boolean(body.welcome_back_banner_dismissed) : undefined,
    welcome_back_banner_dismissed_at: has('welcome_back_banner_dismissed_at') ? (body.welcome_back_banner_dismissed_at ? String(body.welcome_back_banner_dismissed_at) : null) : undefined,
    commitment_message_shown: has('commitment_message_shown') ? Boolean(body.commitment_message_shown) : undefined,
  }
  try {
    // If timezone is autodetected, do not overwrite an existing reminder_timezone (user may have set manually).
    let tzToWrite: string | null = nextPrefs.reminder_timezone
    try {
      if (has('reminder_timezone') && nextPrefs.reminder_enabled && nextPrefs.reminder_timezone_autodetected) {
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
    const profileUpdate: Record<string, any> = {
      ...(has('reminder_enabled') ? { reminder_enabled: nextPrefs.reminder_enabled as any } : {}),
      ...(has('reminder_time') ? { reminder_time: nextPrefs.reminder_time as any } : {}),
      ...(has('reminder_timezone') ? { reminder_timezone: tzToWrite as any } : {}),
      ...(nextPrefs.reminder_popup_dismissed != null ? { reminder_popup_dismissed: nextPrefs.reminder_popup_dismissed as any } : {}),
      ...(nextPrefs.wearable_info_dismissed != null ? { wearable_info_dismissed: nextPrefs.wearable_info_dismissed as any } : {}),
      ...(nextPrefs.wearable_prompt_dismissed != null ? { wearable_prompt_dismissed: nextPrefs.wearable_prompt_dismissed as any } : {}),
      ...(nextPrefs.welcome_back_banner_dismissed != null ? { welcome_back_banner_dismissed: nextPrefs.welcome_back_banner_dismissed as any } : {}),
      ...(nextPrefs.welcome_back_banner_dismissed_at !== undefined ? { welcome_back_banner_dismissed_at: nextPrefs.welcome_back_banner_dismissed_at as any } : {}),
      ...(nextPrefs.commitment_message_shown != null ? { commitment_message_shown: nextPrefs.commitment_message_shown as any } : {}),
    }
    const { error: upErr } = await sbAny
      .from('profiles')
      .update({
        ...profileUpdate,
      })
      .eq('user_id', user.id)
    if (!upErr) {
      // Also mirror into auth user metadata so reminders can be read from auth
      try {
        if (has('reminder_enabled') || has('reminder_time') || has('reminder_timezone')) {
          await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any })
        }
      } catch {}
      return NextResponse.json({ ok: true, saved: { ...existing, ...nextPrefs, reminder_timezone: tzToWrite } })
    }

    // Second attempt: admin fallback (RLS-safe) so the UI can't "pretend save" while the DB stays false.
    try {
      const { error: adminErr } = await (supabaseAdmin as any)
        .from('profiles')
        .update({
          ...profileUpdate,
        })
        .eq('user_id', user.id)
      if (!adminErr) {
        try {
          if (has('reminder_enabled') || has('reminder_time') || has('reminder_timezone')) {
            await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any })
          }
        } catch {}
        return NextResponse.json({ ok: true, saved: { ...existing, ...nextPrefs, reminder_timezone: tzToWrite } })
      }
    } catch {}

    // Fallback: persist into public_modules.settings
    const updatedSettings = { ...(pm?.settings || {}) } as any
    if (has('reminder_enabled')) updatedSettings.reminder_enabled = nextPrefs.reminder_enabled
    if (has('reminder_time')) updatedSettings.reminder_time = nextPrefs.reminder_time
    if (has('reminder_timezone')) updatedSettings.reminder_timezone = tzToWrite
    if (nextPrefs.reminder_popup_dismissed != null) (updatedSettings as any).reminder_popup_dismissed = nextPrefs.reminder_popup_dismissed
    if (nextPrefs.wearable_info_dismissed != null) (updatedSettings as any).wearable_info_dismissed = nextPrefs.wearable_info_dismissed
    if (nextPrefs.wearable_prompt_dismissed != null) (updatedSettings as any).wearable_prompt_dismissed = nextPrefs.wearable_prompt_dismissed
    if (nextPrefs.welcome_back_banner_dismissed != null) (updatedSettings as any).welcome_back_banner_dismissed = nextPrefs.welcome_back_banner_dismissed
    if (nextPrefs.welcome_back_banner_dismissed_at !== undefined) (updatedSettings as any).welcome_back_banner_dismissed_at = nextPrefs.welcome_back_banner_dismissed_at
    if (nextPrefs.commitment_message_shown != null) (updatedSettings as any).commitment_message_shown = nextPrefs.commitment_message_shown
    const updated = { ...(pm || {}), settings: updatedSettings }
    const { error: jsonErr } = await sbAny
      .from('profiles')
      .update({ public_modules: updated as any })
      .eq('user_id', user.id)
    if (jsonErr) return NextResponse.json({ error: jsonErr.message }, { status: 500 })
    try {
      if (has('reminder_enabled') || has('reminder_time') || has('reminder_timezone')) {
        await supabase.auth.updateUser({ data: { reminder_enabled: nextPrefs.reminder_enabled, reminder_time: nextPrefs.reminder_time, reminder_timezone: tzToWrite } as any })
      }
    } catch {}
    return NextResponse.json({ ok: true, saved: { ...existing, ...nextPrefs, reminder_timezone: tzToWrite } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}


