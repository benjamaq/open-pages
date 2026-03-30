/**
 * Cohort (slug) persistence for branded study links: /study/[slug] → signup → profile.cohort_id.
 * Cookie survives redirects before auth completes.
 */

export const COHORT_COOKIE = 'bs_cohort'
/** Optional: study brand name for signup branding (set when applicant passes qualification). */
export const COHORT_BRAND_COOKIE = 'bs_cohort_brand'
/** Session draft after passing the on-page qualification form (before /signup/cohort). */
export const COHORT_QUALIFICATION_STORAGE_KEY = 'bs_cohort_qualification'
export type CohortQualificationDraftV1 = {
  v: 1
  cohortSlug: string
  /** Free-text main issue (stored in cohort_participants.qualification_response). */
  issue: string
}

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

export function setCohortBrandCookie(brandName: string): void {
  try {
    if (typeof document === 'undefined') return
    const trimmed = String(brandName || '').trim()
    if (!trimmed) return
    const expires = new Date(Date.now() + COHORT_COOKIE_DAYS * 864e5).toUTCString()
    document.cookie = `${COHORT_BRAND_COOKIE}=${encodeURIComponent(trimmed)}; expires=${expires}; path=/; SameSite=Lax`
  } catch (e) {
    console.warn('[COHORT] setCohortBrandCookie failed:', e)
  }
}

export function getCohortBrandCookie(): string | null {
  try {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + COHORT_BRAND_COOKIE.replace(/[.$?*|{}()\[\]\\\/\+^]/g, '\\$1') + '=([^;]*)')
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
    document.cookie = `${COHORT_BRAND_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  } catch {}
}
