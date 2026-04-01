import { supabaseAdmin } from '@/lib/supabase/admin'

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
    const payload: Record<string, unknown> = {
      user_id: profileId,
      cohort_id: cohortId,
      status: 'applied',
      enrolled_at: enrolledAt,
      currently_taking_product: false,
      qualification_response: qualificationStored,
    }
    const { error: insErr } = await supabaseAdmin.from('cohort_participants').insert(payload)
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
      const updatePatch: Record<string, unknown> = {
        currently_taking_product: false,
        qualification_response: qualificationStored,
      }
      const { error: upErr } = await supabaseAdmin
        .from('cohort_participants')
        .update(updatePatch as Record<string, unknown>)
        .eq('user_id', profileId)
        .eq('cohort_id', cohortId)
      if (upErr) {
        console.error('[cohortEnrollment] cohort_participants update:', upErr)
        return { ok: false, error: upErr.message || 'Could not update cohort participant' }
      }
      return { ok: true }
    }
    console.error('[cohortEnrollment] cohort_participants insert:', insErr)
    return { ok: false, error: insErr.message || 'Could not create cohort participant' }
  } catch (e) {
    console.error('[cohortEnrollment] upsertCohortParticipant:', e)
    return { ok: false, error: e instanceof Error ? e.message : 'Cohort enrollment failed' }
  }
}
