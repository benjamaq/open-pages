// Barrels for the legacy Conditions (pattern recognition) system
// Non-invasive: re-export existing modules without moving code

export * from '@/lib/insights/computeInsights'
export * from '@/lib/insights/computeLifestyleEffectiveness'
export * from '@/lib/insights/computeSymptomPatterns'
export * from '@/lib/insights/computeExerciseCorrelation'
export * from '@/lib/insights/computeProtocolEffectiveness'

export { runCorrelationBatch, selectTodaysInsight } from '@/lib/insights/correlation-engine/batch-processor'
export { analyzeMedicationsForUser } from '@/lib/insights/correlation-engine/med-analyzer'
export { analyzeSymptomClusters } from '@/lib/insights/correlation-engine/symptom-analyzer'


