/** Allowed cohort check-in field keys (config-driven via public.cohorts.checkin_fields). */

/** Cognitive stack with no schema changes: stored in daily_entries, valid in /api/checkin, renderable in result UI when `result_json.metrics` uses the same keys. */
export const RECOMMENDED_COGNITIVE_CHECKIN_FIELDS_3: readonly string[] = ['focus', 'energy', 'mental_clarity']

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

/** Normalize DB array; if empty/invalid after filter, return default cohort check-in set. */
export function normalizeCohortCheckinFields(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_COHORT_CHECKIN_FIELDS]
  const out: string[] = []
  for (const x of raw) {
    const k = String(x ?? '').trim()
    if (ALLOW.has(k) && !out.includes(k)) out.push(k)
  }
  return out.length > 0 ? out : [...DEFAULT_COHORT_CHECKIN_FIELDS]
}

/** True when normalized `checkin_fields` include sleep-night signals (config-only; no slug/brand). */
export function isSleepShapedCheckinFields(normalizedKeys: string[]): boolean {
  return normalizedKeys.some(
    (f) => f.includes('sleep') || f === 'night_wakes' || f === 'sleep_onset_bucket',
  )
}

/**
 * Cognitive-outcome study page: not sleep-shaped, but includes cognitive anchors from `checkin_fields`.
 */
export function isCognitiveShapedCheckinFields(normalizedKeys: string[]): boolean {
  if (isSleepShapedCheckinFields(normalizedKeys)) return false
  return normalizedKeys.some((f) => f === 'focus' || f === 'mental_clarity')
}

const LABELS: Record<string, string> = {
  sleep_quality: 'Sleep quality',
  /** Sleep-shaped cohorts only; cognitive cohorts override via `cohortCheckinFieldLabel(…, normalized)`. */
  energy: 'Morning energy',
  mood: 'Mood',
  focus: 'Focus',
  mental_clarity: 'Mental clarity',
  calmness: 'Calmness',
  sleep_onset_bucket: 'Time to fall asleep',
  night_wakes: 'Times woken in the night',
}

/** Non-sleep (cognitive-style) check-in: same DB keys, customer-facing copy for Optimal Focus–style cohorts. */
const COGNITIVE_UI_LABELS: Partial<Record<string, string>> = {
  focus: 'Focus',
  energy: 'Mental energy and alertness',
  mental_clarity: 'Mental clarity',
}

/** Prompts under sliders — cognitive / non-sleep cohorts only (no sleep or “morning energy” framing). */
const COGNITIVE_FIELD_PROMPTS: Partial<Record<string, string>> = {
  focus: 'How well were you able to concentrate today?',
  energy: 'How mentally alert and switched-on did you feel today?',
  mental_clarity: 'How clear and sharp did your thinking feel today?',
}

/** Short helper for calmness (either cohort shape). */
const CALMNESS_PROMPT = 'How calm and steady did you feel?'

/**
 * Human label for cohort check-in field keys.
 * Pass `normalizedCheckinFields` from `cohorts.checkin_fields` (normalized) so cognitive cohorts get
 * “Mental energy and alertness” for `energy` while sleep-shaped cohorts keep “Morning energy”.
 */
export function cohortCheckinFieldLabel(key: string, normalizedCheckinFields?: string[] | null): string {
  const k = String(key || '').trim()
  if (normalizedCheckinFields && normalizedCheckinFields.length > 0 && !isSleepShapedCheckinFields(normalizedCheckinFields)) {
    const c = COGNITIVE_UI_LABELS[k]
    if (c) return c
  }
  return LABELS[k] || k.replace(/_/g, ' ')
}

/**
 * Helper line under slider labels (UI only). Cognitive cohorts get outcome-focused prompts; sleep cohorts
 * typically omit prompts except calmness.
 */
export function cohortCheckinFieldDescription(key: string, normalizedCheckinFields?: string[] | null): string | null {
  const k = String(key || '').trim()
  if (k === 'calmness') return CALMNESS_PROMPT
  if (normalizedCheckinFields && normalizedCheckinFields.length > 0 && !isSleepShapedCheckinFields(normalizedCheckinFields)) {
    return COGNITIVE_FIELD_PROMPTS[k] ?? null
  }
  return null
}

/**
 * Primary heading above a 1–10 slider in `CohortCheckinLayout`. Sleep cohorts keep legacy lines
 * (e.g. “Sleep quality last night”); cognitive cohorts use shape-aware labels + scale.
 */
export function cohortCheckinSliderHeading(key: string, normalizedCheckinFields: string[]): string {
  const k = String(key || '').trim()
  if (!isCohortCheckinSliderField(k)) return k
  if (isSleepShapedCheckinFields(normalizedCheckinFields)) {
    if (k === 'sleep_quality') return 'Sleep quality last night (1–10)'
    if (k === 'energy') return 'Morning energy level (1–10)'
    if (k === 'mood') return 'How is your mood?'
    if (k === 'focus') return 'How is your focus?'
    if (k === 'mental_clarity') return 'Mental clarity (1–10)'
    if (k === 'calmness') return 'Calmness (1–10)'
    return `${cohortCheckinFieldLabel(k, normalizedCheckinFields)} (1–10)`
  }
  return `${cohortCheckinFieldLabel(k, normalizedCheckinFields)} (1–10)`
}

/** Slider keys that can appear on the public study “outcomes” strip (non-sleep). Order follows cohort config. */
const STUDY_PAGE_COGNITIVE_STRIP_KEYS = new Set(['focus', 'energy', 'mental_clarity', 'mood', 'calmness'])

const STUDY_PAGE_COGNITIVE_LINE: Partial<Record<string, string>> = {
  focus: 'See how your focus trends from your first check-in to your last.',
  energy: 'See how your mental energy and alertness change across the study.',
  mental_clarity: 'See how sharp and clear your thinking feels across the study.',
  mood: 'See how your mood shifts day by day.',
  calmness: 'Track how calm and steady you feel over time.',
}

/**
 * Up to three outcome rows for the cognitive branch of the study landing “How it works” strip.
 * Order matches `checkin_fields` after normalization.
 */
export function cognitiveOutcomeStripForStudyPage(normalizedKeys: string[]): { title: string; line: string }[] {
  const rows: { title: string; line: string }[] = []
  for (const k of normalizedKeys) {
    if (!STUDY_PAGE_COGNITIVE_STRIP_KEYS.has(k)) continue
    const line = STUDY_PAGE_COGNITIVE_LINE[k]
    if (!line) continue
    const title = cohortCheckinFieldLabel(k, normalizedKeys)
    rows.push({ title, line })
    if (rows.length >= 3) break
  }
  return rows
}
