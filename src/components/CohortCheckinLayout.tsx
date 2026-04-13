'use client'

/**
 * Cohort-only daily check-in UI. Fields come from public.cohorts.checkin_fields (via /api/me).
 * Standard users never see this component.
 *
 * Save is gated until every key in normalized `checkin_fields` is explicitly answered: sliders require
 * at least one interaction each (no silent default 5), bucket fields require a selection.
 */

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { getLocalDateYmd } from '@/lib/utils/localDateYmd'

const BASELINE_REQUIRED_DISTINCT_DAYS = 3
/** Last zero-based “open” count before the save that completes the 3rd baseline day. */
const BASELINE_FINAL_OPEN_COUNT = BASELINE_REQUIRED_DISTINCT_DAYS - 1

function cohortStudyClockHasBegunForUi(studyStartedAtIso: string | null | undefined): boolean {
  if (studyStartedAtIso == null) return false
  const raw = String(studyStartedAtIso).trim()
  if (!raw) return false
  const studyYmd = raw.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(studyYmd)) return false
  return studyYmd <= getLocalDateYmd()
}
import {
  cohortCheckinFieldDescription,
  cohortCheckinSliderHeading,
  isCohortCheckinSliderField,
  isSleepShapedCheckinFields,
  normalizeCohortCheckinFields,
} from '@/lib/cohortCheckinFields'

/**
 * Confound tags for cohort daily_entries.tags.
 * Omit poor_sleep here: sleep quality is the study outcome; B2C check-in still offers it in DailyCheckinModal.
 */
const CONFOUND_TAGS: { id: string; label: string }[] = [
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'high_stress', label: 'High stress' },
  { id: 'illness', label: 'Illness' },
  { id: 'travel', label: 'Travel' },
  { id: 'intense_exercise', label: 'Intense exercise' },
]

export type CohortCheckinLayoutProps = {
  isOpen: boolean
  onClose: () => void
  onEnergyUpdate: (energy: number) => void
  userId: string
  /** From public.cohorts.checkin_fields; order preserved. */
  checkinFields?: string[] | null
  /** Cohort product name from /api/me for modal title. */
  cohortStudyProductName?: string | null
  /**
   * From /api/me `cohortConfirmed`. When true, copy skips the 2-in-48h “confirm your place” framing.
   * When undefined, compliance-specific lines are omitted (safe fallback).
   */
  cohortSpotConfirmed?: boolean
  /**
   * From /api/me `cohortCheckinCount` while the spot is not yet confirmed (distinct compliance days).
   * Used only with `cohortSpotConfirmed === false` for intro + first-save success messaging.
   */
  cohortComplianceDistinctDays?: number | null
  /** From /api/me `cohortStudyStartedAtIso`. When the study clock has begun (local calendar), check-ins are study-phase. */
  cohortStudyStartedAtIso?: string | null
  /** From /api/me `cohortParticipantProductArrivedAt` (YYYY-MM-DD). When set, modal subtitle uses active-study copy. */
  cohortParticipantProductArrivedAtYmd?: string | null
  /** From /api/me `cohortStudyStartPending` — same active-study subtitle until first check-in applies the clock. */
  cohortStudyStartPending?: boolean
}

const ONSET_OPTIONS = [
  { value: 1 as const, label: 'Under 15 min' },
  { value: 2 as const, label: '15–30 min' },
  { value: 3 as const, label: '30–60 min' },
  { value: 4 as const, label: 'Over 60 min' },
]

const WAKES_OPTIONS = [
  { value: 0 as const, label: 'None' },
  { value: 1 as const, label: '1–2 times' },
  { value: 2 as const, label: '3 or more' },
]

const STEP_SPAN_STYLE = {
  fontSize: '14px',
  fontWeight: 600 as const,
  color: '#888',
  marginRight: '6px',
}

function StepPrefix({ n }: { n: number }) {
  return <span style={STEP_SPAN_STYLE}>{n}.</span>
}

function buildInitialValues(fieldList: string[]): Record<string, number | null> {
  const v: Record<string, number | null> = {}
  for (const f of fieldList) {
    if (f === 'sleep_onset_bucket' || f === 'night_wakes') v[f] = null
    else v[f] = 5
  }
  return v
}

export default function CohortCheckinLayout({
  isOpen,
  onClose,
  onEnergyUpdate,
  userId: _userId,
  checkinFields: checkinFieldsProp,
  cohortStudyProductName,
  cohortSpotConfirmed,
  cohortComplianceDistinctDays,
  cohortStudyStartedAtIso,
  cohortParticipantProductArrivedAtYmd = null,
  cohortStudyStartPending = false,
}: CohortCheckinLayoutProps) {
  void _userId
  const studyClockHasBegun = cohortStudyClockHasBegunForUi(cohortStudyStartedAtIso)

  const modalTitleProduct = String(cohortStudyProductName || '').trim() || 'Study'
  const modalTitle = `${modalTitleProduct} · Daily Check-in`

  const fields = useMemo(() => normalizeCohortCheckinFields(checkinFieldsProp), [checkinFieldsProp])
  const [values, setValues] = useState<Record<string, number | null>>(() => buildInitialValues(fields))
  /** Sliders start at 5 visually but save is blocked until the user moves each slider at least once. */
  const [sliderTouched, setSliderTouched] = useState<Record<string, boolean>>({})
  const [selectedConfoundTags, setSelectedConfoundTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)
  /** Snapshot when the form opens so post-save copy matches “first vs second” compliance check-in. */
  const [complianceDistinctDaysAtOpen, setComplianceDistinctDaysAtOpen] = useState<number | null>(null)

  const showCompliancePlaceCopy =
    cohortSpotConfirmed === false &&
    typeof cohortComplianceDistinctDays === 'number' &&
    cohortComplianceDistinctDays < 2

  const cohortCheckinComplete = useMemo(() => {
    for (const f of fields) {
      if (f === 'sleep_onset_bucket' || f === 'night_wakes') {
        const x = values[f]
        if (x === null || x === undefined) return false
        continue
      }
      if (isCohortCheckinSliderField(f)) {
        if (!sliderTouched[f]) return false
        const n = values[f]
        if (typeof n !== 'number' || Number.isNaN(n)) return false
      }
    }
    return true
  }, [fields, values, sliderTouched])

  useEffect(() => {
    setValues(buildInitialValues(fields))
    setSliderTouched({})
  }, [fields.join('|')])

  useEffect(() => {
    if (!isOpen) {
      setSaved(false)
      setMessage('')
      setSelectedConfoundTags([])
      setSliderTouched({})
      setComplianceDistinctDaysAtOpen(null)
    } else if (!saved) {
      setComplianceDistinctDaysAtOpen(
        typeof cohortComplianceDistinctDays === 'number' ? cohortComplianceDistinctDays : null,
      )
    }
  }, [isOpen, saved, cohortComplianceDistinctDays])

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(() => onClose(), 4000)
    return () => clearTimeout(t)
  }, [saved, onClose])

  if (!isOpen) return null

  const setNum = (key: string, n: number | null) => {
    setValues((prev) => ({ ...prev, [key]: n }))
  }

  const handleCohortSubmit = async () => {
    if (!cohortCheckinComplete) {
      setMessage('Complete every metric in this check-in before saving.')
      return
    }
    setIsSaving(true)
    setMessage('')
    try {
      const body: Record<string, unknown> = { local_date: getLocalDateYmd() }
      for (const f of fields) {
        if (f === 'sleep_onset_bucket' || f === 'night_wakes') {
          const x = values[f]
          if (x !== null && x !== undefined) body[f] = x
        } else {
          body[f] = values[f] ?? 5
        }
      }
      if (selectedConfoundTags.length > 0) {
        body.tags = [...selectedConfoundTags]
      }
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean }
      if (!res.ok) {
        setMessage(typeof json?.error === 'string' ? `❗ ${json.error}` : '❗ Failed to save check-in')
        setIsSaving(false)
        return
      }
      let headerEnergy = 5
      if (fields.includes('energy') && typeof values.energy === 'number') headerEnergy = values.energy
      else {
        const first = fields.find((f) => isCohortCheckinSliderField(f) && f !== 'energy')
        if (first && typeof values[first] === 'number') headerEnergy = values[first] as number
      }
      onEnergyUpdate(headerEnergy)
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('progress:refresh'))
          window.dispatchEvent(new Event('dashboard:refresh'))
        }
      } catch {}
      try {
        if (cohortSpotConfirmed === true) {
          if (studyClockHasBegun) {
            toast.success('Done for today.', {
              description: 'Come back tomorrow morning for your next check-in.',
            })
          } else if (
            typeof complianceDistinctDaysAtOpen === 'number' &&
            complianceDistinctDaysAtOpen === BASELINE_FINAL_OPEN_COUNT
          ) {
            toast.success('Baseline complete.', {
              description: "Nice work — you've finished your baseline.",
            })
          } else if (
            typeof complianceDistinctDaysAtOpen === 'number' &&
            (complianceDistinctDaysAtOpen === 0 || complianceDistinctDaysAtOpen === 1)
          ) {
            toast.success('Done for today.', {
              description: 'Come back tomorrow for your next baseline check-in.',
            })
          } else if (!studyClockHasBegun) {
            toast.success('Done for today.', { description: 'Your check-in has been saved.' })
          }
        }
      } catch {}
      setSaved(true)
    } catch {
      setMessage('Failed to save check-in. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  let step = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-3 sm:items-center sm:p-4">
      <div
        className={`bg-white rounded-2xl w-full max-h-[90vh] flex flex-col overflow-hidden ${
          saved ? 'max-w-md shadow-lg' : 'max-w-3xl shadow-2xl'
        }`}
      >
        <div
          className={`sticky top-0 flex items-center gap-2 border-b bg-white ${
            saved ? 'px-4 py-3' : 'px-5 py-4 sm:px-8 sm:py-6'
          }`}
        >
          <div className="w-9 shrink-0 sm:w-10" aria-hidden />
          <h2
            className={`flex-1 text-center font-bold text-gray-900 ${
              saved ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
            }`}
          >
            {modalTitle}
          </h2>
          <div className="flex w-9 shrink-0 justify-end sm:w-10">
            <button
              type="button"
              onClick={onClose}
              className={`text-gray-400 hover:text-gray-600 leading-none ${
                saved ? 'text-xl' : 'text-2xl'
              }`}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-white ${
            saved ? 'p-4 sm:p-5' : 'p-5 sm:p-8'
          }`}
        >
          {saved ? (
            <div className="flex flex-col items-center justify-center text-center px-2 py-4 sm:py-5">
              <div className="text-[#639922] text-3xl leading-none sm:text-[2rem]" aria-hidden="true">
                ✓
              </div>
              {cohortSpotConfirmed === false && complianceDistinctDaysAtOpen === 0 ? (
                <p className="mt-3 text-sm font-medium text-gray-900 leading-snug max-w-[280px]">
                  {isSleepShapedCheckinFields(fields)
                    ? 'First check-in complete. Come back tomorrow morning to confirm your place.'
                    : 'First check-in complete. Come back tomorrow to confirm your place.'}
                </p>
              ) : cohortSpotConfirmed === true && studyClockHasBegun ? (
                <>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">Done for today.</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-700 leading-snug max-w-[300px]">
                    Come back tomorrow morning for your next check-in.
                  </p>
                </>
              ) : cohortSpotConfirmed === true &&
                typeof complianceDistinctDaysAtOpen === 'number' &&
                complianceDistinctDaysAtOpen === BASELINE_FINAL_OPEN_COUNT ? (
                <>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">Baseline complete</h3>
                  <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-snug max-w-[300px]">
                    Nice work — you&apos;ve finished your baseline.
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-gray-700 leading-snug max-w-[300px]">
                    Your product is on the way.
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-snug max-w-[300px]">
                    As soon as it arrives, start checking in again so we can measure what changes.
                  </p>
                </>
              ) : cohortSpotConfirmed === true &&
                typeof complianceDistinctDaysAtOpen === 'number' &&
                (complianceDistinctDaysAtOpen === 0 || complianceDistinctDaysAtOpen === 1) ? (
                <>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">Done for today.</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-700 leading-snug max-w-[300px]">
                    Come back tomorrow for your next baseline check-in.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="mt-3 text-base font-semibold text-gray-900">Done for today.</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-snug max-w-[260px]">
                    Your check-in has been saved.
                    <span className="block mt-0.5">
                      {isSleepShapedCheckinFields(fields)
                        ? 'Come back tomorrow morning.'
                        : 'Come back tomorrow.'}
                    </span>
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-5 w-full max-w-[220px] rounded-lg bg-gray-900 text-white py-2.5 text-sm font-semibold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {showCompliancePlaceCopy ? (
                <p className="mb-4 max-w-xl mx-auto text-center text-base sm:text-lg font-bold leading-snug text-gray-900">
                  {cohortComplianceDistinctDays === 0
                    ? "Complete today's check-in and one more tomorrow to confirm your place."
                    : "Complete today's check-in to confirm your place."}
                </p>
              ) : null}
              <p className="mb-8 text-sm leading-relaxed text-gray-700">
                Answer as accurately as possible —{' '}
                {(cohortParticipantProductArrivedAtYmd != null &&
                  String(cohortParticipantProductArrivedAtYmd).trim() !== '') ||
                cohortStudyStartPending
                  ? "you're now in the active study phase."
                  : 'this is your baseline before starting the supplement.'}
              </p>

              {fields.map((fieldKey) => {
                if (fieldKey === 'sleep_onset_bucket') {
                  step += 1
                  const k = step
                  const sleepOnsetBucket = values.sleep_onset_bucket ?? null
                  return (
                    <div key={fieldKey} className="mb-8 space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        <StepPrefix n={k} />
                        Time to fall asleep
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {ONSET_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                              setNum('sleep_onset_bucket', o.value)
                            }}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                              sleepOnsetBucket === o.value
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                if (fieldKey === 'night_wakes') {
                  step += 1
                  const k = step
                  const nightWakes = values.night_wakes ?? null
                  return (
                    <div key={fieldKey} className="mb-8 space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        <StepPrefix n={k} />
                        Times woken in the night
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WAKES_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                              setNum('night_wakes', o.value)
                            }}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                              nightWakes === o.value
                                ? 'border-gray-900 bg-gray-900 text-white'
                                : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                }
                if (isCohortCheckinSliderField(fieldKey)) {
                  step += 1
                  const k = step
                  const label = cohortCheckinSliderHeading(fieldKey, fields)
                  const desc = cohortCheckinFieldDescription(fieldKey, fields)
                  const v = typeof values[fieldKey] === 'number' ? (values[fieldKey] as number) : 5
                  return (
                    <div key={fieldKey} className="mb-8 space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        <StepPrefix n={k} />
                        {label}
                      </label>
                      {desc ? <p className="text-xs text-gray-500">{desc}</p> : null}
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={v}
                          onChange={(e) => {
                            const n = Number(e.target.value)
                            setNum(fieldKey, n)
                            setSliderTouched((prev) => ({ ...prev, [fieldKey]: true }))
                          }}
                          className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
                        />
                        <span className="w-10 text-right text-sm font-medium text-gray-700">{v}/10</span>
                      </div>
                    </div>
                  )
                }
                return null
              })}

              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Anything unusual today?</h3>
                <div className="flex flex-wrap gap-2">
                  {CONFOUND_TAGS.map((factor) => (
                    <button
                      key={factor.id}
                      type="button"
                      onClick={() =>
                        setSelectedConfoundTags((prev) =>
                          prev.includes(factor.id) ? prev.filter((id) => id !== factor.id) : [...prev, factor.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedConfoundTags.includes(factor.id)
                          ? 'bg-gray-200 text-gray-900 border-gray-400'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {factor.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Tag anything that might have affected your scores — we&apos;ll exclude these days from your results.
                </p>
              </div>

              {!cohortCheckinComplete ? (
                <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
                  Complete every metric in this check-in before saving.
                </p>
              ) : null}
              {message && <p className="mb-4 text-sm text-gray-800">{message}</p>}

              <button
                type="button"
                onClick={handleCohortSubmit}
                disabled={isSaving || !cohortCheckinComplete}
                className="mt-2 w-full rounded-xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800 disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save check-in'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
