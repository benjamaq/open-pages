import { daysBetweenInclusiveUtcYmd } from '@/lib/cohortCheckinCount'

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
