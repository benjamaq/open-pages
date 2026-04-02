import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { ensureCohortStudyStackItem, upsertCohortParticipant } from '@/lib/cohortEnrollment'
import {
  extractQualificationFreeText,
  validateQualificationFreeText,
  QUALIFICATION_FREETEXT_PRIMARY_ERROR,
} from '@/lib/qualificationFreeText'

/**
 * Creates/updates `cohort_participants` via service role after the profile row exists.
 * `user_id` must match the FK (repo: public.profiles.id; some DBs: auth.users.id) — resolved in upsertCohortParticipant.
 */
async function enrollProfileInCohort(
  profileId: string,
  cohortSlug: string,
  qualificationResponse: string | null,
): Promise<{ ok: true } | { ok: false; error: string; code?: 'COHORT_FULL' }> {
  const r = await upsertCohortParticipant(profileId, cohortSlug, qualificationResponse)
  if (!r.ok) return r
  await ensureCohortStudyStackItem(profileId, cohortSlug)
  return { ok: true }
}

function jsonEnrollmentError(enr: { ok: false; error: string; code?: string }) {
  const status = enr.code === 'COHORT_FULL' ? 409 : 500
  return NextResponse.json({ error: enr.error, code: enr.code }, { status })
}

async function sendCohortEnrollmentEmail(to: string) {
  const safe = String(to || '').trim()
  if (!safe) return
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.biostackr.com').replace(/\/$/, '')
  await sendEmail({
    to: safe,
    subject: 'Your study place is reserved: first two check-ins within 48 hours',
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.6;color:#1a1a1a;padding:24px;max-width:560px;">
<p>Your place is reserved for 48 hours.</p>
<p>Complete your first two check-ins to secure your spot and trigger product shipment.</p>
<p><a href="${appBase}/dashboard?checkin=1" style="color:#C84B2F;font-weight:600;">Open dashboard</a></p>
</body></html>`,
  })
}

function reminderSlotToTime(slot: string): string {
  const s = String(slot || '').toLowerCase()
  if (s === 'midday') return '12:00'
  if (s === 'evening') return '19:00'
  return '08:00'
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
    const cohort_id = (() => {
      const c = body?.cohort_id
      if (c == null) return null
      const s = String(c).trim().toLowerCase()
      return s !== '' ? s : null
    })()
    const qualification_response =
      typeof body?.qualification_response === 'string' ? body.qualification_response.trim() : null

    if (cohort_id != null && qualification_response) {
      const free = extractQualificationFreeText(qualification_response)
      if (!validateQualificationFreeText(free).ok) {
        return NextResponse.json({ error: QUALIFICATION_FREETEXT_PRIMARY_ERROR }, { status: 400 })
      }
    }
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
    // Cohort enrollment runs before setting profiles.cohort_id so a full cohort does not leave a misleading profile row.
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

          if (cohort_id != null) {
            const enr = await enrollProfileInCohort(
              String((existing as any).id),
              cohort_id,
              qualification_response,
            )
            if (!enr.ok) return jsonEnrollmentError(enr)
            if (email) {
              try {
                await sendCohortEnrollmentEmail(email)
              } catch (mailErr) {
                console.error('[api/profiles] cohort welcome email failed:', mailErr)
              }
            }
          }

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
          const shouldPatchProfile =
            needsBackfill ||
            cohort_id != null ||
            reminderFromSlot != null ||
            Object.keys(shippingPatch).length > 0
          console.log('[api/profiles] existing profile - updatePayload:', updatePayload, 'shouldPatch:', shouldPatchProfile)
          if (shouldPatchProfile) {
            const { error: updErr } = await supabaseAdmin.from('profiles').update(updatePayload as any).eq('user_id', user_id)
            if (updErr) {
              console.error('[api/profiles] update error:', updErr)
              return NextResponse.json({ error: updErr.message || 'Could not update profile' }, { status: 500 })
            }
          }
        } catch (inner: unknown) {
          console.error('[api/profiles] existing profile branch:', inner)
          return NextResponse.json(
            { error: inner instanceof Error ? inner.message : 'Profile update failed' },
            { status: 500 },
          )
        }
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
        if (cohort_id != null) {
          if (!existing?.id) {
            return NextResponse.json({ error: 'Profile not found after signup; cannot set cohort' }, { status: 500 })
          }
          const enr = await enrollProfileInCohort(
            String((existing as any).id),
            cohort_id,
            qualification_response,
          )
          if (!enr.ok) return jsonEnrollmentError(enr)
          const raceUpd: Record<string, unknown> = { cohort_id, updated_at: new Date().toISOString() }
          if (reminderFromSlot != null) raceUpd.reminder_time = reminderFromSlot
          if (Object.keys(shippingPatch).length > 0) Object.assign(raceUpd, shippingPatch)
          const { error: raceUpdErr } = await supabaseAdmin
            .from('profiles')
            .update(raceUpd as any)
            .eq('user_id', user_id)
          if (raceUpdErr) {
            console.error('[api/profiles] race cohort update:', raceUpdErr)
            return NextResponse.json({ error: raceUpdErr.message || 'Could not set cohort on profile' }, { status: 500 })
          }
          if (email) {
            try {
              await sendCohortEnrollmentEmail(email)
            } catch (mailErr) {
              console.error('[api/profiles] cohort welcome email failed:', mailErr)
            }
          }
        }
        return NextResponse.json({ ok: true, id: existing?.id, slug: (existing as any)?.slug })
      }
      console.error('[api/profiles] insert error:', error.code, error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (cohort_id != null && data?.id) {
      const enr = await enrollProfileInCohort(String(data.id), cohort_id, qualification_response)
      if (!enr.ok) return jsonEnrollmentError(enr)
      const { error: setCohortErr } = await supabaseAdmin
        .from('profiles')
        .update({ cohort_id, updated_at: new Date().toISOString() } as any)
        .eq('id', data.id)
      if (setCohortErr) {
        console.error('[api/profiles] set cohort_id after enroll:', setCohortErr)
        return NextResponse.json({ error: setCohortErr.message || 'Could not attach cohort to profile' }, { status: 500 })
      }
      if (email) {
        try {
          await sendCohortEnrollmentEmail(email)
        } catch (mailErr) {
          console.error('[api/profiles] cohort welcome email failed:', mailErr)
        }
      }
    }

    return NextResponse.json({ ok: true, id: data?.id, slug: (data as any)?.slug })
  } catch (e: any) {
    console.error('[api/profiles] unexpected error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Failed to create profile' }, { status: 500 })
  }
}
