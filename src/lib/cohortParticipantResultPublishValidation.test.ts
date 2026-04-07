import assert from 'node:assert'
import { test } from 'node:test'
import { validateCohortParticipantResultJsonForPublish } from './cohortParticipantResultPublishValidation'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'

test('accepts valid publish payload with metrics aligned to check-in fields', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: ['sleep_quality', 'energy'],
    resultJson: {
      verdict: 'Improved',
      metrics: {
        sleep_quality: { baseline_avg: 3, final_avg: 7 },
        energy: { baseline: 2, final: 6 },
      },
    },
  })
  assert.strictEqual(r.ok, true)
})

test('rejects cohort id mismatch', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: B,
    cohortCheckinFieldsRaw: ['sleep_quality'],
    resultJson: { verdict: 'x' },
  })
  assert.strictEqual(r.ok, false)
  if (r.ok) throw new Error('expected failure')
  assert.ok(r.errors.some((e) => e.includes('must match')))
})

test('rejects unknown metric keys', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: ['sleep_quality'],
    resultJson: {
      verdict: 'ok',
      metrics: { not_a_real_metric: { baseline_avg: 1, final_avg: 2 } },
    },
  })
  assert.strictEqual(r.ok, false)
  if (r.ok) throw new Error('expected failure')
  assert.ok(r.errors.some((e) => e.includes('unknown metric key')))
})

test('rejects metric key not in cohort check-in fields', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: ['sleep_quality'],
    resultJson: {
      verdict: 'ok',
      metrics: {
        sleep_quality: { baseline_avg: 1, final_avg: 2 },
        focus: { baseline_avg: 1, final_avg: 2 },
      },
    },
  })
  assert.strictEqual(r.ok, false)
  if (r.ok) throw new Error('expected failure')
  assert.ok(r.errors.some((e) => e.includes('check-in fields')))
})

test('rejects metric object without baseline/final numbers', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: ['sleep_quality'],
    resultJson: {
      verdict: 'ok',
      metrics: { sleep_quality: { note: 'x' } },
    },
  })
  assert.strictEqual(r.ok, false)
  if (r.ok) throw new Error('expected failure')
  assert.ok(r.errors.some((e) => e.includes('baseline_avg')))
})

test('rejects non-object result_json', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: [],
    resultJson: [],
  })
  assert.strictEqual(r.ok, false)
})

test('rejects metrics array', () => {
  const r = validateCohortParticipantResultJsonForPublish({
    resultCohortId: A,
    participantCohortId: A,
    cohortCheckinFieldsRaw: ['sleep_quality'],
    resultJson: { verdict: 'x', metrics: [] },
  })
  assert.strictEqual(r.ok, false)
  if (r.ok) throw new Error('expected failure')
  assert.ok(r.errors.some((e) => e.includes('plain object')))
})
