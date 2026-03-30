/**
 * Cohort (slug) persistence for branded study links: /study/[slug] → signup → profile.cohort_id.
 * Cookie survives redirects before auth completes.
 */

export const COHORT_COOKIE = 'bs_cohort'
const COHORT_COOKIE_DAYS = 7

export function setCohortCookie(slug: string): void {
  try {
    if (typeof document === 'undefined') return
    const trimmed = String(slug || '').trim()
    if (!trimmed) return
    const expires = new Date(Date.now() + COHORT_COOKIE_DAYS * 864e5).toUTCString()
    document.cookie = `${COHORT_COOKIE}=${encodeURIComponent(trimmed)}; expires=${expires}; path=/; SameSite=Lax`
  } catch (e) {
    console.warn('[COHORT] setCohortCookie failed:', e)
  }
}

export function getCohortCookie(): string | null {
  try {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + COHORT_COOKIE.replace(/[.$?*|{}()\[\]\\\/\+^]/g, '\\$1') + '=([^;]*)')
    )
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

export function clearCohortCookie(): void {
  try {
    if (typeof document === 'undefined') return
    document.cookie = `${COHORT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  } catch {}
}
