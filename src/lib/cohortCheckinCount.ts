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

/** Distinct calendar days with a qualifying check-in since enrollment (for streak / today flags). */
export async function fetchCohortCheckinYmdsSinceEnroll(authUserId: string, enrolledIso: string): Promise<string[]> {
  const uid = String(authUserId || '').trim()
  if (!uid || !enrolledIso) return []
  const enrollYmd = enrolledIso.slice(0, 10)
  const [{ data: byCreated }, { data: byDate }] = await Promise.all([
    supabaseAdmin.from('daily_entries').select('local_date, created_at').eq('user_id', uid).gte('created_at', enrolledIso),
    supabaseAdmin.from('daily_entries').select('local_date, created_at').eq('user_id', uid).gte('local_date', enrollYmd),
  ])
  const ymds = new Set<string>()
  const addRow = (r: { local_date?: string | null; created_at?: string | null }) => {
    const ld = r.local_date != null ? String(r.local_date).slice(0, 10) : ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(ld)) {
      ymds.add(ld)
      return
    }
    const ca = r.created_at != null ? String(r.created_at) : ''
    if (ca.length >= 10) ymds.add(ca.slice(0, 10))
  }
  for (const r of byCreated || []) addRow(r as { local_date?: string | null; created_at?: string | null })
  for (const r of byDate || []) addRow(r as { local_date?: string | null; created_at?: string | null })
  return Array.from(ymds)
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

/** Dedupe key; uses effective day so counts match streak / ymd-derived flags when local_date is odd or null. */
function dailyEntryDayKey(r: {
  user_id?: string | null
  local_date?: string | null
  created_at?: string | null
}): string | null {
  const u = r.user_id != null ? String(r.user_id).trim() : ''
  const ymd = effectiveDailyEntryYmd(r)
  if (!u || !ymd) return null
  return `${u}|${ymd}`
}

/** Distinct daily_entries rows (by calendar day) since enrollment — aligned with fetchCohortCheckinYmdsSinceEnroll. */
export async function countDistinctDailyEntriesSince(authUserId: string, enrolledIso: string): Promise<number> {
  const uid = String(authUserId || '').trim()
  if (!uid || !enrolledIso) return 0
  const enrollYmd = enrolledIso.slice(0, 10)
  const [{ data: byCreated }, { data: byDate }] = await Promise.all([
    supabaseAdmin
      .from('daily_entries')
      .select('user_id, local_date, created_at')
      .eq('user_id', uid)
      .gte('created_at', enrolledIso),
    supabaseAdmin
      .from('daily_entries')
      .select('user_id, local_date, created_at')
      .eq('user_id', uid)
      .gte('local_date', enrollYmd),
  ])
  const keys = new Set<string>()
  for (const r of byCreated || []) {
    const k = dailyEntryDayKey(r as { user_id?: string | null; local_date?: string | null; created_at?: string | null })
    if (k) keys.add(k)
  }
  for (const r of byDate || []) {
    const k = dailyEntryDayKey(r as { user_id?: string | null; local_date?: string | null; created_at?: string | null })
    if (k) keys.add(k)
  }
  return keys.size
}
