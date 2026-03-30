import { supabaseAdmin } from '@/lib/supabase/admin'

/** Study is full when confirmed participant count reaches max (no time-based cutoff). */
export function isCohortCapacityFull(maxParticipants: number | null | undefined, confirmedCount: number): boolean {
  if (maxParticipants == null || !Number.isFinite(Number(maxParticipants))) return false
  const cap = Math.max(0, Math.floor(Number(maxParticipants)))
  return confirmedCount >= cap
}

/** applied + confirmed rows (pipeline / historical capacity toward signup — not used for “study full”). */
export async function countCohortPipelineParticipants(cohortUuid: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortUuid)
    .in('status', ['applied', 'confirmed'])

  if (error) {
    console.error('[cohortRecruitment] pipeline count:', error)
    return 0
  }
  return typeof count === 'number' ? count : 0
}

export async function countCohortConfirmedParticipants(cohortUuid: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortUuid)
    .eq('status', 'confirmed')

  if (error) {
    console.error('[cohortRecruitment] confirmed count:', error)
    return 0
  }
  return typeof count === 'number' ? count : 0
}

export async function countCohortStatusParticipants(cohortUuid: string, status: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortUuid)
    .eq('status', status)

  if (error) {
    console.error('[cohortRecruitment] status count:', status, error)
    return 0
  }
  return typeof count === 'number' ? count : 0
}

/** New cohort_participants rows with enrolled_at in the last 24 hours (UTC). */
export async function countCohortEnrollmentsLast24h(cohortUuid: string): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error } = await supabaseAdmin
    .from('cohort_participants')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortUuid)
    .gte('enrolled_at', since)

  if (error) {
    console.error('[cohortRecruitment] enrollments 24h:', error)
    return 0
  }
  return typeof count === 'number' ? count : 0
}
