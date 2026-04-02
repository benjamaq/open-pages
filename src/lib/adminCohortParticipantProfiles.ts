import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * cohort_participants.user_id may reference public.profiles.id (repo migrations) or
 * auth.users.id (some deployments). Load profiles by both keys and map by either UUID.
 */
export const ADMIN_COHORT_PROFILE_COLUMNS =
  'id, display_name, user_id, shipping_address_line1, shipping_address_line2, shipping_city, shipping_region, shipping_postal_code, shipping_country'

export type AdminCohortProfileRow = {
  id: string
  display_name: string | null
  user_id: string
  shipping_address_line1?: string | null
  shipping_address_line2?: string | null
  shipping_city?: string | null
  shipping_region?: string | null
  shipping_postal_code?: string | null
  shipping_country?: string | null
}

export async function fetchProfilesForCohortParticipantUserIds(
  participantUserIds: string[],
): Promise<{ map: Map<string, AdminCohortProfileRow>; error: { message: string } | null }> {
  const ids = [...new Set(participantUserIds.filter(Boolean))]
  if (ids.length === 0) return { map: new Map(), error: null }

  const [byPk, byAuth] = await Promise.all([
    supabaseAdmin.from('profiles').select(ADMIN_COHORT_PROFILE_COLUMNS).in('id', ids),
    supabaseAdmin.from('profiles').select(ADMIN_COHORT_PROFILE_COLUMNS).in('user_id', ids),
  ])

  if (byPk.error) {
    return { map: new Map(), error: { message: byPk.error.message } }
  }
  if (byAuth.error) {
    return { map: new Map(), error: { message: byAuth.error.message } }
  }

  const uniqByProfileId = new Map<string, AdminCohortProfileRow>()
  for (const row of [...(byPk.data || []), ...(byAuth.data || [])]) {
    const r = row as AdminCohortProfileRow
    if (!uniqByProfileId.has(r.id)) uniqByProfileId.set(r.id, r)
  }

  const lookup = new Map<string, AdminCohortProfileRow>()
  for (const prof of uniqByProfileId.values()) {
    lookup.set(prof.id, prof)
    lookup.set(prof.user_id, prof)
  }

  return { map: lookup, error: null }
}

/** Auth user id for API calls: profile.user_id, or cohort_participants.user_id if FK is auth.users. */
export function authUserIdForParticipant(p: AdminCohortProfileRow | undefined, participantUserId: string): string {
  if (p?.user_id) return p.user_id
  return participantUserId
}
