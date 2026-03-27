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

/** Append localToday=YYYY-MM-DD for /api/dashboard/load and /api/progress/loop */
export function appendLocalTodayParam(path: string): string {
  const ymd = getLocalDateYmd()
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}localToday=${encodeURIComponent(ymd)}`
}
