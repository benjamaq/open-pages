/**
 * Brand-specific dosing for product-arrival email + in-app Day 1 / pre-product helper.
 * Slug-canonical only — avoids accidental matches on `brand_name` or product strings.
 */

import {
  isDonotageSureSleepStudySlug,
  isSeekingHealthOptimalFocusStudySlug,
} from '@/lib/cohortPartnerBranding'

export type CohortArrivalDosingKind = 'seeking_optimal_focus' | 'donotage_suresleep' | 'default'

export function resolveCohortArrivalDosingKind(params: {
  partnerBrandName: string
  productName: string
  cohortSlug?: string | null
}): CohortArrivalDosingKind {
  void params.partnerBrandName
  void params.productName
  if (isSeekingHealthOptimalFocusStudySlug(params.cohortSlug)) {
    return 'seeking_optimal_focus'
  }
  if (isDonotageSureSleepStudySlug(params.cohortSlug)) {
    return 'donotage_suresleep'
  }
  return 'default'
}

/** One line for transactional email (before “, as directed on the label.”). */
export function cohortArrivalDosingEmailTakeLine(kind: CohortArrivalDosingKind): string {
  switch (kind) {
    case 'seeking_optimal_focus':
      return 'Take 1 capsule this morning after food'
    case 'donotage_suresleep':
      return 'Take 1 scoop mixed with water, 30–60 minutes before bed'
    default:
      return 'Follow the directions on your product label for this study'
  }
}

/** In-app helper: must match email intent; Optimal Focus / SureSleep use exact approved strings. */
export function cohortArrivalDosingInAppParagraph(kind: CohortArrivalDosingKind): string {
  switch (kind) {
    case 'seeking_optimal_focus':
      return 'Take 1 capsule each morning after food, as directed on the label.'
    case 'donotage_suresleep':
      return 'Take 1 scoop mixed with water, 30–60 minutes before bed.'
    default:
      return 'Follow the directions on your product label, as directed for this study.'
  }
}
