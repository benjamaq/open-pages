import { supabaseAdmin } from '@/lib/supabase/admin'

export function addDaysYmd(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + delta)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function daysBetweenInclusiveUtcYmd(startYmd: string, endYmd: string): number {
  const [y1, m1, d1] = startYmd.split('-').map(Number)
  const [y2, m2, d2] = endYmd.split('-').map(Number)
  const t1 = Date.UTC(y1, m1 - 1, d1)
  const t2 = Date.UTC(y2, m2 - 1, d2)
  return Math.floor((t2 - t1) / 86400000)
}

function uniqueNonEmptyUserIds(userIds: string[]): string[] {
  return [...new Set(userIds.map((u) => String(u || '').trim()).filter(Boolean))]
}

export type FetchCohortCheckinYmdsOptions = {
  /**
   * When set (e.g. `cohort_participants.study_started_at`), rows must have `created_at >=` this instant.
   * Required for study-phase metrics: `local_date >= study start day` alone still includes compliance check-ins
   * submitted earlier the same calendar day before the study clock starts.
   */
  minCreatedAtIso?: string
  /**
   * When set (YYYY-MM-DD), rows whose effective `local_date` is on or before this day are ignored.
   * Post-confirmation baseline: use the UTC calendar date of `confirmed_at` so the second compliance
   * check-in (same calendar day as confirmation) does not count toward the 3 baseline-only days.
   */
  excludeLocalDatesOnOrBeforeYmd?: string
}

/**
 * Distinct calendar days with a qualifying check-in since enrollment.
 * Pass both `profiles.id` and `profiles.user_id` when `daily_entries.user_id` may match either shape.
 */
export async function fetchCohortCheckinYmdsSinceEnrollForUserIds(
  userIds: string[],
  enrolledIso: string,
  options?: FetchCohortCheckinYmdsOptions,
): Promise<string[]> {
  const uids = uniqueNonEmptyUserIds(userIds)
  if (uids.length === 0 || !enrolledIso) return []
  const enrollYmd = enrolledIso.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(enrollYmd)) return []
  const minCreated = String(options?.minCreatedAtIso || '').trim()
  const createdLower = minCreated || enrolledIso
  const excludeYmdOnOrBefore = String(
    options?.excludeLocalDatesOnOrBeforeYmd || '',
  ).trim()

  const byCreatedQ = supabaseAdmin
    .from('daily_entries')
    .select('local_date, created_at')
    .in('user_id', uids)
    .gte('created_at', createdLower)

  let byDateQ = supabaseAdmin
    .from('daily_entries')
    .select('local_date, created_at')
    .in('user_id', uids)
    .gte('local_date', enrollYmd)

  if (minCreated) {
    byDateQ = byDateQ.gte('created_at', minCreated)
  }

  const [{ data: byCreated }, { data: byDate }] = await Promise.all([byCreatedQ, byDateQ])
  const ymds = new Set<string>()
  /**
   * Study phase (`minCreatedAtIso`): require calendar day on/after anchor day AND `created_at` after study start instant.
   * Compliance (no `minCreatedAtIso`): count distinct `local_date` for rows with `created_at >= enrolled_at`.
   * Do not compare client `local_date` to the UTC *calendar day* of `enrolled_at` only — e.g. enroll at
   * `2026-04-02T01:00Z` makes enrollYmd `2026-04-02` while the first check-in can legitimately be `local_date`
   * `2026-04-01` after that instant; the old `ymd < enrollYmd` gate dropped that day and blocked confirmation at n=2.
   */
  const addRow = (r: { local_date?: string | null; created_at?: string | null }) => {
    const ymd = effectiveDailyEntryYmd(r)
    if (!ymd) return
    if (
      excludeYmdOnOrBefore &&
      /^\d{4}-\d{2}-\d{2}$/.test(excludeYmdOnOrBefore) &&
      ymd <= excludeYmdOnOrBefore
    ) {
      return
    }
    const ca = r.created_at != null ? String(r.created_at) : ''

    if (minCreated) {
      if (ymd < enrollYmd) return
      if (!ca || ca < minCreated) return
      ymds.add(ymd)
      return
    }

    if (ca) {
      if (ca >= createdLower) ymds.add(ymd)
      return
    }
    if (ymd >= enrollYmd) ymds.add(ymd)
  }
  for (const r of byCreated || []) addRow(r as { local_date?: string | null; created_at?: string | null })
  for (const r of byDate || []) addRow(r as { local_date?: string | null; created_at?: string | null })
  return Array.from(ymds)
}

/** Distinct calendar days with a qualifying check-in since enrollment (for streak / today flags). */
export async function fetchCohortCheckinYmdsSinceEnroll(
  authUserId: string,
  enrolledIso: string,
  options?: FetchCohortCheckinYmdsOptions,
): Promise<string[]> {
  const uid = String(authUserId || '').trim()
  if (!uid || !enrolledIso) return []
  return fetchCohortCheckinYmdsSinceEnrollForUserIds([uid], enrolledIso, options)
}

/** Consecutive calendar days with a check-in, counting backward from today (or yesterday if none today). */
export function consecutiveCheckinStreakFromYmds(ymds: string[], todayYmd: string): number {
  const set = new Set(ymds)
  let day = todayYmd
  if (!set.has(day)) day = addDaysYmd(todayYmd, -1)
  let streak = 0
  while (set.has(day)) {
    streak++
    day = addDaysYmd(day, -1)
  }
  return streak
}

/** Same calendar-day resolution as fetchCohortCheckinYmdsSinceEnroll (local_date preferred, else created_at). */
function effectiveDailyEntryYmd(r: { local_date?: string | null; created_at?: string | null }): string | null {
  const ld = r.local_date != null ? String(r.local_date).slice(0, 10) : ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(ld)) return ld
  const ca = r.created_at != null ? String(r.created_at) : ''
  if (ca.length >= 10) return ca.slice(0, 10)
  return null
}

/**
 * Distinct calendar days with a `daily_entries` row since enrollment (aligned with fetchCohortCheckinYmdsSinceEnroll).
 * When `cohort_participants.user_id` may be `profiles.id` or auth id, pass both so rows stored under either id count.
 */
export async function countDistinctDailyEntriesSinceForUserIds(
  userIds: string[],
  enrolledIso: string,
  options?: FetchCohortCheckinYmdsOptions,
): Promise<number> {
  const ymds = await fetchCohortCheckinYmdsSinceEnrollForUserIds(userIds, enrolledIso, options)
  return ymds.length
}

/** Distinct calendar days since enrollment for a single `daily_entries.user_id`. */
export async function countDistinctDailyEntriesSince(
  authUserId: string,
  enrolledIso: string,
  options?: FetchCohortCheckinYmdsOptions,
): Promise<number> {
  const uid = String(authUserId || '').trim()
  if (!uid || !enrolledIso) return 0
  return countDistinctDailyEntriesSinceForUserIds([uid], enrolledIso, options)
}
