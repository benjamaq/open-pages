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

const SELECT_RESULT_COLS = 'result_json, result_version, published_at, status, cohort_id'

function isPublishedRow(r: { status?: unknown; published_at?: unknown }): boolean {
  const st = String(r.status ?? '')
    .trim()
    .toLowerCase()
  const pAt = r.published_at
  if (pAt == null || String(pAt).trim() === '') return false
  return st === 'published' || st === 'ready'
}

/** All profile.id + auth id for this user (cohort_participants / results may key on either). */
async function expandAuthLookupKeys(authUserId: string): Promise<string[]> {
  const keys = new Set<string>()
  const aid = String(authUserId || '').trim()
  if (aid) keys.add(aid)
  const { data: profs } = await supabaseAdmin.from('profiles').select('id').eq('user_id', aid)
  for (const p of profs || []) {
    const id = String((p as { id?: string }).id || '').trim()
    if (id) keys.add(id)
  }
  return [...keys]
}

function pickBestPublishedRow(rows: Record<string, unknown>[]): Record<string, unknown> | null {
  const pub = (rows || []).filter((r) => isPublishedRow(r as { status?: unknown; published_at?: unknown }))
  if (pub.length === 0) return null
  pub.sort((a, b) => {
    const ta = Date.parse(String((a as { published_at?: string }).published_at || '')) || 0
    const tb = Date.parse(String((b as { published_at?: string }).published_at || '')) || 0
    return tb - ta
  })
  return pub[0] as Record<string, unknown>
}

/**
 * Prefer `.limit(n)` + first row over `.maybeSingle()` with `.order()` — PostgREST can error or behave
 * inconsistently with order+limit+maybeSingle in some deployments.
 */
async function queryPublishedResultsForUserKeys(userKeys: string[]): Promise<Record<string, unknown> | null> {
  const uniq = [...new Set(userKeys.map((k) => String(k || '').trim()).filter(Boolean))]
  if (uniq.length === 0) return null

  const { data, error } = await supabaseAdmin
    .from('cohort_participant_results')
    .select(SELECT_RESULT_COLS)
    .in('user_id', uniq)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[cohortParticipantResultPayload] result query', error.message, error.code)
    return null
  }
  return pickBestPublishedRow((data || []) as Record<string, unknown>[])
}

/**
 * When a row exists but user_id on the result row doesn’t match auth/profile keys (bad seed / migration),
 * find the cohort from cohort_participants and load the published result for that cohort + keys.
 */
async function queryPublishedResultsViaParticipantCohorts(userKeys: string[]): Promise<Record<string, unknown> | null> {
  const uniq = [...new Set(userKeys.map((k) => String(k || '').trim()).filter(Boolean))]
  if (uniq.length === 0) return null

  const { data: parts, error: pErr } = await supabaseAdmin
    .from('cohort_participants')
    .select('cohort_id')
    .in('user_id', uniq)

  if (pErr) {
    console.error('[cohortParticipantResultPayload] cohort_participants lookup', pErr.message)
    return null
  }

  const cohortIds = [...new Set((parts || []).map((p) => String((p as { cohort_id?: string }).cohort_id || '').trim()).filter(Boolean))]
  if (cohortIds.length === 0) return null

  for (const cohortId of cohortIds) {
    const { data, error } = await supabaseAdmin
      .from('cohort_participant_results')
      .select(SELECT_RESULT_COLS)
      .eq('cohort_id', cohortId)
      .in('user_id', uniq)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[cohortParticipantResultPayload] result by cohort', cohortId, error.message)
      continue
    }
    const row = pickBestPublishedRow((data || []) as Record<string, unknown>[])
    if (row) return row
  }
  return null
}

async function findPublishedResultRowForAuthUser(authUserId: string): Promise<{
  row: Record<string, unknown>
  cohortUuid: string
} | null> {
  const keys = await expandAuthLookupKeys(authUserId)

  let row = await queryPublishedResultsForUserKeys(keys)
  if (!row) {
    row = await queryPublishedResultsViaParticipantCohorts(keys)
  }

  if (!row) return null
  const cohortUuid = String(row.cohort_id || '').trim()
  if (!cohortUuid) return null
  return { row, cohortUuid }
}

async function fetchCohortProductMeta(cohortUuidOrSlug: string): Promise<{
  product_name: string | null
  brand_name: string | null
  /** Canonical `cohorts.id` — use for `cohort_participants.cohort_id` joins. */
  cohortIdForParticipants: string
} | null> {
  const { data: byId, error: idErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, product_name, brand_name')
    .eq('id', cohortUuidOrSlug)
    .maybeSingle()

  if (!idErr && byId && (byId as { id?: string }).id) {
    const c = byId as { id: string; product_name?: string | null; brand_name?: string | null }
    return {
      cohortIdForParticipants: String(c.id),
      product_name:
        c.product_name != null && String(c.product_name).trim() !== '' ? String(c.product_name).trim() : null,
      brand_name: c.brand_name != null && String(c.brand_name).trim() !== '' ? String(c.brand_name).trim() : null,
    }
  }

  const { data: bySlug, error: slugErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, product_name, brand_name')
    .eq('slug', cohortUuidOrSlug)
    .maybeSingle()

  if (!slugErr && bySlug && (bySlug as { id?: string }).id) {
    const c = bySlug as { id: string; product_name?: string | null; brand_name?: string | null }
    return {
      cohortIdForParticipants: String(c.id),
      product_name:
        c.product_name != null && String(c.product_name).trim() !== '' ? String(c.product_name).trim() : null,
      brand_name: c.brand_name != null && String(c.brand_name).trim() !== '' ? String(c.brand_name).trim() : null,
    }
  }

  console.error(
    '[cohortParticipantResultPayload] cohort def missing for',
    cohortUuidOrSlug,
    idErr?.message,
    slugErr?.message,
  )
  return null
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

  const meta = await fetchCohortProductMeta(cohortUuid)
  if (!meta) {
    return { ok: false, reason: 'no_published_result' }
  }

  const { product_name: productName, brand_name: brandName, cohortIdForParticipants } = meta

  const publishedAt = row.published_at != null ? String(row.published_at) : ''

  const profileId = (await pickPrimaryProfileIdByStackCount(authUserId)) || ''
  const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, authUserId)

  let pro_reward: CohortParticipantResultProReward = { has_row: false, claimed: false, claim_token: null }

  const { data: cpRow } = await supabaseAdmin
    .from('cohort_participants')
    .select('id, status')
    .eq('cohort_id', cohortIdForParticipants)
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
