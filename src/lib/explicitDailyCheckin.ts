/**
 * Whether a daily_entries row reflects a user-initiated check-in (modal / cohort / mood),
 * as opposed to wearable import rows that often set only sleep_quality.
 */
export function dailyEntryIsExplicitUserCheckin(
  e: Record<string, unknown> | null | undefined,
): boolean {
  if (!e || typeof e !== 'object') return false
  const energy = (e as { energy?: unknown }).energy
  const focus = (e as { focus?: unknown }).focus
  const moodRaw = (e as { mood?: unknown }).mood
  const mentalClarity = (e as { mental_clarity?: unknown }).mental_clarity
  const calmness = (e as { calmness?: unknown }).calmness
  const onset = (e as { sleep_onset_bucket?: unknown }).sleep_onset_bucket
  const on = typeof onset === 'number' ? onset : Number(onset)
  const hasB2cSliders = typeof energy === 'number' && typeof focus === 'number'
  const hasCohortStudyFields =
    (typeof mentalClarity === 'number' &&
      mentalClarity >= 1 &&
      mentalClarity <= 10) ||
    (typeof calmness === 'number' && calmness >= 1 && calmness <= 10) ||
    (Number.isFinite(on) && on >= 1 && on <= 4)
  const hasMoodAnswer =
    typeof moodRaw === 'number' ||
    (typeof moodRaw === 'string' && moodRaw.trim() !== '')
  return hasB2cSliders || hasCohortStudyFields || hasMoodAnswer
}
