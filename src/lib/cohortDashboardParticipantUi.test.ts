/**
 * Run: npx tsx --test src/lib/cohortDashboardParticipantUi.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveCohortDashboardParticipantUi } from './cohortDashboardParticipantUi'

describe('resolveCohortDashboardParticipantUi', () => {
  it('study_started_at implies post-compliance UI even when confirmed_at is missing', () => {
    const r = resolveCohortDashboardParticipantUi({
      participantStatus: 'confirmed',
      confirmedAtRaw: null,
      studyStartedAtIso: '2026-04-01T12:00:00.000Z',
      studyCompletedRaw: null,
      todayYmd: '2026-04-08',
    })
    assert.equal(r.legacyCohortConfirmed, false)
    assert.equal(r.cohortConfirmed, true)
    assert.equal(r.cohortAwaitingStudyStart, false)
  })

  it('future study_started_at keeps awaiting until calendar catches up', () => {
    const r = resolveCohortDashboardParticipantUi({
      participantStatus: 'confirmed',
      confirmedAtRaw: '2026-04-01T00:00:00.000Z',
      studyStartedAtIso: '2026-04-10T12:00:00.000Z',
      studyCompletedRaw: null,
      todayYmd: '2026-04-08',
    })
    assert.equal(r.cohortConfirmed, true)
    assert.equal(r.cohortAwaitingStudyStart, true)
  })

  it('study_completed_at clears awaiting', () => {
    const r = resolveCohortDashboardParticipantUi({
      participantStatus: 'confirmed',
      confirmedAtRaw: '2026-04-01T00:00:00.000Z',
      studyStartedAtIso: '2026-04-01T12:00:00.000Z',
      studyCompletedRaw: '2026-04-28T00:00:00.000Z',
      todayYmd: '2026-04-29',
    })
    assert.equal(r.cohortConfirmed, true)
    assert.equal(r.cohortAwaitingStudyStart, false)
  })
})
