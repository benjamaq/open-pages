'use client'

/**
 * Cohort-only daily check-in UI. Fields come from public.cohorts.checkin_fields (via /api/me).
 * Standard users never see this component.
 *
 * Validation note: Slider fields (sleep_quality, energy, etc.) default to 5 and are always sent;
 * optional bucket fields (sleep_onset_bucket, night_wakes) omit from the POST when unset.
 * The API requires slider fields present in cohort checkin_fields — there is no “unanswered slider” bug.
 */

import { useEffect, useMemo, useState } from 'react'
import { getLocalDateYmd } from '@/lib/utils/localDateYmd'
import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'

/** Confound tags for daily_entries.tags (same ids as standard check-in). */
const CONFOUND_TAGS: { id: string; label: string }[] = [
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'poor_sleep', label: 'Poor sleep' },
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

const SLIDER_LABELS: Record<string, string> = {
  sleep_quality: 'Sleep quality last night (1–10)',
  energy: 'Morning energy level (1–10)',
  mood: 'How is your mood?',
  focus: 'How is your focus?',
}

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
}: CohortCheckinLayoutProps) {
  void _userId

  const modalTitleProduct = String(cohortStudyProductName || '').trim() || 'Study'
  const modalTitle = `${modalTitleProduct} · Daily Check-in`

  const fields = useMemo(() => normalizeCohortCheckinFields(checkinFieldsProp), [checkinFieldsProp])
  const [values, setValues] = useState<Record<string, number | null>>(() => buildInitialValues(fields))
  const [selectedConfoundTags, setSelectedConfoundTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setValues(buildInitialValues(fields))
  }, [fields.join('|')])

  useEffect(() => {
    if (!isOpen) {
      setSaved(false)
      setMessage('')
      setSelectedConfoundTags([])
    }
  }, [isOpen])

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
        const first = fields.find((f) => ['sleep_quality', 'mood', 'focus'].includes(f))
        if (first && typeof values[first] === 'number') headerEnergy = values[first] as number
      }
      onEnergyUpdate(headerEnergy)
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('progress:refresh'))
          window.dispatchEvent(new Event('dashboard:refresh'))
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{modalTitle}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-5 sm:p-8">
          {saved ? (
            <div className="flex flex-col items-center justify-center text-center px-4 py-10 sm:py-14">
              <div style={{ color: '#639922', fontSize: '48px', lineHeight: 1 }} aria-hidden="true">
                ✓
              </div>
              <h3 className="mt-6 text-[20px] font-semibold text-gray-900">You&apos;re done for today.</h3>
              <p className="mt-3 text-sm text-gray-500">Your check-in has been saved.</p>
              <p className="mt-2 text-sm text-gray-500">See you tomorrow — keep going, every day counts.</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 w-full rounded-xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="mb-8 text-sm text-gray-600">Quick check-in for your cohort study. Takes about a minute.</p>

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
                      <p className="text-xs text-gray-500">Optional</p>
                      <div className="flex flex-wrap gap-2">
                        {ONSET_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setNum('sleep_onset_bucket', o.value)}
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
                      <p className="text-xs text-gray-500">Optional</p>
                      <div className="flex flex-wrap gap-2">
                        {WAKES_OPTIONS.map((o) => (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => setNum('night_wakes', o.value)}
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
                if (fieldKey === 'sleep_quality' || fieldKey === 'energy' || fieldKey === 'mood' || fieldKey === 'focus') {
                  step += 1
                  const k = step
                  const label = SLIDER_LABELS[fieldKey] || fieldKey
                  const v = typeof values[fieldKey] === 'number' ? (values[fieldKey] as number) : 5
                  return (
                    <div key={fieldKey} className="mb-8 space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        <StepPrefix n={k} />
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={v}
                          onChange={(e) => setNum(fieldKey, Number(e.target.value))}
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
                <h3 className="text-sm font-medium text-gray-900 mb-3">Anything unusual today? (optional)</h3>
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
                  Tag anything that might have affected your sleep — we&apos;ll exclude these days from your results.
                </p>
              </div>

              {message && <p className="mb-4 text-sm text-gray-800">{message}</p>}

              <button
                type="button"
                onClick={handleCohortSubmit}
                disabled={isSaving}
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
