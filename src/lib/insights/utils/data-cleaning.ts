import type { DailyEntry } from '../correlation-engine/types'
import { isOutlier } from './statistics'

export function validateEntry(entry: DailyEntry): boolean {
  if (!entry || typeof entry.local_date !== 'string') return false
  // At least one numeric metric present
  const numericKeys = ['pain', 'mood', 'sleep_quality', 'sleep_hours', 'night_wakes', 'exercise_minutes']
  const hasNumeric = numericKeys.some((k) => typeof (entry as any)[k] === 'number')
  return hasNumeric
}

export function getValidEntries(entries: DailyEntry[], requiredFields: string[]): DailyEntry[] {
  return (entries || []).filter((e) => {
    if (!validateEntry(e)) return false
    for (const key of requiredFields) {
      const val = (e as any)[key]
      if (val == null || (typeof val !== 'number' && typeof val !== 'string' && !Array.isArray(val))) {
        return false
      }
    }
    return true
  })
}

export function filterOutliers(entries: DailyEntry[], metric: string): DailyEntry[] {
  const values = entries
    .map((e) => (e as any)[metric])
    .filter((v: any) => typeof v === 'number') as number[]
  if (values.length < 6) return entries
  return entries.filter((e) => {
    const val = (e as any)[metric]
    if (typeof val !== 'number') return false
    return !isOutlier(val, values)
  })
}


