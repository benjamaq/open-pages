/**
 * Pure policy for which cohort's published result to show — mirrors `cohortParticipantResultPayload` resolution
 * (used for tests and documentation; keep in sync with DB lookups there).
 */
export function pickPublishedResultCohortId(args: {
  /** From profiles.cohort_id → cohorts.id */
  preferredCohortUuid: string | null
  /** Distinct cohort_id from cohort_participants for this user */
  participantCohortIds: string[]
  /** Cohort IDs where a published result row exists for this user */
  cohortIdsWithPublishedResult: string[]
}): string | null {
  const pub = new Set(args.cohortIdsWithPublishedResult.map((id) => String(id).trim()).filter(Boolean))
  if (args.preferredCohortUuid) {
    const pref = String(args.preferredCohortUuid).trim()
    if (!pref) return null
    return pub.has(pref) ? pref : null
  }
  const candidates = args.participantCohortIds
    .map((id) => String(id).trim())
    .filter(Boolean)
    .filter((id) => pub.has(id))
  if (candidates.length === 1) return candidates[0]
  return null
}
