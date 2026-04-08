/**
 * Shared sizes for partner mark (DoNotAge DNA or `/cohorts/{slug}/logo.png`) + BioStackr wordmark
 * on cohort dashboard surfaces so first-visit and internal pages stay visually consistent.
 */

/** Partner logo in `CohortStudyDashboard` top row (left). Slightly taller than BioStackr on mobile so DNA marks read clearly. */
export const COHORT_DASHBOARD_PARTNER_MARK_CLASS =
  'h-16 w-auto max-w-[min(300px,64vw)] object-contain object-left sm:h-[4.25rem] sm:max-w-[min(300px,58vw)] md:h-[4.75rem] md:max-w-[min(320px,50vw)]'

/** BioStackr wordmark in the same row (right). */
export const COHORT_DASHBOARD_BIOSTACKR_ROW_CLASS =
  'h-10 w-auto max-w-[min(180px,44vw)] object-contain object-right sm:h-11 md:h-12 md:max-w-[min(200px,40vw)]'

/** Sticky `/dashboard` header when cohort shell (BioStackr only) — same scale line as study row. */
export const COHORT_SHELL_HEADER_BIOSTACKR_CLASS = 'h-9 w-auto sm:h-10'

/** DoNotAge DNA (or partner raster) in `CohortParticipantResultView` header chip — same scale family as dashboard. */
export const COHORT_RESULT_PARTNER_MARK_CLASS =
  'h-12 w-auto max-w-[200px] object-contain object-left sm:h-14 sm:max-w-[240px] md:h-16'
