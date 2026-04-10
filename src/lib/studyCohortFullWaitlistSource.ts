/**
 * Stored on `study_waitlist.source` when signup is from study-page “cohort full” capture.
 * Use a neutral tag; cohort is already identified by `cohort_id` on the row.
 */

/** Current canonical value — safe for any study slug. */
export const STUDY_COHORT_FULL_WAITLIST_SOURCE = 'study-cohort-capacity'

/** @deprecated Legacy constant only — still accepted by the API for existing clients. */
export const LEGACY_STUDY_COHORT_FULL_WAITLIST_SOURCE_DONOTAGE = 'donotage-suresleep-waitlist'

export function isAcceptedStudyCohortFullWaitlistSource(raw: unknown): boolean {
  const s = typeof raw === 'string' ? raw.trim() : ''
  return (
    s === STUDY_COHORT_FULL_WAITLIST_SOURCE || s === LEGACY_STUDY_COHORT_FULL_WAITLIST_SOURCE_DONOTAGE
  )
}
