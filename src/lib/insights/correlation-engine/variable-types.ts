export enum VariableType {
  OUTCOME = 'outcome',
  INPUT = 'input',
  BOTH = 'both'
}

export interface VariableMetadata {
  name: string
  type: VariableType
  category: 'metric' | 'tag' | 'supplement' | 'symptom'
  actionable: boolean
}

export const METRIC_TYPES: Record<string, VariableMetadata> = {
  pain: { name: 'pain', type: VariableType.OUTCOME, category: 'metric', actionable: false },
  mood: { name: 'mood', type: VariableType.OUTCOME, category: 'metric', actionable: false },
  energy: { name: 'energy', type: VariableType.OUTCOME, category: 'metric', actionable: false },
  sleep_quality: { name: 'sleep_quality', type: VariableType.BOTH, category: 'metric', actionable: false },
  sleep_hours: { name: 'sleep_hours', type: VariableType.INPUT, category: 'metric', actionable: true },
  night_wakes: { name: 'night_wakes', type: VariableType.INPUT, category: 'metric', actionable: false }
}

export const TAG_TYPES: Record<string, VariableMetadata> = {
  gluten: { name: 'gluten', type: VariableType.INPUT, category: 'tag', actionable: true },
  dairy: { name: 'dairy', type: VariableType.INPUT, category: 'tag', actionable: true },
  alcohol: { name: 'alcohol', type: VariableType.INPUT, category: 'tag', actionable: true },
  too_much_caffeine: { name: 'too_much_caffeine', type: VariableType.INPUT, category: 'tag', actionable: true },
  high_sugar: { name: 'high_sugar', type: VariableType.INPUT, category: 'tag', actionable: true },
  ate_clean: { name: 'ate_clean', type: VariableType.INPUT, category: 'tag', actionable: true },
  dehydrated: { name: 'dehydrated', type: VariableType.INPUT, category: 'tag', actionable: true },
  high_stress: { name: 'high_stress', type: VariableType.INPUT, category: 'tag', actionable: true },
  meditation: { name: 'meditation', type: VariableType.INPUT, category: 'tag', actionable: true },
  poor_sleep: { name: 'poor_sleep', type: VariableType.INPUT, category: 'tag', actionable: true },
  period: { name: 'period', type: VariableType.INPUT, category: 'tag', actionable: false },
  migraine: { name: 'migraine', type: VariableType.INPUT, category: 'tag', actionable: false }
}

export const SYMPTOM_TYPES: Record<string, VariableMetadata> = {
  fatigue: { name: 'fatigue', type: VariableType.OUTCOME, category: 'symptom', actionable: false },
  brain_fog: { name: 'brain_fog', type: VariableType.OUTCOME, category: 'symptom', actionable: false },
  headache: { name: 'headache', type: VariableType.OUTCOME, category: 'symptom', actionable: false }
}

export function getSupplementMetadata(name: string): VariableMetadata {
  return { name, type: VariableType.INPUT, category: 'supplement', actionable: true }
}

export function getVariableType(variable: string): VariableMetadata | null {
  return METRIC_TYPES[variable] || TAG_TYPES[variable] || SYMPTOM_TYPES[variable] || null
}


