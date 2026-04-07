import { supabaseAdmin } from '@/lib/supabase/admin'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'
import { pickPrimaryProfileIdByStackCount } from '@/lib/cohortEnrollment'

export type CohortParticipantResultProReward = {
  has_row: boolean
  claimed: boolean
  claim_token: string | null
}

/** JSON shape returned by GET /api/cohort/participant-result and passed from SSR. */
export type CohortParticipantResultApiPayload = {
  result_json: unknown
  result_version: number
  published_at: string
  product_name: string | null
  brand_name: string | null
  pro_reward: CohortParticipantResultProReward
}

export type BuildCohortParticipantResultOutcome =
  | { ok: true; payload: CohortParticipantResultApiPayload }
  | { ok: false; reason: 'no_published_result' | 'participant_dropped' }

/**
 * Resolve published `cohort_participant_results` for an auth user.
 * Tries `user_id = auth` first, then `user_id IN (profile ids)` for legacy rows that stored `profiles.id`.
 */
async function findPublishedResultRowForAuthUser(authUserId: string): Promise<{
  row: Record<string, unknown>
  cohortUuid: string
} | null> {
  const selectCols = 'result_json, result_version, published_at, status, cohort_id'

  const run = async (keys: string[]) => {
    const uniq = [...new Set(keys.map((k) => String(k || '').trim()).filter(Boolean))]
    if (uniq.length === 0) return null
    const { data, error } = await supabaseAdmin
      .from('cohort_participant_results')
      .select(selectCols)
      .in('user_id', uniq)
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.error('[cohortParticipantResultPayload] result query', error.message)
      return null
    }
    return data as Record<string, unknown> | null
  }

  let row = await run([authUserId])
  if (!row) {
    const { data: profs } = await supabaseAdmin.from('profiles').select('id').eq('user_id', authUserId)
    const pids = (profs || [])
      .map((p) => String((p as { id?: string }).id || '').trim())
      .filter(Boolean)
    if (pids.length > 0) {
      row = await run(pids)
    }
  }

  if (!row) return null
  const cohortUuid = String(row.cohort_id || '')
  if (!cohortUuid) return null
  return { row, cohortUuid }
}

/**
 * Shared by GET /api/cohort/participant-result and the cohort-result RSC (SSR payload).
 */
export async function buildCohortParticipantResultPayload(
  authUserId: string,
): Promise<BuildCohortParticipantResultOutcome> {
  const found = await findPublishedResultRowForAuthUser(authUserId)
  if (!found) {
    return { ok: false, reason: 'no_published_result' }
  }

  const { row, cohortUuid } = found

  const { data: cdef, error: cErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, product_name, brand_name')
    .eq('id', cohortUuid)
    .maybeSingle()
  if (cErr || !cdef?.id) {
    console.error('[cohortParticipantResultPayload] cohort def', cohortUuid, cErr?.message)
    return { ok: false, reason: 'no_published_result' }
  }

  const productName =
    (cdef as { product_name?: string | null }).product_name != null &&
    String((cdef as { product_name: string }).product_name).trim() !== ''
      ? String((cdef as { product_name: string }).product_name).trim()
      : null
  const brandName =
    (cdef as { brand_name?: string | null }).brand_name != null &&
    String((cdef as { brand_name: string }).brand_name).trim() !== ''
      ? String((cdef as { brand_name: string }).brand_name).trim()
      : null

  const publishedAt = row.published_at != null ? String(row.published_at) : ''

  const profileId = (await pickPrimaryProfileIdByStackCount(authUserId)) || ''
  const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, authUserId)

  let pro_reward: CohortParticipantResultProReward = { has_row: false, claimed: false, claim_token: null }

  const { data: cpRow } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, status')
    .eq('cohort_id', cohortUuid)
    .in('user_id', cpUserIds)
    .maybeSingle()

  const cpStatus = String((cpRow as { status?: string | null } | null)?.status || '')
    .trim()
    .toLowerCase()
  if (cpStatus === 'dropped') {
    return { ok: false, reason: 'participant_dropped' }
  }

  const cpId = (cpRow as { id?: string } | null)?.id
  if (cpId) {
    const { data: claimRow } = await supabaseAdmin
      .from('cohort_reward_claims')
      .select('token, claimed_at')
      .eq('cohort_participant_id', cpId)
      .maybeSingle()
    const cl = claimRow as { token?: string; claimed_at?: string | null } | null
    if (cl) {
      const claimed = cl.claimed_at != null && String(cl.claimed_at).trim() !== ''
      pro_reward = {
        has_row: true,
        claimed,
        claim_token:
          !claimed && cl.token != null && String(cl.token).trim() !== ''
            ? String(cl.token).trim()
            : null,
      }
    }
  }

  const payload: CohortParticipantResultApiPayload = {
    result_json: row.result_json,
    result_version:
      typeof row.result_version === 'number' ? row.result_version : Number(row.result_version) || 1,
    published_at: publishedAt,
    product_name: productName,
    brand_name: brandName,
    pro_reward,
  }

  return { ok: true, payload }
}
