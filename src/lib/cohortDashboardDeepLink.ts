/** Survives Supabase magic-link / OAuth redirects (unlike URL fragments). */
export const COHORT_DASHBOARD_VIEW_QUERY = 'view'
export const COHORT_DASHBOARD_VIEW_VALUE = 'cohort'

/** Path after magic-link auth (stored in magic_link_redirects, appended after /auth/callback). */
export function cohortDashboardStudyPath(): string {
  return `/dashboard?${COHORT_DASHBOARD_VIEW_QUERY}=${COHORT_DASHBOARD_VIEW_VALUE}`
}

export function cohortDashboardStudyCheckinPath(): string {
  return `${cohortDashboardStudyPath()}&checkin=1`
}
