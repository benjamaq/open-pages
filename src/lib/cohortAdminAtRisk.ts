import { supabaseAdmin } from '@/lib/supabase/admin'

function ymdAddCalendarDays(ymd: string, deltaDays: number): string {
  const parts = ymd.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return ymd
  const [y, m, d] = parts
  const ms = Date.UTC(y, m - 1, d) + deltaDays * 86400000
  const t = new Date(ms)
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

function ymdCompare(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}

/**
 * Yellow-flag rule for admin: confirmed participant in active study with no check-in
 * on the last two UTC calendar days (yesterday and the day before), both within the study window.
 */
export async function cohortConfirmedParticipantAtRisk(params: {
  authUserId: string
  confirmedAtIso: string
  studyDays: number
  cohortEndYmd: string | null | undefined
}): Promise<boolean> {
  const uid = String(params.authUserId || '').trim()
  if (!uid) return false

  const confYmd = String(params.confirmedAtIso || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(confYmd)) return false

  const todayYmd = new Date().toISOString().slice(0, 10)
  const studyDays = Math.max(1, Math.floor(Number(params.studyDays)) || 21)
  const lastStudyYmd = ymdAddCalendarDays(confYmd, studyDays - 1)
  const capFromCohort =
    params.cohortEndYmd && /^\d{4}-\d{2}-\d{2}$/.test(String(params.cohortEndYmd))
      ? String(params.cohortEndYmd).slice(0, 10)
      : null

  if (ymdCompare(todayYmd, confYmd) < 0) return false
  const studyLast = capFromCohort != null ? [lastStudyYmd, capFromCohort].sort(ymdCompare)[0] : lastStudyYmd
  if (ymdCompare(todayYmd, studyLast) > 0) return false

  const y1 = ymdAddCalendarDays(todayYmd, -1)
  const y2 = ymdAddCalendarDays(todayYmd, -2)
  if (ymdCompare(y2, confYmd) < 0) return false
  if (ymdCompare(y1, studyLast) > 0) return false

  const { data: rows, error } = await supabaseAdmin
    .from('daily_entries')
    .select('local_date')
    .eq('user_id', uid)
    .in('local_date', [y1, y2])

  if (error) {
    console.error('[cohortAdminAtRisk] daily_entries', error)
    return false
  }

  const have = new Set((rows || []).map((r: { local_date: string }) => String(r.local_date).slice(0, 10)))
  return !have.has(y1) && !have.has(y2)
}
