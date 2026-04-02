import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * cohort_participants.user_id may reference public.profiles.id (repo migrations) or auth.users.id
 * (some production DBs). Reads must match either; inserts try profile id first, then auth id on FK failure.
 */
export function cohortParticipantUserIdCandidatesSync(
  profileId: string,
  authUserId: string | null | undefined,
): string[] {
  const pid = String(profileId || '').trim()
  const aid = authUserId != null ? String(authUserId).trim() : ''
  if (!pid) return aid ? [aid] : []
  if (!aid || aid === pid) return [pid]
  return [pid, aid]
}

export async function cohortParticipantUserIdCandidatesForProfile(profileId: string): Promise<string[]> {
  const pid = String(profileId || '').trim()
  if (!pid) return []
  const { data } = await supabaseAdmin.from('profiles').select('user_id').eq('id', pid).maybeSingle()
  const uid = (data as { user_id?: string } | null)?.user_id
  return cohortParticipantUserIdCandidatesSync(pid, uid)
}

export type CohortProfileIdRow = { id: string; user_id: string }

/** Resolve profiles where cohort_participants.user_id may be profiles.id or auth.users.id */
export async function fetchProfilesByCohortParticipantUserIds(
  cpUserIds: string[],
): Promise<Map<string, CohortProfileIdRow>> {
  const keys = [...new Set(cpUserIds.filter(Boolean))]
  if (keys.length === 0) return new Map()
  const [r1, r2] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, user_id').in('id', keys),
    supabaseAdmin.from('profiles').select('id, user_id').in('user_id', keys),
  ])
  const map = new Map<string, CohortProfileIdRow>()
  for (const row of [...(r1.data || []), ...(r2.data || [])] as CohortProfileIdRow[]) {
    if (!map.has(row.id)) {
      map.set(row.id, row)
      map.set(row.user_id, row)
    }
  }
  return map
}

/** Auth UUID for daily_entries / check-in counts; always profiles.user_id */
export function authUserIdFromCohortParticipantProfileMap(
  cpUserId: string,
  map: Map<string, CohortProfileIdRow>,
): string | null {
  return map.get(cpUserId)?.user_id ?? null
}
