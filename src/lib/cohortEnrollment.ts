import { supabaseAdmin } from '@/lib/supabase/admin'
import { cohortParticipantUserIdCandidatesForProfile } from '@/lib/cohortParticipantUserId'

export type CohortParticipantUpsertResult =
  | { ok: true }
  | { ok: false; error: string; code?: 'COHORT_FULL' }

/** `profileId` = public.profiles.id; `cohortSlug` = public.cohorts.slug (same as profiles.cohort_id text). */
export async function ensureCohortStudyStackItem(profileId: string, cohortSlug: string) {
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
    if (insErr) {
      if (insErr.code === '23505') return
      console.error('[cohortEnrollment] stack_items insert:', insErr)
    }
  } catch (e) {
    console.error('[cohortEnrollment] ensureCohortStudyStackItem:', e)
  }
}

export async function upsertCohortParticipant(
  profileId: string,
  cohortSlug: string | null,
  qualificationResponse?: string | null
): Promise<CohortParticipantUpsertResult> {
  const slug = cohortSlug != null ? String(cohortSlug).trim().toLowerCase() : ''
  if (!profileId) {
    return { ok: false, error: 'Missing profile id' }
  }
  if (!slug) {
    return { ok: false, error: 'Missing cohort slug' }
  }
  const qRaw = qualificationResponse != null ? String(qualificationResponse).trim() : ''
  const qualificationStored = qRaw !== '' ? qRaw : null
  try {
    const { data: cohortRow, error: cohortErr } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (cohortErr) {
      console.error('[cohortEnrollment] cohort lookup:', cohortErr)
      return { ok: false, error: cohortErr.message || 'Cohort lookup failed' }
    }
    if (!cohortRow?.id) {
      console.warn('[cohortEnrollment] cohort slug not found:', slug)
      return { ok: false, error: `Cohort not found for slug: ${slug}` }
    }
    const cohortId = String((cohortRow as { id: string }).id)
    const enrolledAt = new Date().toISOString()
    const candidates = await cohortParticipantUserIdCandidatesForProfile(profileId)
    if (candidates.length === 0) {
      return { ok: false, error: 'Could not resolve profile for cohort enrollment' }
    }

    const basePayload = {
      cohort_id: cohortId,
      status: 'applied' as const,
      enrolled_at: enrolledAt,
      currently_taking_product: false,
      qualification_response: qualificationStored,
    }

    let conflicted = false
    let lastFkMessage: string | null = null

    for (const uid of candidates) {
      const { error: insErr } = await supabaseAdmin
        .from('cohort_participants')
        .insert({ ...basePayload, user_id: uid })
      if (!insErr) return { ok: true }
      if (
        insErr.code === '23514' ||
        (insErr.message && insErr.message.includes('COHORT_FULL')) ||
        (typeof insErr.details === 'string' && insErr.details.includes('COHORT_FULL'))
      ) {
        return {
          ok: false,
          error: 'This study has reached enrollment capacity.',
          code: 'COHORT_FULL',
        }
      }
      if (insErr.code === '23505') {
        conflicted = true
        break
      }
      if (insErr.code === '23503') {
        lastFkMessage = insErr.message
        continue
      }
      console.error('[cohortEnrollment] cohort_participants insert:', insErr)
      return { ok: false, error: insErr.message || 'Could not create cohort participant' }
    }

    const updatePatch: Record<string, unknown> = {
      currently_taking_product: false,
      qualification_response: qualificationStored,
    }
    if (conflicted) {
      for (const uid of candidates) {
        const { error: upErr } = await supabaseAdmin
          .from('cohort_participants')
          .update(updatePatch as Record<string, unknown>)
          .eq('user_id', uid)
          .eq('cohort_id', cohortId)
        if (!upErr) return { ok: true }
      }
      console.error('[cohortEnrollment] cohort_participants update: no row matched candidates')
      return { ok: false, error: 'Could not update cohort participant' }
    }

    if (lastFkMessage) {
      console.error('[cohortEnrollment] cohort_participants insert:', lastFkMessage)
      return { ok: false, error: lastFkMessage || 'Could not create cohort participant' }
    }
    return { ok: false, error: 'Could not create cohort participant' }
  } catch (e) {
    console.error('[cohortEnrollment] upsertCohortParticipant:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Cohort enrollment failed' }
  }
}

/**
 * After study completion + Pro: remove the cohort-only stack row (and soft-disable matching
 * user_supplement) so main BioStackr is not pre-filled with the study product; set handoff day
 * so `/api/progress/loop` does not show "checked in today" from the last cohort check-in.
 */
export async function runCohortMainProductHandoffCleanup(params: {
  profileId: string
  userId: string
  cohortSlug: string
  productName: string
  clientTodayYmd: string
}): Promise<void> {
  const profileId = String(params.profileId || '').trim()
  const userId = String(params.userId || '').trim()
  const slug = String(params.cohortSlug || '').trim().toLowerCase()
  let productName = String(params.productName || '').trim()
  const clientYmd = String(params.clientTodayYmd || '').trim()
  if (!profileId || !userId || !slug || !clientYmd || !/^\d{4}-\d{2}-\d{2}$/.test(clientYmd)) {
    return
  }
  try {
    if (!productName) {
      const { data: cohort } = await supabaseAdmin
        .from('cohorts')
        .select('product_name')
        .eq('slug', slug)
        .maybeSingle()
      productName = String((cohort as { product_name?: string } | null)?.product_name || '').trim()
    }
    if (!productName) return

    const nameKey = productName.toLowerCase()

    const { data: stacks } = await supabaseAdmin
      .from('stack_items')
      .select('id,name,user_supplement_id')
      .eq('profile_id', profileId)
    for (const row of stacks || []) {
      const n = String((row as { name?: string }).name || '').trim().toLowerCase()
      if (n !== nameKey) continue
      const sid = (row as { id?: string }).id
      if (sid) {
        await supabaseAdmin.from('stack_items').delete().eq('id', sid)
      }
    }

    const { data: supps } = await supabaseAdmin
      .from('user_supplement')
      .select('id,name')
      .eq('user_id', userId)
    for (const row of supps || []) {
      const n = String((row as { name?: string }).name || '').trim().toLowerCase()
      if (n !== nameKey) continue
      const id = (row as { id?: string }).id
      if (id) {
        await supabaseAdmin
          .from('user_supplement')
          .update({ is_active: false } as Record<string, unknown>)
          .eq('id', id)
      }
    }

    await supabaseAdmin
      .from('profiles')
      .update({
        cohort_study_stack_cleaned_at: new Date().toISOString(),
        cohort_handoff_checkin_ignore_local_date: clientYmd,
      } as Record<string, unknown>)
      .eq('id', profileId)
  } catch (e) {
    console.error('[cohortEnrollment] runCohortMainProductHandoffCleanup:', e)
  }
}
