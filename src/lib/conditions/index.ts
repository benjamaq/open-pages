// Barrels for the legacy Conditions (pattern recognition) system
// Non-invasive: re-export existing modules without moving code

export * from '@/lib/insights/computeInsights'
export { type LifestyleFactor, type LifestyleEffectiveness, computeLifestyleEffectiveness, generateLifestyleInsight } from '@/lib/insights/computeLifestyleEffectiveness'
export { type SymptomDescriptor, type SymptomPattern, computeSymptomPattern, generateSymptomInsight } from '@/lib/insights/computeSymptomPatterns'
export { computeExerciseCorrelation, computeExerciseTypeCorrelation, generateExerciseInsight } from '@/lib/insights/computeExerciseCorrelation'
export { type ProtocolDescriptor, type ProtocolEffectiveness, computeProtocolEffectiveness, generateProtocolInsight } from '@/lib/insights/computeProtocolEffectiveness'

export { runCorrelationBatch, selectTodaysInsight } from '@/lib/insights/correlation-engine/batch-processor'
export { analyzeMedicationsForUser } from '@/lib/insights/correlation-engine/med-analyzer'
export { analyzeSymptomClusters } from '@/lib/insights/correlation-engine/symptom-analyzer'


