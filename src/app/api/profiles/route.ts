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
<p><a href="${appBase}/dashboard?checkin=1" style="color:#6A3F2B;font-weight:600;">Open check-in</a></p>
</body></html>`,
  })
}

function reminderSlotToTime(slot: string): string {
  const s = String(slot || '').toLowerCase()
  if (s === 'midday') return '12:00'
  if (s === 'evening') return '19:00'
  return '08:00'
}

async function ensureCohortStudyStackItem(profileId: string, cohortSlug: string) {
  const slug = String(cohortSlug || '').trim().toLowerCase()
  if (!slug || !profileId) return
  try {
    const { data: cohort, error: cErr } = await supabaseAdmin
      .from('cohorts')
      .select('product_name')
      .eq('slug', slug)
      .maybeSingle()
    if (cErr || !cohort) return
    const productName = String((cohort as { product_name?: string }).product_name || '').trim()
    if (!productName) return

    const { data: rows } = await supabaseAdmin
      .from('stack_items')
      .select('id,name')
      .eq('profile_id', profileId)
    const lower = productName.toLowerCase()
    const has = (rows || []).some((r: { name?: string }) => String(r?.name || '').trim().toLowerCase() === lower)
    if (has) return

    const { error: insErr } = await supabaseAdmin.from('stack_items').insert({
      profile_id: profileId,
      name: productName,
      item_type: 'supplement',
      frequency: 'daily',
      schedule_days: [0, 1, 2, 3, 4, 5, 6],
      created_at: new Date().toISOString(),
    } as any)
    if (insErr) console.error('[api/profiles] cohort stack_items insert:', insErr)
  } catch (e) {
    console.error('[api/profiles] ensureCohortStudyStackItem:', e)
  }
}

/** `profileId` = public.profiles.id; `cohortSlug` = public.cohorts.slug (same as profiles.cohort_id text). */
async function upsertCohortParticipant(
  profileId: string,
  cohortSlug: string | null,
  qualificationResponse?: string | null
) {
  const slug = cohortSlug != null ? String(cohortSlug).trim() : ''
  if (!slug || !profileId) return
  const q =
    qualificationResponse != null && String(qualificationResponse).trim() !== ''
      ? String(qualificationResponse).trim()
      : null
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
    const cohortId = String((cohortRow as { id: string }).id)
    const payload = {
      user_id: profileId,
      cohort_id: cohortId,
      status: 'applied',
      enrolled_at: new Date().toISOString(),
      ...(q != null ? { qualification_response: q } : {}),
    }
    const { error: insErr } = await supabaseAdmin.from('cohort_participants').insert(payload as any)
    if (!insErr) return
    if (insErr.code === '23505') {
      if (q != null) {
        const { error: upErr } = await supabaseAdmin
          .from('cohort_participants')
          .update({ qualification_response: q } as any)
          .eq('user_id', profileId)
          .eq('cohort_id', cohortId)
        if (upErr) console.error('[api/profiles] cohort_participants qualification update:', upErr)
      }
      return
    }
    console.error('[api/profiles] cohort_participants insert:', insErr)
  } catch (e) {
    console.error('[api/profiles] upsertCohortParticipant:', e)
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

function trimOpt(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  return s !== '' ? s : null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const user_id = String(body?.user_id || '').trim()
    const name = String(body?.name || '').trim()
    const email = typeof body?.email === 'string' ? body.email : ''
    const cohort_id = typeof body?.cohort_id === 'string' ? body.cohort_id.trim() || null : null
    const qualification_response =
      typeof body?.qualification_response === 'string' ? body.qualification_response.trim() : null
    const reminder_slot = String(body?.reminder_slot || '').toLowerCase()
    const reminderFromSlot = ['morning', 'midday', 'evening'].includes(reminder_slot)
      ? reminderSlotToTime(reminder_slot)
      : null

    const shippingPatch: Record<string, string> = {}
    const s1 = trimOpt(body?.shipping_address_line1)
    const s2 = trimOpt(body?.shipping_address_line2)
    const city = trimOpt(body?.shipping_city)
    const region = trimOpt(body?.shipping_region)
    const postal = trimOpt(body?.shipping_postal_code)
    const country = trimOpt(body?.shipping_country)
    if (s1) shippingPatch.shipping_address_line1 = s1
    if (s2) shippingPatch.shipping_address_line2 = s2
    if (city) shippingPatch.shipping_city = city
    if (region) shippingPatch.shipping_region = region
    if (postal) shippingPatch.shipping_postal_code = postal
    if (country) shippingPatch.shipping_country = country

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
            updatePayload.reminder_time = reminderFromSlot || (existing as any)?.reminder_time || '09:00'
            updatePayload.reminder_timezone = (existing as any)?.reminder_timezone || tzToWrite
            updatePayload.reminder_timezone_autodetected = true
            updatePayload.timezone = (existing as any)?.timezone || tzToWrite
          }
          if (cohort_id != null) {
            updatePayload.cohort_id = cohort_id
          }
          if (reminderFromSlot != null) {
            updatePayload.reminder_time = reminderFromSlot
          }
          if (Object.keys(shippingPatch).length > 0) {
            Object.assign(updatePayload, shippingPatch)
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
                await upsertCohortParticipant(String((existing as any).id), cohort_id, qualification_response)
                await ensureCohortStudyStackItem(String((existing as any).id), cohort_id)
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
      reminder_time: reminderFromSlot || '09:00',
      reminder_timezone: tz,
      reminder_timezone_autodetected: true,
      timezone: tz,
      created_at: now,
      updated_at: now,
    }
    if (cohort_id != null) {
      insertPayload.cohort_id = cohort_id
    }
    if (Object.keys(shippingPatch).length > 0) {
      Object.assign(insertPayload, shippingPatch)
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
          const raceUpd: Record<string, unknown> = { cohort_id, updated_at: new Date().toISOString() }
          if (reminderFromSlot != null) raceUpd.reminder_time = reminderFromSlot
          if (Object.keys(shippingPatch).length > 0) Object.assign(raceUpd, shippingPatch)
          const { error: raceUpdErr } = await supabaseAdmin
            .from('profiles')
            .update(raceUpd as any)
            .eq('user_id', user_id)
          if (!raceUpdErr) {
            if (email) {
              try {
                await sendCohortEnrollmentEmail(email)
              } catch (mailErr) {
                console.error('[api/profiles] cohort welcome email failed:', mailErr)
              }
            }
            await upsertCohortParticipant(String((existing as any).id), cohort_id, qualification_response)
            await ensureCohortStudyStackItem(String((existing as any).id), cohort_id)
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
      await upsertCohortParticipant(String(data.id), cohort_id, qualification_response)
      await ensureCohortStudyStackItem(String(data.id), cohort_id)
    }

    return NextResponse.json({ ok: true, id: data?.id, slug: (data as any)?.slug })
  } catch (e: any) {
    console.error('[api/profiles] unexpected error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 })
  }
}
