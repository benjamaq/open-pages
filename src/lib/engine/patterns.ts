import { DayRow, PatternType } from './types'

type DataPoint = { date: string; value: number }

/**
 * Detect the shape of the signal over time
 * Returns pattern type and confidence
 */
export function detectPattern(history: DataPoint[]): { 
  pattern: PatternType | null
  confidence: number 
} {
  if (history.length < 7) {
    return { pattern: null, confidence: 0 }
  }
  
  const values = history.map(h => h.value)
  
  // Pattern 1: Rapid plateau (deficiency correction)
  // Large improvement in first half, then stable
  if (values.length >= 14) {
    const midpoint = Math.floor(values.length / 2)
    const firstHalf = values.slice(0, midpoint)
    const secondHalf = values.slice(midpoint)
    
    const firstAvg = mean(firstHalf)
    const secondAvg = mean(secondHalf)
    const firstGrowth = (firstAvg - firstHalf[0]) / (firstHalf[0] || 1)
    const secondGrowth = Math.abs((secondAvg - firstHalf[midpoint - 1]) / (firstHalf[midpoint - 1] || 1))
    
    // Big jump early (>15%), then flat (<5% change)
    if (firstGrowth > 0.15 && secondGrowth < 0.05) {
      return { pattern: 'rapid_plateau', confidence: 0.8 }
    }
  }
  
  // Pattern 2: Slow linear (accumulation)
  // Steady consistent increase
  const regression = linearRegression(values)
  if (regression.slope > 0.02 && regression.r2 > 0.7) {
    return { pattern: 'slow_linear', confidence: regression.r2 }
  }
  
  // Pattern 3: Immediate spike (pharmacological)
  // Effect visible in first 3 days
  if (values.length >= 3) {
    const initialJump = (values[2] - values[0]) / (values[0] || 1)
    if (initialJump > 0.2) {
      return { pattern: 'immediate_spike', confidence: 0.75 }
    }
  }
  
  // Pattern 4: Cyclical (tolerance building)
  // Effect starts strong then declines
  if (values.length >= 14) {
    const firstQuarter = values.slice(0, Math.floor(values.length / 4))
    const lastQuarter = values.slice(-Math.floor(values.length / 4))
    const firstAvg = mean(firstQuarter)
    const lastAvg = mean(lastQuarter)
    
    // Started high, now declining
    if (firstAvg > lastAvg && (firstAvg - lastAvg) / firstAvg > 0.15) {
      return { pattern: 'cyclical', confidence: 0.7 }
    }
  }
  
  return { pattern: null, confidence: 0 }
}

/**
 * Generate human-readable explanation based on pattern
 */
export function explainPattern(
  pattern: PatternType | null, 
  supplementName: string,
  currentDay: number
): string {
  switch (pattern) {
    case 'rapid_plateau':
      return `${supplementName} corrected a likely deficiency. Your metrics improved rapidly in the first week, then plateaued. Your body reached optimal levels.`
    
    case 'slow_linear':
      return `${supplementName} shows gradual accumulation effect. Benefits are building steadily over time. Continue for full effect.`
    
    case 'immediate_spike':
      return `${supplementName} works quickly - fast-acting pharmacological effect. However, this may not be a long-term solution. Monitor for tolerance.`
    
    case 'cyclical':
      return `${supplementName} showed tolerance building. Effect was strong initially but is declining. Consider cycling off for 1-2 weeks to reset sensitivity.`
    
    default:
      return ''
  }
}

// Helper: Calculate mean
function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

// Helper: Linear regression
function linearRegression(values: number[]): { slope: number; r2: number } {
  const n = values.length
  if (n < 2) return { slope: 0, r2: 0 }
  
  const x = Array.from({ length: n }, (_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  // Calculate R²
  const yMean = sumY / n
  const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const ssResidual = values.reduce((sum, yi, i) => {
    const predicted = slope * i + intercept
    return sum + Math.pow(yi - predicted, 2)
  }, 0)
  
  const r2 = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal)
  
  return { slope, r2 }
}


