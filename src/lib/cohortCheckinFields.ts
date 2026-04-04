/** Allowed cohort check-in field keys (config-driven via public.cohorts.checkin_fields). */

export const COHORT_CHECKIN_FIELD_KEYS = [
  'sleep_quality',
  'energy',
  'mood',
  'focus',
  'mental_clarity',
  'calmness',
  'sleep_onset_bucket',
  'night_wakes',
] as const

/** 1–10 sliders (excludes bucket fields). Used by API validation and cohort check-in UI. */
export const COHORT_CHECKIN_SLIDER_FIELD_KEYS = [
  'sleep_quality',
  'energy',
  'mood',
  'focus',
  'mental_clarity',
  'calmness',
] as const

const SLIDER_SET = new Set<string>(COHORT_CHECKIN_SLIDER_FIELD_KEYS as unknown as string[])

export function isCohortCheckinSliderField(key: string): boolean {
  return SLIDER_SET.has(String(key || '').trim())
}

/** Keys the cohort branch of /api/checkin may write to daily_entries (in cohortDePayload). */
export const COHORT_CHECKIN_UPSERT_KEYS = [
  ...COHORT_CHECKIN_SLIDER_FIELD_KEYS,
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
  mental_clarity: 'Mental clarity',
  calmness: 'Calmness',
  sleep_onset_bucket: 'Time to fall asleep',
  night_wakes: 'Times woken in the night',
}

/** Short helper lines under cohort slider labels (UI only). */
const DESCRIPTIONS: Record<string, string> = {
  mental_clarity: 'How clear and sharp did your thinking feel?',
  calmness: 'How calm and steady did you feel?',
}

export function cohortCheckinFieldDescription(key: string): string | null {
  const k = String(key || '').trim()
  return DESCRIPTIONS[k] ?? null
}

/** Human label for cohort check-in field keys (dashboard copy). */
export function cohortCheckinFieldLabel(key: string): string {
  const k = String(key || '').trim()
  return LABELS[k] || k.replace(/_/g, ' ')
}
