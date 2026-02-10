// Minimal shared UserContext type used by the dashboard/status update UI.
// Kept intentionally broad to avoid build-breaks from strict Supabase-generated types.

export type MicroInsight = {
  supplementName: string
  metric: string
  diff: number
  samplesOn: number
  samplesOff: number
}

export type TruthReportSummary = {
  name: string
}

export type UserContext = {
  daysTracked: number
  totalCheckins: number
  currentStreak: number
  hasNewTruthReport: boolean
  microInsights?: MicroInsight[] | null
  activeTests?: any[] | null
  newTruthReports?: TruthReportSummary[] | null
}


