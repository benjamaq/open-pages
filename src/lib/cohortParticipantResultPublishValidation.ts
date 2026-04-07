import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'

/** Metric keys the result UI can render (`CohortParticipantResultView` / `parseResultMetrics`). */
export const COHORT_RESULT_RENDERER_METRIC_KEYS = new Set([
  'sleep_quality',
  'energy',
  'focus',
  'mood',
  'mental_clarity',
  'calmness',
  'night_wakes',
  'night_wake',
])

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(s: string): boolean {
  return UUID_RE.test(String(s || '').trim())
}

function recordField(obj: unknown): Record<string, unknown> | null {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj as Record<string, unknown>
  return null
}

function numLike(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

/** Same shape as `readBaselineFinal` in `CohortParticipantResultView`. */
function hasBaselineFinal(entry: Record<string, unknown>): boolean {
  const baseline =
    numLike(entry.baseline_avg) ??
    numLike(entry.baseline) ??
    numLike(entry.baselineAvg) ??
    numLike(entry.baseline_mean)
  const final =
    numLike(entry.final_avg) ?? numLike(entry.final) ?? numLike(entry.finalAvg) ?? numLike(entry.final_mean)
  return baseline != null || final != null
}

export type ValidateCohortParticipantResultPublishArgs = {
  /** `cohort_participant_results.cohort_id` */
  resultCohortId: string
  /** Must equal `resultCohortId` (e.g. from joined `cohort_participants`). */
  participantCohortId: string
  /** `cohorts.checkin_fields` raw from DB */
  cohortCheckinFieldsRaw: unknown
  resultJson: unknown
}

/**
 * Validates a payload before `status = 'published'` (or before manual publish via admin route).
 * Does not hit the DB — callers load cohort + participant rows and pass IDs + fields.
 */
export function validateCohortParticipantResultJsonForPublish(
  args: ValidateCohortParticipantResultPublishArgs,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  const rc = String(args.resultCohortId || '').trim()
  const pc = String(args.participantCohortId || '').trim()
  if (!isUuid(rc)) errors.push('result.cohort_id must be a valid UUID')
  if (!isUuid(pc)) errors.push('participant.cohort_id must be a valid UUID')
  if (rc && pc && rc !== pc) errors.push('result.cohort_id must match cohort_participants.cohort_id for this row')

  const root = recordField(args.resultJson)
  if (!root) {
    errors.push('result_json must be a JSON object')
    return { ok: false, errors }
  }
  if (root.metrics !== undefined && root.metrics !== null && !recordField(root.metrics)) {
    errors.push('result_json.metrics must be a plain object (not an array)')
  }

  const normalizedCheckin = normalizeCohortCheckinFields(args.cohortCheckinFieldsRaw)
  const cohortMetricKeysAllowed = new Set(
    normalizedCheckin.filter((k) => COHORT_RESULT_RENDERER_METRIC_KEYS.has(k)),
  )

  const metricsRoot = recordField(root.metrics)
  if (metricsRoot) {
    const keys = Object.keys(metricsRoot)
    if (keys.length === 0) {
      errors.push('result_json.metrics is present but empty')
    }
    for (const key of keys) {
      if (!COHORT_RESULT_RENDERER_METRIC_KEYS.has(key)) {
        errors.push(`result_json.metrics.${key}: unknown metric key (not supported by result UI)`)
        continue
      }
      if (!cohortMetricKeysAllowed.has(key)) {
        errors.push(
          `result_json.metrics.${key}: key is not in this cohort's check-in fields (misaligned cohort config)`,
        )
      }
      const sub = recordField(metricsRoot[key])
      if (!sub) {
        errors.push(`result_json.metrics.${key}: must be an object`)
        continue
      }
      if (!hasBaselineFinal(sub)) {
        errors.push(
          `result_json.metrics.${key}: need at least one of baseline_avg|final_avg|baseline|final (numeric)`,
        )
      }
    }
  }

  const hasVerdict =
    typeof root.verdict === 'string' && String(root.verdict).trim() !== ''
      ? true
      : typeof root.title === 'string' && String(root.title).trim() !== ''
  const hasBullets = Array.isArray(root.bullet_points) && (root.bullet_points as unknown[]).length > 0
  const hasEffect = root.effect_size != null || root.effectSize != null
  const hasMetrics = metricsRoot && Object.keys(metricsRoot).length > 0
  if (!hasVerdict && !hasBullets && !hasEffect && !hasMetrics) {
    errors.push(
      'result_json should include at least one of: verdict/title, bullet_points, effect_size, or non-empty metrics (matches current renderer expectations)',
    )
  }

  return errors.length ? { ok: false, errors } : { ok: true }
}
