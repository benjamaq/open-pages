/**
 * Cohort study dashboard UI flags from `cohort_participants` (no DB writes).
 *
 * Precedence (matches product rules):
 * - `study_completed_at` → completed
 * - `study_started_at` → active (overrides `status` — source of truth that study has begun)
 * - `status === 'confirmed'` (+ `confirmed_at`) → confirmed pre-product
 * - else → applied / compliance phase
 */

export type CohortDashboardParticipantUiResolved = {
  /** `confirmed` or `completed` in DB with non-empty `confirmed_at`. */
  legacyCohortConfirmed: boolean
  studyCompletedAtSet: boolean
  studyStartedAtSet: boolean
  /**
   * True when the user should see post–compliance-gate shell (product holding, active study, or complete).
   * Not the same as DB `status` alone — `study_started_at` / `study_completed_at` override.
   */
  cohortConfirmed: boolean
  /** True while product / first study night / scheduled start — not yet in “day counter” active study. */
  cohortAwaitingStudyStart: boolean
}

export function resolveCohortDashboardParticipantUi(params: {
  participantStatus: string
  confirmedAtRaw: string | null | undefined
  studyStartedAtIso: string | null
  studyCompletedRaw: string | null | undefined
  todayYmd: string
}): CohortDashboardParticipantUiResolved {
  const ps = String(params.participantStatus || '')
    .trim()
    .toLowerCase()

  const confirmedAt =
    params.confirmedAtRaw != null && String(params.confirmedAtRaw).trim() !== ''
      ? String(params.confirmedAtRaw).trim()
      : null

  const legacyCohortConfirmed =
    (ps === 'confirmed' || ps === 'completed') && confirmedAt !== null

  const studyCompletedAtSet =
    params.studyCompletedRaw != null && String(params.studyCompletedRaw).trim() !== ''

  const studyStartedAtIso =
    params.studyStartedAtIso != null && String(params.studyStartedAtIso).trim() !== ''
      ? String(params.studyStartedAtIso).trim()
      : null
  const studyStartedAtSet = studyStartedAtIso !== null

  const studyStartYmd = studyStartedAtIso ? studyStartedAtIso.slice(0, 10) : null
  const studyClockHasBegun = Boolean(
    studyStartYmd != null && studyStartYmd <= params.todayYmd,
  )

  const cohortConfirmed =
    studyCompletedAtSet || studyStartedAtSet || legacyCohortConfirmed

  const cohortAwaitingStudyStart = Boolean(
    cohortConfirmed &&
      !studyCompletedAtSet &&
      (!studyStartedAtIso || !studyClockHasBegun),
  )

  return {
    legacyCohortConfirmed,
    studyCompletedAtSet,
    studyStartedAtSet,
    cohortConfirmed,
    cohortAwaitingStudyStart,
  }
}
