/**
 * Run: npx tsx --test src/lib/cohortShippingExportNames.test.ts
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  namesFromAuthAndProfileForShippingCsv,
  splitFullNameOnFirstSpace,
} from './cohortShippingExportNames'

describe('splitFullNameOnFirstSpace', () => {
  it('splits on first space; rest is last name', () => {
    assert.deepEqual(splitFullNameOnFirstSpace('Mary Jane Watson'), {
      first: 'Mary',
      last: 'Jane Watson',
    })
  })
  it('single token → last empty', () => {
    assert.deepEqual(splitFullNameOnFirstSpace('Madonna'), { first: 'Madonna', last: '' })
  })
})

describe('namesFromAuthAndProfileForShippingCsv', () => {
  it('uses display_name when auth has only first_name in metadata (regression)', () => {
    const r = namesFromAuthAndProfileForShippingCsv(
      { first_name: 'Tetyana' },
      'Tetyana Smith',
      null,
    )
    assert.deepEqual(r, { first: 'Tetyana', last: 'Smith' })
  })

  it('uses both metadata names when present', () => {
    const r = namesFromAuthAndProfileForShippingCsv(
      { first_name: 'A', last_name: 'B' },
      'Ignored Full Name',
      null,
    )
    assert.deepEqual(r, { first: 'A', last: 'B' })
  })

  it('prefers display_name over metadata full string for split', () => {
    const r = namesFromAuthAndProfileForShippingCsv(
      { full_name: 'Auth Full', first_name: 'Auth' },
      'Profile Display Name',
      null,
    )
    assert.deepEqual(r, { first: 'Profile', last: 'Display Name' })
  })

  it('falls back to profile first_name only when nothing else', () => {
    const r = namesFromAuthAndProfileForShippingCsv({}, null, 'Solo')
    assert.deepEqual(r, { first: 'Solo', last: '' })
  })

  it('metadata last_name only when no combined string', () => {
    const r = namesFromAuthAndProfileForShippingCsv({ last_name: 'Doe' }, '', null)
    assert.deepEqual(r, { first: '', last: 'Doe' })
  })
})
