import { supabaseAdmin } from '@/lib/supabase/admin'
import { isProActive } from '@/lib/entitlements/pro'
import { daysBetweenInclusiveUtcYmd } from '@/lib/cohortCheckinCount'
import { cohortParticipantUserIdCandidatesSync } from '@/lib/cohortParticipantUserId'

/**
 * Whether POST /api/checkin should use the cohort study payload path (required fields from
 * cohorts.checkin_fields). When false, the standard B2C body is used — matches /api/me when
 * `showCohortStudyDashboard` is false (graduated + Pro, dropped, invalid status, or missing cohort row).
 */
export async function shouldUseCohortCheckinBranch(params: {
  authUserId: string
  cohortSlug: string
  todayYmd: string
}): Promise<boolean> {
  const { authUserId, cohortSlug, todayYmd } = params
  if (!cohortSlug) return false

  const { data: cdef, error: cdefErr } = await supabaseAdmin
    .from('cohorts')
    .select('id, study_days')
    .eq('slug', cohortSlug)
    .maybeSingle()
  if (cdefErr || !cdef || !(cdef as { id?: string }).id) {
    return false
  }
  const cohortUuid = String((cdef as { id: string }).id)
  const studyDaysRaw = (cdef as { study_days?: number | null }).study_days
  const cohortStudyDays =
    typeof studyDaysRaw === 'number' && studyDaysRaw > 0 ? studyDaysRaw : 21

  const { data: pAdmin } = await supabaseAdmin
    .from('profiles')
    .select('id, tier, pro_expires_at')
    .eq('user_id', authUserId)
    .maybeSingle()
  const profileId = (pAdmin as { id?: string } | null)?.id
    ? String((pAdmin as { id: string }).id)
    : ''
  const cpUserIds = cohortParticipantUserIdCandidatesSync(profileId, authUserId)

  const { data: part } = await supabaseAdmin
    .from('cohort_participants')
    .select('status, study_started_at, study_completed_at')
    .in('user_id', cpUserIds)
    .eq('cohort_id', cohortUuid)
    .maybeSingle()

  const participantStatus = String((part as { status?: string | null } | null)?.status || '')
    .trim()
    .toLowerCase()
  if (participantStatus === 'dropped') return false
  if (
    participantStatus &&
    !['applied', 'confirmed', 'completed'].includes(participantStatus)
  ) {
    return false
  }

  const studyCompletedRaw = (part as { study_completed_at?: string | null } | null)
    ?.study_completed_at
  const studyCompletedAtSet =
    studyCompletedRaw != null && String(studyCompletedRaw).trim() !== ''

  const studyStartedRaw = (part as { study_started_at?: string | null } | null)?.study_started_at
  const studyStartedAtIso =
    studyStartedRaw != null && String(studyStartedRaw).trim() !== ''
      ? String(studyStartedRaw).trim()
      : null

  let cohortStudyComplete =
    participantStatus === 'completed' || studyCompletedAtSet
  const studyStartYmd = studyStartedAtIso ? studyStartedAtIso.slice(0, 10) : null
  const studyClockHasBegun = Boolean(
    studyStartYmd != null && studyStartYmd <= todayYmd,
  )
  if (studyClockHasBegun && studyStartYmd) {
    const cohortStudyCurrentDay = Math.max(
      1,
      daysBetweenInclusiveUtcYmd(studyStartYmd, todayYmd) + 1,
    )
    cohortStudyComplete =
      cohortStudyComplete || cohortStudyCurrentDay >= cohortStudyDays
  }

  let cohortParticipantResultPublished = false
  try {
    const { data: resRow } = await supabaseAdmin
      .from('cohort_participant_results')
      .select('published_at, status')
      .eq('cohort_id', cohortUuid)
      .eq('user_id', authUserId)
      .maybeSingle()
    const pAt = (resRow as { published_at?: string | null } | null)?.published_at
    const st = String(
      (resRow as { status?: string | null } | null)?.status || '',
    ).toLowerCase()
    cohortParticipantResultPublished =
      st === 'published' && pAt != null && String(pAt).trim() !== ''
  } catch {
    cohortParticipantResultPublished = false
  }

  const studyFinishedForProduct =
    studyCompletedAtSet ||
    participantStatus === 'completed' ||
    cohortStudyComplete ||
    cohortParticipantResultPublished

  const proActive = isProActive({
    tier: (pAdmin as { tier?: string | null } | null)?.tier,
    pro_expires_at: (pAdmin as { pro_expires_at?: string | null } | null)?.pro_expires_at,
  })

  if (proActive && studyFinishedForProduct) return false

  return true
}
