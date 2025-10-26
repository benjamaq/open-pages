// Core types for the correlation engine

export type EffectSize = 'small' | 'moderate' | 'large'
export type Confidence = 'low' | 'medium' | 'high'

export type SplitStrategy =
  | { type: 'threshold'; value: number }
  | { type: 'median' }
  | { type: 'tertile' }

export interface DailyEntry {
  local_date: string
  pain?: number
  mood?: number
  sleep_quality?: number
  sleep_hours?: number
  night_wakes?: number
  exercise_minutes?: number
  tags?: string[]
  symptoms?: string[]
  meds?: Array<{ name: string; dose?: string; timing?: 'AM' | 'PM' | 'both' }>
}

export interface BaseCorrelationConfig {
  priority?: 'high' | 'normal' | 'low'
}

export interface TagCorrelationConfig extends BaseCorrelationConfig {
  type?: 'tag'
  tag: string
  metric: string
  lagDays?: number
  minDaysWithTag?: number
  minDaysWithoutTag?: number
  minDelta: number
}

export interface MetricCorrelationConfig extends BaseCorrelationConfig {
  type?: 'metric'
  metric1: string
  metric2: string
  splitStrategy: SplitStrategy
}

export interface BaseCorrelationResult {
  cohensD: number
  effectSize: EffectSize
  confidence: Confidence
  ciLow: number
  ciHigh: number
  pValue: number
  delta: number
  totalDays: number
}

export interface TagCorrelationResult extends BaseCorrelationResult {
  type: 'tag_correlation'
  tag: string
  metric: string
  lagDays: number
  avgWithTag: number
  avgWithoutTag: number
  nWith: number
  nWithout: number
}

export interface MetricCorrelationResult extends BaseCorrelationResult {
  type: 'metric_correlation'
  metric1: string
  metric2: string
  splitValue?: number
  avgHigh: number
  avgLow: number
  nHigh: number
  nLow: number
}

export type CorrelationResult = TagCorrelationResult | MetricCorrelationResult

export interface MedInsight {
  type: 'medication_effect'
  medName: string
  startDate: Date
  baselineDays: number
  postStartDays: number
  painBefore: number
  painAfter: number
  painDelta: number
  painEffectSize: number
  moodBefore: number
  moodAfter: number
  moodDelta: number
  moodEffectSize: number
  confidence: Confidence
}

export interface FormattedInsight {
  type: 'tag_correlation' | 'metric_correlation' | 'medication_effect' | 'symptom_cluster'
  priority: number
  title: string
  message: string
  actionable: string
  confidence: Confidence
  evidenceLink?: string
  insightKey: string
  data: any
  createdAt: Date
}


