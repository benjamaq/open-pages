/**
 * Calendar YYYY-MM-DD in the caller's local timezone.
 * In the browser this is the user's local date; use for check-in and "today" vs daily_entries.local_date.
 */
export function getLocalDateYmd(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Calendar YYYY-MM-DD for an instant in the zone described by the same `tzOffsetMinutes`
 * the browser sends as `-new Date().getTimezoneOffset()` (see MDN).
 * Used server-side so legacy `checkin.created_at` matches `localToday` from the client.
 */
export function getYmdForUtcMsInTzOffset(utcMs: number, tzOffsetMinutes: number): string {
  // tzOffsetMinutes must match the browser value `-new Date().getTimezoneOffset()` (see MDN).
  const localWallMs = utcMs + tzOffsetMinutes * 60000
  const d = new Date(localWallMs)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Append localToday + tzOffset for /api/dashboard/load, /api/progress/loop, /api/elli/context */
export function appendLocalTodayParam(path: string): string {
  const ymd = getLocalDateYmd()
  const tz = String(-new Date().getTimezoneOffset())
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}localToday=${encodeURIComponent(ymd)}&tzOffset=${encodeURIComponent(tz)}`
}
