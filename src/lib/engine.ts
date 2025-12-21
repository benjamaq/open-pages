'use client'

export type Mood = 'low' | 'ok' | 'sharp'

export function encodeMood(mood: Mood): number {
  return mood === 'low' ? -1 : mood === 'sharp' ? 1 : 0
}

export type DayPoint = { date: string; mood: Mood; treated: boolean }

export function computeEffectPct(days: DayPoint[]): { effectPct: number; n: number } {
  const treatedVals = days.filter(d => d.treated).map(d => encodeMood(d.mood))
  const controlVals = days.filter(d => !d.treated).map(d => encodeMood(d.mood))
  const n = treatedVals.length
  if (n === 0 || controlVals.length === 0) return { effectPct: 0, n: 0 }
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  const delta = mean(treatedVals) - mean(controlVals) // in [-2..2]
  const pct = Math.round((Math.max(-2, Math.min(2, delta)) / 2) * 100)
  return { effectPct: pct, n }
}

export function estimateConfidence(treatedVals: number[], controlVals: number[]): number {
  // Welch's t-approximation → p → confidence
  if (treatedVals.length < 2 || controlVals.length < 2) return 0
  const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
  const variance = (a: number[], m = mean(a)) => a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1)
  const mt = mean(treatedVals)
  const mc = mean(controlVals)
  const vt = variance(treatedVals, mt)
  const vc = variance(controlVals, mc)
  const nt = treatedVals.length
  const nc = controlVals.length
  const t = (mt - mc) / Math.sqrt(vt / nt + vc / nc)
  // Convert |t| to approximate p using survival function for normal as a fallback
  const z = Math.abs(t)
  const p = 2 * (1 - approxStdNormalCdf(z))
  const conf = Math.max(0, Math.min(100, Math.round((1 - p) * 100)))
  return conf
}

function approxStdNormalCdf(x: number): number {
  // Abramowitz and Stegun approximation
  const t = 1 / (1 + 0.2316419 * x)
  const d = 0.3989423 * Math.exp(-x * x / 2)
  const p = d * (0.3193815 * t - 0.3565638 * Math.pow(t, 2) + 1.781478 * Math.pow(t, 3) - 1.821256 * Math.pow(t, 4) + 1.330274 * Math.pow(t, 5))
  return 1 - p
}

export async function computeSignalForSupplement(
  supplementId: string,
  getWindowDays: (supplementId: string, window: '30d'|'90d') => Promise<DayPoint[]>,
  window: '30d'|'90d' = '30d'
): Promise<{ n: number; effectPct: number; confidence: number; window: '30d'|'90d' }> {
  const days = await getWindowDays(supplementId, window)
  const { effectPct, n } = computeEffectPct(days)
  const treatedVals = days.filter(d => d.treated).map(d => encodeMood(d.mood))
  const controlVals = days.filter(d => !d.treated).map(d => encodeMood(d.mood))
  const confidence = estimateConfidence(treatedVals, controlVals)
  return { n, effectPct, confidence, window }
}


