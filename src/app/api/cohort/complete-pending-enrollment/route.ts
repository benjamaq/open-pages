import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ensureCohortStudyStackItem, upsertCohortParticipant } from '@/lib/cohortEnrollment'
import { sendCohortEnrollmentEmail } from '@/lib/cohortEnrollmentEmail'

export const dynamic = 'force-dynamic'

/**
 * Authenticated user: apply `bs_cohort` cookie (or body.cohort_slug) — set profiles.cohort_id,
 * upsert cohort_participants + study stack item. Used when an existing account signs in to join a study.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()
    if (authErr || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let slug: string | null = null
    try {
      const j = await req.json().catch(() => ({}))
      if (typeof (j as { cohort_slug?: string })?.cohort_slug === 'string') {
        const s = String((j as { cohort_slug: string }).cohort_slug).trim().toLowerCase()
        if (s) slug = s
      }
    } catch {
      slug = null
    }
    if (!slug) {
      const raw = req.cookies.get('bs_cohort')?.value
      slug = raw ? decodeURIComponent(raw).trim().toLowerCase() : null
    }
    if (!slug) {
      return NextResponse.json({ error: 'No cohort context' }, { status: 400 })
    }

    const { data: cohortGate } = await supabaseAdmin
      .from('cohorts')
      .select('status')
      .eq('slug', slug)
      .maybeSingle()
    const gateSt = String((cohortGate as { status?: string | null } | null)?.status || '')
      .trim()
      .toLowerCase()
    if (gateSt !== 'active') {
      return NextResponse.json(
        { error: 'This study is not open for enrollment.', code: 'COHORT_INACTIVE' },
        { status: 403 },
      )
    }

    const { data: prof, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, cohort_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (pErr || !prof?.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }
    const profileId = String(prof.id)
    const priorCohort =
      (prof as { cohort_id?: string | null }).cohort_id != null
        ? String((prof as { cohort_id: string }).cohort_id).trim()
        : ''
    const firstCohortAttach = priorCohort === ''

    const { error: uErr } = await supabaseAdmin
      .from('profiles')
      .update({ cohort_id: slug, updated_at: new Date().toISOString() } as { cohort_id: string; updated_at: string })
      .eq('user_id', user.id)
    if (uErr) {
      return NextResponse.json({ error: uErr.message }, { status: 500 })
    }

    const enroll = await upsertCohortParticipant(profileId, slug, null)
    if (!enroll.ok) {
      const status =
        enroll.code === 'COHORT_FULL' ? 409 : enroll.code === 'COHORT_INACTIVE' ? 403 : 500
      return NextResponse.json({ error: enroll.error, code: enroll.code }, { status })
    }
    await ensureCohortStudyStackItem(profileId, slug)

    if (firstCohortAttach) {
      const em = String(user.email || '').trim()
      if (em) {
        try {
          await sendCohortEnrollmentEmail({ to: em, authUserId: user.id, cohortSlug: slug })
        } catch (mailErr) {
          console.error('[complete-pending-enrollment] cohort enrollment email failed:', mailErr)
        }
      }
    }

    return NextResponse.json({ ok: true, cohort_slug: slug })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
