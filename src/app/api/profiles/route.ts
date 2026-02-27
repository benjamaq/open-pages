import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

function toSlugBase(input: string) {
  const base = (input || '').trim().toLowerCase()
  const cleaned = base
    .replace(/@.*$/, '') // strip domain if email
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'user'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const user_id = String(body?.user_id || '').trim()
    const name = String(body?.name || '').trim()
    const email = typeof body?.email === 'string' ? body.email : ''
    const tz = (() => {
      const raw = String(body?.timezone || '').trim()
      return raw || 'UTC'
    })()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // If profile already exists, do not create a duplicate.
    // But backfill reminder defaults if legacy/trigger-created rows are missing them.
    try {
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id, slug, reminder_enabled, reminder_time, reminder_timezone, reminder_timezone_autodetected, timezone')
        .eq('user_id', user_id)
        .maybeSingle()
      if (existing) {
        try {
          const reminderEnabled = (existing as any)?.reminder_enabled
          // Only backfill when the column is missing/NULL (do not override explicit user choice).
          const needsBackfill = reminderEnabled == null
          if (needsBackfill) {
            const tzToWrite = (existing as any)?.reminder_timezone || (existing as any)?.timezone || tz || 'UTC'
            await supabaseAdmin
              .from('profiles')
              .update({
                reminder_enabled: true,
                reminder_time: (existing as any)?.reminder_time || '09:00',
                reminder_timezone: (existing as any)?.reminder_timezone || tzToWrite,
                reminder_timezone_autodetected: true,
                timezone: (existing as any)?.timezone || tzToWrite,
                updated_at: new Date().toISOString(),
              } as any)
              .eq('user_id', user_id)
          }
        } catch {}
        return NextResponse.json({ ok: true, id: existing.id, slug: (existing as any).slug })
      }
    } catch {}

    // Generate a unique slug
    const base = toSlugBase(name || email)
    let candidate = base
    // ensure uniqueness with up to 5 attempts
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!clash) break
      // append short suffix
      const suffix = Math.random().toString(36).slice(2, 7)
      candidate = `${base}-${suffix}`
    }

    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id,
        // NOTE: production `profiles` does not have a `first_name` column.
        display_name: name || (email ? email.split('@')[0] : 'User'),
        slug: candidate,
        public: true,
        allow_stack_follow: true,
        // Daily email reminders ON by default for new users (user can disable in Settings).
        reminder_enabled: true,
        reminder_time: '09:00',
        reminder_timezone: tz,
        reminder_timezone_autodetected: true,
        // Used by daily email cron for local-time windowing.
        timezone: tz,
        created_at: now,
        updated_at: now
      })
      .select('id, slug')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id, slug: (data as any)?.slug })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 })
  }
}


