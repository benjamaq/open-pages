/** Allowed cohort check-in field keys (config-driven via public.cohorts.checkin_fields). */

export const COHORT_CHECKIN_FIELD_KEYS = [
  'sleep_quality',
  'energy',
  'mood',
  'focus',
  'sleep_onset_bucket',
  'night_wakes',
] as const

export type CohortCheckinFieldKey = (typeof COHORT_CHECKIN_FIELD_KEYS)[number]

export const DEFAULT_COHORT_CHECKIN_FIELDS: string[] = [
  'sleep_quality',
  'energy',
  'sleep_onset_bucket',
  'night_wakes',
]

const ALLOW = new Set<string>(COHORT_CHECKIN_FIELD_KEYS as unknown as string[])

/** Normalize DB array; if empty/invalid after filter, return default SureSleep-style set. */
export function normalizeCohortCheckinFields(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_COHORT_CHECKIN_FIELDS]
  const out: string[] = []
  for (const x of raw) {
    const k = String(x ?? '').trim()
    if (ALLOW.has(k) && !out.includes(k)) out.push(k)
  }
  return out.length > 0 ? out : [...DEFAULT_COHORT_CHECKIN_FIELDS]
}

const LABELS: Record<string, string> = {
  sleep_quality: 'Sleep quality',
  energy: 'Morning energy',
  mood: 'Mood',
  focus: 'Focus',
  sleep_onset_bucket: 'Time to fall asleep',
  night_wakes: 'Times woken in the night',
}

/** Human label for cohort check-in field keys (dashboard copy). */
export function cohortCheckinFieldLabel(key: string): string {
  const k = String(key || '').trim()
  return LABELS[k] || k.replace(/_/g, ' ')
}
