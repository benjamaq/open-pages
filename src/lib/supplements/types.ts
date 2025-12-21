export type EffectDirection = 'positive' | 'negative' | 'neutral' | 'unknown'

export type InsightState =
  | 'too_early'
  | 'collecting_baseline'
  | 'early_signal'
  | 'insights_ready'
  | 'inconsistent'
  | 'no_effect'
  | 'conflict_risk'

export interface SupplementCardData {
  id: string
  name: string
  doseDisplay: string
  purposes: string[]
  timeOfDayLabel?: string
  frequencyLabel?: string
  contextLabel?: string
  daysTrackedLastWindow: number
  daysRequiredForInsight: number
  lastCheckInDate?: string
  insightState: InsightState
  effectDirection: EffectDirection
  effectDimension?: string
  memberHasDeeperAnalysis: boolean
  hasTruthReport: boolean
  isMember: boolean
}

export function getProgressCopy(
  daysTracked: number,
  daysRequired: number
): { dayLabel: string; helper: string } {
  const req = (daysRequired ?? 0)
  const clamped = Math.max(0, Math.min(daysTracked ?? 0, req))
  const remaining = Math.max(0, req - clamped)
  const dayLabel = clamped === 0 ? 'Not started yet' : `Day ${clamped} of ${req}`
  if (clamped === 0) return { dayLabel, helper: 'Start checking in to see results' }
  if (remaining > 0)
    return { dayLabel, helper: `${remaining} day${remaining === 1 ? '' : 's'} until insights` }
  return { dayLabel, helper: 'Insights ready' }
}

export function getMicroStatus(data: SupplementCardData): string {
  const { insightState, effectDirection, effectDimension, name } = data
  switch (insightState) {
    case 'too_early':
    case 'collecting_baseline':
      return 'Too early — keep logging for a few more days.'
    case 'early_signal':
      if (effectDirection === 'positive')
        return `Early signal: ↑ ${effectDimension ?? 'benefit detected'}.`
      if (effectDirection === 'negative')
        return `Early signal: possible downside in ${effectDimension ?? 'your data'}.`
      return 'Early signal forming — needs more data.'
    case 'insights_ready':
      if (effectDirection === 'positive') return `${name} appears helpful so far.`
      if (effectDirection === 'negative')
        return `${name} may be hurting this area — worth reviewing.`
      return 'No clear effect detected yet.'
    case 'conflict_risk':
      return 'Possible timing or protocol conflict detected — review in your Truth Report.'
    case 'inconsistent':
      return 'Inconsistent check-ins — stay steady to get a clear answer.'
    case 'no_effect':
      return 'No meaningful effect detected in recent data.'
    default:
      return ''
  }
}

export function mapPurposeTag(tag?: string): string {
  if (!tag) return ''
  const t = tag.toLowerCase()
  const map: Record<string, string> = {
    sleep: 'Sleep',
    sleep_quality: 'Sleep',
    energy: 'Energy',
    stamina: 'Stamina',
    cognitive: 'Cognitive',
    focus: 'Focus',
    mood: 'Mood',
    stress: 'Stress',
    immunity: 'Immunity',
    gut: 'Gut Health',
    longevity: 'Longevity',
    athletic: 'Athletic Performance',
    'skin_hair_nails': 'Skin, Hair & Nails',
    joint: 'Joint & Bone'
  }
  return map[t] ?? tag
}


