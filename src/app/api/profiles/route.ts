import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

async function sendCohortEnrollmentEmail(to: string) {
  const safe = String(to || '').trim()
  if (!safe) return
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
  await sendEmail({
    to: safe,
    subject: "You're in — complete your first check-in now",
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>You're in — complete your first check-in now to secure your spot.</p>
<p><a href="${appBase}/dashboard" style="color:#6A3F2B;font-weight:600;">Open your dashboard</a></p>
</body></html>`,
  })
}

/** `profileId` = public.profiles.id; `cohortSlug` = public.cohorts.slug (same as profiles.cohort_id text). */
async function tryInsertCohortParticipant(profileId: string, cohortSlug: string | null) {
  const slug = cohortSlug != null ? String(cohortSlug).trim() : ''
  if (!slug || !profileId) return
  try {
    const { data: cohortRow, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (cohortErr) {
      console.error('[api/profiles] cohort lookup for participant:', cohortErr)
      return
    }
    if (!cohortRow?.id) {
      console.warn('[api/profiles] cohort slug not found for cohort_participants:', slug)
      return
    }
    const { error: insErr } = await supabaseAdmin.from('cohort_participants').insert({
      user_id: profileId,
      cohort_id: cohortRow.id,
      status: 'applied',
      enrolled_at: new Date().toISOString(),
    } as any)
    if (insErr?.code === '23505') return
    if (insErr) console.error('[api/profiles] cohort_participants insert:', insErr)
  } catch (e) {
    console.error('[api/profiles] tryInsertCohortParticipant:', e)
  }
}

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
    const cohort_id = typeof body?.cohort_id === 'string' ? body.cohort_id.trim() || null : null
    console.log('[api/profiles] request body:', { user_id, cohort_id, hasCohortInBody: 'cohort_id' in (body || {}) })
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
          const needsBackfill = reminderEnabled == null
          const tzToWrite = (existing as any)?.reminder_timezone || (existing as any)?.timezone || tz || 'UTC'
          const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          }
          if (needsBackfill) {
            updatePayload.reminder_enabled = true
            updatePayload.reminder_time = (existing as any)?.reminder_time || '09:00'
            updatePayload.reminder_timezone = (existing as any)?.reminder_timezone || tzToWrite
            updatePayload.reminder_timezone_autodetected = true
            updatePayload.timezone = (existing as any)?.timezone || tzToWrite
          }
          if (cohort_id != null) {
            updatePayload.cohort_id = cohort_id
          }
          console.log('[api/profiles] existing profile - updatePayload:', updatePayload)
          if (Object.keys(updatePayload).length > 1) {
            const { error: updErr } = await supabaseAdmin.from('profiles').update(updatePayload as any).eq('user_id', user_id)
            if (updErr) {
              console.error('[api/profiles] update error:', updErr)
            } else {
              if (cohort_id != null && email) {
                try {
                  await sendCohortEnrollmentEmail(email)
                } catch (mailErr) {
                  console.error('[api/profiles] cohort welcome email failed:', mailErr)
                }
              }
              if (cohort_id != null) {
                await tryInsertCohortParticipant(String((existing as any).id), cohort_id)
              }
            }
          }
        } catch {}
        return NextResponse.json({ ok: true, id: existing.id, slug: (existing as any).slug })
      }
    } catch (existingErr) {
      console.warn('[api/profiles] existing check failed:', (existingErr as Error)?.message)
    }

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

    const insertPayload: Record<string, unknown> = {
      user_id,
      display_name: name || (email ? email.split('@')[0] : 'User'),
      slug: candidate,
      public: true,
      allow_stack_follow: true,
      reminder_enabled: true,
      reminder_time: '09:00',
      reminder_timezone: tz,
      reminder_timezone_autodetected: true,
      timezone: tz,
      created_at: now,
      updated_at: now
    }
    if (cohort_id != null) {
      insertPayload.cohort_id = cohort_id
    }
    console.log('[api/profiles] insert payload:', insertPayload)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(insertPayload as any)
      .select('id, slug')
      .single()

    if (error) {
      // Profile may already exist from auth trigger — treat as success
      if (error.code === '23505') {
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('id, slug')
          .eq('user_id', user_id)
          .maybeSingle()
        if (cohort_id != null && existing) {
          const { error: raceUpdErr } = await supabaseAdmin
            .from('profiles')
            .update({ cohort_id, updated_at: new Date().toISOString() } as any)
            .eq('user_id', user_id)
          if (!raceUpdErr) {
            if (email) {
              try {
                await sendCohortEnrollmentEmail(email)
              } catch (mailErr) {
                console.error('[api/profiles] cohort welcome email failed:', mailErr)
              }
            }
            await tryInsertCohortParticipant(String((existing as any).id), cohort_id)
          }
        }
        return NextResponse.json({ ok: true, id: existing?.id, slug: (existing as any)?.slug })
      }
      console.error('[api/profiles] insert error:', error.code, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (cohort_id != null && email) {
      try {
        await sendCohortEnrollmentEmail(email)
      } catch (mailErr) {
        console.error('[api/profiles] cohort welcome email failed:', mailErr)
      }
    }
    if (cohort_id != null && data?.id) {
      await tryInsertCohortParticipant(String(data.id), cohort_id)
    }

    return NextResponse.json({ ok: true, id: data?.id, slug: (data as any)?.slug })
  } catch (e: any) {
    console.error('[api/profiles] unexpected error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 })
  }
}


