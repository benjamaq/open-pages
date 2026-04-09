import type { SupabaseClient } from '@supabase/supabase-js'

const IN_CHUNK = 120

/**
 * Unique `profiles.id` and `profiles.user_id` values from reminder candidate rows, for
 * matching `cohort_participants.user_id` (which may store either UUID).
 */
export function profileKeysForCohortParticipantFilter(
  profiles: Array<{ profile_id?: string | null; user_id?: string | null }>,
): string[] {
  const s = new Set<string>()
  for (const p of profiles) {
    if (p.profile_id) s.add(String(p.profile_id).trim())
    if (p.user_id) s.add(String(p.user_id).trim())
  }
  return [...s].filter(Boolean)
}

/**
 * Expands cohort rows with `study_completed_at` set into every related profile/auth id so
 * daily reminder filtering matches regardless of whether `cohort_participants.user_id`
 * stores `profiles.id` or `auth.users.id`.
 */
export async function fetchExpandedCohortStudyCompletedIdExclusions(
  supabase: SupabaseClient,
  candidateKeys: string[],
): Promise<Set<string>> {
  const exclude = new Set<string>()
  if (candidateKeys.length === 0) return exclude

  const rawCpIds = new Set<string>()
  for (let i = 0; i < candidateKeys.length; i += IN_CHUNK) {
    const chunk = candidateKeys.slice(i, i + IN_CHUNK)
    const { data: rows, error } = await supabase
      .from('cohort_participants')
      .select('user_id')
      .not('study_completed_at', 'is', null)
      .in('user_id', chunk)
    if (error) {
      console.warn('[cohortDailyReminder] study_completed chunk:', error.message)
      continue
    }
    for (const r of rows || []) {
      const uid = (r as { user_id?: string }).user_id
      if (uid) rawCpIds.add(String(uid))
    }
  }

  if (rawCpIds.size === 0) return exclude

  const rawArr = [...rawCpIds]
  for (const id of rawArr) exclude.add(id)

  for (let i = 0; i < rawArr.length; i += IN_CHUNK) {
    const chunk = rawArr.slice(i, i + IN_CHUNK)
    const [r1, r2] = await Promise.all([
      supabase.from('profiles').select('id, user_id').in('id', chunk),
      supabase.from('profiles').select('id, user_id').in('user_id', chunk),
    ])
    for (const row of [...(r1.data || []), ...(r2.data || [])] as { id: string; user_id: string }[]) {
      exclude.add(row.id)
      exclude.add(row.user_id)
    }
  }

  return exclude
}

export function profileRowMatchesCohortStudyCompletedExclusion(
  p: { profile_id?: string | null; user_id?: string | null },
  exclusion: Set<string>,
): boolean {
  const pid = p.profile_id ? String(p.profile_id).trim() : ''
  const uid = p.user_id ? String(p.user_id).trim() : ''
  if (pid && exclusion.has(pid)) return true
  if (uid && exclusion.has(uid)) return true
  return false
}
