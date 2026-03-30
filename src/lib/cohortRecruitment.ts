import { supabaseAdmin } from '@/lib/supabase/admin'

/** Recruitment is closed when `closesAt` is a timestamp strictly before now (UTC). */
export function isRecruitmentPastDeadline(closesAt: string | null | undefined): boolean {
  if (closesAt == null || String(closesAt).trim() === '') return false
  const t = new Date(closesAt).getTime()
  if (!Number.isFinite(t)) return false
  return t < Date.now()
}

export function isCohortCapacityFull(maxParticipants: number | null | undefined, pipelineCount: number): boolean {
  if (maxParticipants == null || !Number.isFinite(Number(maxParticipants))) return false
  const cap = Math.max(0, Math.floor(Number(maxParticipants)))
  return pipelineCount >= cap
}

/** applied + confirmed rows (cap toward recruitment). */
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
