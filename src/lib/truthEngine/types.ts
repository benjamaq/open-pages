export type TruthStatus = 'proven_positive' | 'no_effect' | 'negative' | 'confounded' | 'too_early'

export type DaySample = {
  date: string
  metric: number | null
  secondaryMetrics: Record<string, number | null>
  taken: boolean
  confounded: boolean
}

export type EffectStats = {
  meanOn: number
  meanOff: number
  absoluteChange: number
  percentChange: number | null
  effectSize: number
  direction: 'positive' | 'negative' | 'neutral'
  sampleOn: number
  sampleOff: number
}

export type CanonicalSupplement = {
  id: string
  name: string
  generic_name?: string | null
  category?: string | null
  primary_goals?: string[] | null
  mechanism_tags?: string[] | null
  pathway_summary?: string | null
}

export type TruthReport = {
  status: TruthStatus
  verdictTitle: string
  verdictLabel: string
  primaryMetricLabel: string
  effect: EffectStats
  confidence: {
    score: number
    label: 'high' | 'medium' | 'low'
    explanation: string
  }
  confoundsSummary: string
  mechanism: {
    label: string
    text: string
  }
  community: {
    sampleSize: number
    avgEffect: number | null
    userPercentile: number | null
    responderLabel: string | null
  }
  biologyProfile: string
  nextSteps: string
  scienceNote: string
  meta: {
    sampleOn: number
    sampleOff: number
    daysExcluded: number
    onsetDays: number | null
    generatedAt: string
  }
}




