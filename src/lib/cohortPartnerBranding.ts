/**
 * Canonical cohort slugs for partner-specific public assets, email headers, and dosing copy.
 * Prefer matching on slug — not `brand_name` substrings — so new cohorts never accidentally * inherit DoNotAge or Seeking Health packs.
 */

export const COHORT_SLUG_DONOTAGE_SURESLEEP = 'donotage-suresleep' as const
export const COHORT_SLUG_SEEKING_HEALTH_OPTIMAL_FOCUS = 'seeking-health-optimal-focus' as const

export function normalizeCohortSlugForBranding(slug: string | null | undefined): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
}

/** SureSleep study — DNA logos, sleep pack imagery, SureSleep dosing lines. */
export function isDonotageSureSleepStudySlug(slug: string | null | undefined): boolean {
  return normalizeCohortSlugForBranding(slug) === COHORT_SLUG_DONOTAGE_SURESLEEP
}

/** Optimal Focus study — Seeking Health public asset pack and approved dosing copy. */
export function isSeekingHealthOptimalFocusStudySlug(slug: string | null | undefined): boolean {
  return normalizeCohortSlugForBranding(slug) === COHORT_SLUG_SEEKING_HEALTH_OPTIMAL_FOCUS
}
