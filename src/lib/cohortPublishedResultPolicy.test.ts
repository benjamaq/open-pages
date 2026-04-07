/**
 * Adversarial / isolation tests for multi-cohort result resolution policy.
 * Run: npx tsx --test src/lib/cohortPublishedResultPolicy.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickPublishedResultCohortId } from './cohortPublishedResultPolicy'

describe('pickPublishedResultCohortId', () => {
  const donotage = '11111111-1111-1111-1111-111111111111'
  const seeking = '22222222-2222-2222-2222-222222222222'

  it('Test A — profile prefers DoNotAge; only that cohort’s published row is eligible', () => {
    const id = pickPublishedResultCohortId({
      preferredCohortUuid: donotage,
      participantCohortIds: [donotage, seeking],
      cohortIdsWithPublishedResult: [donotage, seeking],
    })
    assert.equal(id, donotage)
  })

  it('Test A — profile prefers Seeking Health; only that cohort’s published row is eligible', () => {
    const id = pickPublishedResultCohortId({
      preferredCohortUuid: seeking,
      participantCohortIds: [donotage, seeking],
      cohortIdsWithPublishedResult: [donotage, seeking],
    })
    assert.equal(id, seeking)
  })

  it('Test B — ambiguous (two published, no profile cohort): fail closed', () => {
    const id = pickPublishedResultCohortId({
      preferredCohortUuid: null,
      participantCohortIds: [donotage, seeking],
      cohortIdsWithPublishedResult: [donotage, seeking],
    })
    assert.equal(id, null)
  })

  it('Test B — preferred cohort has no published row: do not fall back to another cohort', () => {
    const id = pickPublishedResultCohortId({
      preferredCohortUuid: seeking,
      participantCohortIds: [donotage, seeking],
      cohortIdsWithPublishedResult: [donotage],
    })
    assert.equal(id, null)
  })

  it('single participant cohort + one published + no profile: resolves that cohort', () => {
    const id = pickPublishedResultCohortId({
      preferredCohortUuid: null,
      participantCohortIds: [donotage],
      cohortIdsWithPublishedResult: [donotage],
    })
    assert.equal(id, donotage)
  })
})
