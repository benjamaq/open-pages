import type { DailyEntry, CorrelationResult } from '../correlation-engine/types'

export function mean(data: number[]): number {
  const arr = data.filter((n) => Number.isFinite(n))
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function variance(data: number[]): number {
  const arr = data.filter((n) => Number.isFinite(n))
  if (arr.length <= 1) return 0
  const m = mean(arr)
  const sumSq = arr.reduce((acc, v) => acc + (v - m) * (v - m), 0)
  return sumSq / (arr.length - 1)
}

export function pooledStandardDeviation(group1: number[], group2: number[]): number {
  const n1 = group1.filter((n) => Number.isFinite(n)).length
  const n2 = group2.filter((n) => Number.isFinite(n)).length
  if (n1 <= 1 || n2 <= 1) return 0
  const v1 = variance(group1)
  const v2 = variance(group2)
  const pooledVar = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2)
  return pooledVar > 0 ? Math.sqrt(pooledVar) : 0
}

export function cohensD(group1: number[], group2: number[]): number {
  const m1 = mean(group1)
  const m2 = mean(group2)
  const sd = pooledStandardDeviation(group1, group2)
  if (sd === 0) return 0
  return Math.abs(m1 - m2) / sd
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (p <= 0) return sorted[0]
  if (p >= 100) return sorted[sorted.length - 1]
  const idx = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(idx)
  const upper = Math.ceil(idx)
  if (lower === upper) return sorted[lower]
  const weight = idx - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function isOutlier(value: number, data: number[]): boolean {
  const arr = data.filter((n) => Number.isFinite(n))
  if (arr.length < 4) return false
  const sorted = [...arr].sort((a, b) => a - b)
  const q1 = percentile(sorted, 25)
  const q3 = percentile(sorted, 75)
  const iqr = q3 - q1
  const low = q1 - 1.5 * iqr
  const high = q3 + 1.5 * iqr
  return value < low || value > high
}

export function winsorize(data: number[], p: number = 5): number[] {
  if (data.length === 0) return []
  const sorted = [...data].sort((a, b) => a - b)
  const lowThreshold = sorted[Math.floor((data.length * p) / 100)]
  const highThreshold = sorted[Math.ceil((data.length * (100 - p)) / 100) - 1]
  return data.map((x) => (x < lowThreshold ? lowThreshold : x > highThreshold ? highThreshold : x))
}

export function calculateMedian(data: number[]): number {
  if (data.length === 0) return 0
  const sorted = [...data].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export function calculateTertiles(data: number[]): [number, number] {
  if (data.length === 0) return [0, 0]
  const sorted = [...data].sort((a, b) => a - b)
  const low33 = percentile(sorted, 33.3333)
  const high67 = percentile(sorted, 66.6667)
  return [low33, high67]
}

export function bootstrapCI(
  group1: DailyEntry[],
  group2: DailyEntry[],
  metric: string,
  iterations: number = 1000
): { ciLow: number; ciHigh: number; pValue: number } {
  const g1 = group1.map((e) => (e as any)[metric]).filter((n: any) => Number.isFinite(n)) as number[]
  const g2 = group2.map((e) => (e as any)[metric]).filter((n: any) => Number.isFinite(n)) as number[]
  if (g1.length === 0 || g2.length === 0) return { ciLow: 0, ciHigh: 0, pValue: 1 }

  const observedDelta = mean(g1) - mean(g2)
  const deltas: number[] = []

  for (let i = 0; i < iterations; i++) {
    const sample1 = resample(g1)
    const sample2 = resample(g2)
    deltas.push(mean(sample1) - mean(sample2))
  }

  deltas.sort((a, b) => a - b)
  const ciLow = deltas[Math.floor(iterations * 0.025)]
  const ciHigh = deltas[Math.floor(iterations * 0.975)]
  const pValue = deltas.filter((d) => Math.sign(d) !== Math.sign(observedDelta)).length / iterations
  return { ciLow, ciHigh, pValue }
}

function resample<T>(array: T[]): T[] {
  if (array.length === 0) return []
  const out: T[] = []
  for (let i = 0; i < array.length; i++) {
    const idx = Math.floor(Math.random() * array.length)
    out.push(array[idx])
  }
  return out
}

export function applyFDR(results: CorrelationResult[], qValue: number = 0.1): CorrelationResult[] {
  if (!results || results.length === 0) return []
  const sorted = [...results].sort((a, b) => (a.pValue || 1) - (b.pValue || 1))
  const m = sorted.length
  let cutoffIndex = -1
  for (let i = 0; i < m; i++) {
    const p = sorted[i].pValue
    if (typeof p === 'number' && p <= ((i + 1) / m) * qValue) {
      cutoffIndex = i
    }
  }
  return cutoffIndex >= 0 ? sorted.slice(0, cutoffIndex + 1) : []
}


