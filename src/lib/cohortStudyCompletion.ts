import {
  countDistinctDailyEntriesSinceForUserIds,
  daysBetweenInclusiveUtcYmd,
} from '@/lib/cohortCheckinCount'

/** Minimum distinct check-in days on/after `study_started_at` required before auto-completion (cron). */
export const MIN_STUDY_CHECKINS_FOR_COMPLETION = 15

/**
 * Distinct `daily_entries` calendar days since study clock start, aligned with /api/me study-phase counting * (`minCreatedAtIso: study_started_at`).
 */
export async function cohortStudyDistinctCheckinDaysSinceStart(
  userIds: string[],
  studyStartedAtIso: string,
): Promise<number> {
  const anchor = String(studyStartedAtIso || '').trim()
  if (!anchor) return 0
  return countDistinctDailyEntriesSinceForUserIds(userIds, anchor, {
    minCreatedAtIso: anchor,
  })
}

/** Study day index (1-based), aligned with /api/me cohort block (inclusive span from study start YMD). */
export function cohortStudyCurrentDayFromAnchors(
  todayYmd: string,
  studyStartedAtIso: string,
): number {
  const studyYmd = String(studyStartedAtIso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(studyYmd) || !/^\d{4}-\d{2}-\d{2}$/.test(todayYmd)) return 0
  return Math.max(1, daysBetweenInclusiveUtcYmd(studyYmd, todayYmd) + 1)
}

/** Whether the inclusive study-day count has reached configured study length (cron + UI). */
export function cohortStudyWindowElapsed(
  todayYmd: string,
  studyStartedAtIso: string,
  studyDays: number,
): boolean {
  const days = typeof studyDays === 'number' && studyDays > 0 ? studyDays : 21
  const day = cohortStudyCurrentDayFromAnchors(todayYmd, studyStartedAtIso)
  return day >= days
}
