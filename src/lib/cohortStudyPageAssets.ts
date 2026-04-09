/**
 * Public study page imagery for cohort shapes.
 * Cognitive cohorts use the Seeking Health asset pack paths (single cognitive style until per-cohort DB URLs exist).
 */
export const COGNITIVE_COHORT_STUDY_ASSETS = {
  partnerLogo: '/cohorts/seeking-health/logo.png',
  /** Dark footer strip — white mark (`logowhite.png` in public pack). */
  partnerLogoWhite: '/cohorts/seeking-health/logowhite.png',
  productImage: '/cohorts/seeking-health/product.png',
  /** First card in “You’ll receive” (product shelf) — Seeking Health pack. */
  productImageFirstShelf: '/cohorts/seeking-health/product2.png',
  rewardHero: '/cohorts/seeking-health/hero.png',
} as const

export const SLEEP_PACK_PRODUCT_IMAGE = '/suresleep-1280x1280.png'
export const GENERIC_STUDY_PLACEHOLDER_IMAGE = '/bioshot.png'

/** Lowercase hyphenated segment for `/public/cohorts/{segment}/…` (no hardcoded cohorts). */
export function slugifyCohortAssetSegment(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Ordered `/cohorts/{folder}/logo.png` URLs to try for the cohort dashboard partner mark.
 * Prefer brand-based folder (matches short asset packs like `public/cohorts/seeking-health/`)
 * when the DB slug is longer (e.g. `seeking-health-optimal-focus`).
 */
export function cohortPartnerLogoPublicCandidates(
  cohortSlug: string,
  brandName: string,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (segment: string) => {
    const s = slugifyCohortAssetSegment(segment)
    if (!s) return
    const path = `/cohorts/${s}/logo.png`
    if (seen.has(path)) return
    seen.add(path)
    out.push(path)
  }
  push(brandName)
  push(cohortSlug)
  return out
}
