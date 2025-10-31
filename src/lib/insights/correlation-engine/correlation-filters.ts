import { VariableType, getVariableType } from './variable-types'
import type { CorrelationResult } from './types'

export enum InsightCategory {
  ACTIONABLE_HIGH_VALUE = 'actionable_high_value',
  INFORMATIVE = 'informative',
  META_INSIGHT = 'meta_insight',
  CIRCULAR = 'circular',
  INVALID = 'invalid'
}

export function categorizeCorrelation(result: CorrelationResult): InsightCategory {
  const var1Meta = getVariableType((result as any).variable1)
  const var2Meta = getVariableType((result as any).variable2)
  if (!var1Meta || !var2Meta) return InsightCategory.INVALID

  if (var1Meta.type === VariableType.INPUT && var2Meta.type === VariableType.OUTCOME && var1Meta.actionable) {
    return InsightCategory.ACTIONABLE_HIGH_VALUE
  }
  if (var1Meta.type === VariableType.INPUT && var2Meta.type === VariableType.OUTCOME && !var1Meta.actionable) {
    return InsightCategory.INFORMATIVE
  }
  if (var1Meta.type === VariableType.BOTH && var2Meta.type === VariableType.OUTCOME) {
    return InsightCategory.META_INSIGHT
  }
  if (var1Meta.type === VariableType.OUTCOME && var2Meta.type === VariableType.OUTCOME) {
    return InsightCategory.CIRCULAR
  }
  return InsightCategory.INVALID
}

export function shouldShowCorrelation(result: CorrelationResult): boolean {
  const category = categorizeCorrelation(result)
  if (category === InsightCategory.CIRCULAR || category === InsightCategory.INVALID) return false
  if (category === InsightCategory.ACTIONABLE_HIGH_VALUE) return true
  const d = (result as any).cohensD as number | undefined
  if ((category === InsightCategory.INFORMATIVE || category === InsightCategory.META_INSIGHT) && typeof d === 'number') {
    return d >= 0.8
  }
  return false
}


