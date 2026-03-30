'use client'

/**
 * Cohort-only daily check-in UI. Fields come from public.cohorts.checkin_fields (via /api/me).
 * Standard users never see this component.
 */

import { useEffect, useMemo, useState } from 'react'
import { getLocalDateYmd } from '@/lib/utils/localDateYmd'
import { normalizeCohortCheckinFields } from '@/lib/cohortCheckinFields'

export type CohortCheckinLayoutProps = {
  isOpen: boolean
  onClose: () => void
  onEnergyUpdate: (energy: number) => void
  userId: string
  /** From public.cohorts.checkin_fields; order preserved. */
  checkinFields?: string[] | null
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
}: CohortCheckinLayoutProps) {
  void _userId

  const fields = useMemo(() => normalizeCohortCheckinFields(checkinFieldsProp), [checkinFieldsProp])
  const [values, setValues] = useState<Record<string, number | null>>(() => buildInitialValues(fields))
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setValues(buildInitialValues(fields))
  }, [fields.join('|')])

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
      setMessage('✅ Check-in saved successfully!')
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('progress:refresh'))
        }
      } catch {}
      setTimeout(() => {
        setMessage('')
        onClose()
      }, 1200)
    } catch {
      setMessage('Failed to save check-in. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Daily Check-in (study)</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-5 sm:p-8 space-y-6">
          <p className="text-sm text-gray-600">Quick check-in for your cohort study. Takes about a minute.</p>

          {fields.map((fieldKey) => {
            if (fieldKey === 'sleep_onset_bucket') {
              const sleepOnsetBucket = values.sleep_onset_bucket ?? null
              return (
                <div key={fieldKey} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">Time to fall asleep</label>
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
              const nightWakes = values.night_wakes ?? null
              return (
                <div key={fieldKey} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">Times woken in the night</label>
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
              const label = SLIDER_LABELS[fieldKey] || fieldKey
              const v = typeof values[fieldKey] === 'number' ? (values[fieldKey] as number) : 5
              return (
                <div key={fieldKey} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900">{label}</label>
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

          {message && <p className="text-sm text-gray-800">{message}</p>}

          <button
            type="button"
            onClick={handleCohortSubmit}
            disabled={isSaving}
            className="w-full rounded-xl bg-gray-900 text-white py-3 font-semibold hover:bg-gray-800 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Save check-in'}
          </button>
        </div>
      </div>
    </div>
  )
}
