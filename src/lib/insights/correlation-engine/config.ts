import type { TagCorrelationConfig, MetricCorrelationConfig } from './types'

export const LAG_ENABLED_TAGS = [
  'alcohol',
  'heavy_meal',
  'poor_sleep',
  'high_sugar',
  'gluten',
  'dairy',
  'new_med',
] as const

export const TYPE_PRIORITY = {
  medication_effect: 1,
  metric_correlation: 2,
  tag_correlation: 3,
  symptom_cluster: 4,
} as const

export const HIGH_PRIORITY_CORRELATIONS: Array<TagCorrelationConfig | MetricCorrelationConfig> = [
  // Metrics: Sleep Quality vs outcomes
  { type: 'metric', metric1: 'sleep_quality', metric2: 'pain', splitStrategy: { type: 'threshold', value: 7 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_quality', metric2: 'mood', splitStrategy: { type: 'threshold', value: 7 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_quality', metric2: 'sleep_quality', splitStrategy: { type: 'threshold', value: 7 }, priority: 'high' },

  // Sleep Hours vs outcomes
  { type: 'metric', metric1: 'sleep_hours', metric2: 'pain', splitStrategy: { type: 'threshold', value: 6 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_hours', metric2: 'mood', splitStrategy: { type: 'threshold', value: 6 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_hours', metric2: 'fatigue', splitStrategy: { type: 'threshold', value: 6 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_hours', metric2: 'brain_fog', splitStrategy: { type: 'threshold', value: 6 }, priority: 'high' },
  { type: 'metric', metric1: 'sleep_hours', metric2: 'irritability', splitStrategy: { type: 'threshold', value: 6 }, priority: 'high' },

  // Pain vs Mood
  { type: 'metric', metric1: 'pain', metric2: 'mood', splitStrategy: { type: 'tertile' }, priority: 'high' },

  // Exercise
  { type: 'metric', metric1: 'exercise_minutes', metric2: 'pain', splitStrategy: { type: 'median' }, priority: 'high' },
  { type: 'metric', metric1: 'exercise_minutes', metric2: 'mood', splitStrategy: { type: 'median' }, priority: 'high' },

  // Caffeine
  { type: 'tag', tag: 'too_much_caffeine', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'too_much_caffeine', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'too_much_caffeine', metric: 'anxiety', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'too_much_caffeine', metric: 'insomnia', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'too_much_caffeine', metric: 'headache', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'too_much_caffeine', metric: 'irritability', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Supplements
  { type: 'tag', tag: 'magnesium', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1.5, lagDays: 0, priority: 'high' },

  // Alcohol (with lag)
  { type: 'tag', tag: 'alcohol', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'alcohol', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'alcohol', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'alcohol', metric: 'brain_fog', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'alcohol', metric: 'insomnia', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'alcohol', metric: 'headache', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },

  // Stress
  { type: 'tag', tag: 'high_stress', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'anxiety', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'insomnia', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'headache', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'stomach_pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'muscle_pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'irritability', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_stress', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Poor Sleep tag
  { type: 'tag', tag: 'poor_sleep', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'poor_sleep', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'poor_sleep', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'poor_sleep', metric: 'brain_fog', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'poor_sleep', metric: 'irritability', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'poor_sleep', metric: 'headache', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Sugar
  { type: 'tag', tag: 'high_sugar', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'high_sugar', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_sugar', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_sugar', metric: 'brain_fog', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'high_sugar', metric: 'bloating', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Gluten
  { type: 'tag', tag: 'gluten', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'gluten', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'gluten', metric: 'bloating', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'gluten', metric: 'stomach_pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'gluten', metric: 'brain_fog', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'gluten', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },

  // Dairy
  { type: 'tag', tag: 'dairy', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'dairy', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'dairy', metric: 'bloating', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'dairy', metric: 'stomach_pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'dairy', metric: 'constipation', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'dairy', metric: 'diarrhea', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },

  // Dehydration
  { type: 'tag', tag: 'dehydrated', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'dehydrated', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'dehydrated', metric: 'headache', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'dehydrated', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'dehydrated', metric: 'brain_fog', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Period
  { type: 'tag', tag: 'period', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'period', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'period', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'period', metric: 'irritability', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'period', metric: 'bloating', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Flare-up / Migraine
  { type: 'tag', tag: 'flare_up', metric: 'pain', minDaysWithTag: 1, minDaysWithoutTag: 2, minDelta: 3, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'flare_up', metric: 'mood', minDaysWithTag: 1, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'migraine', metric: 'pain', minDaysWithTag: 1, minDaysWithoutTag: 2, minDelta: 3, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'migraine', metric: 'mood', minDaysWithTag: 1, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },

  // Positive practices
  { type: 'tag', tag: 'meditation', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'meditation', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'meditation', metric: 'anxiety', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'ate_clean', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'ate_clean', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Work deadline
  { type: 'tag', tag: 'work_deadline', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'work_deadline', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'work_deadline', metric: 'anxiety', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },
  { type: 'tag', tag: 'work_deadline', metric: 'insomnia', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 0, priority: 'high' },

  // Fast food
  { type: 'tag', tag: 'fast_food', metric: 'pain', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'fast_food', metric: 'mood', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 2, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'fast_food', metric: 'bloating', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
  { type: 'tag', tag: 'fast_food', metric: 'fatigue', minDaysWithTag: 2, minDaysWithoutTag: 2, minDelta: 1, lagDays: 1, priority: 'high' },
]

export function generateNormalPriorityConfigs(): Array<TagCorrelationConfig | MetricCorrelationConfig> {
  // Placeholder: will be expanded programmatically per spec
  return []
}

export function generateLowPriorityConfigs(): Array<TagCorrelationConfig | MetricCorrelationConfig> {
  // Placeholder: deep combos
  return []
}

export const FEATURE_FLAGS = {
  FDR_ENABLED: true,
  LAG_DETECTION_ENABLED: true,
  MED_TIMING_ENABLED: false,
  SYMPTOM_CLUSTERING_ENABLED: true,
}


