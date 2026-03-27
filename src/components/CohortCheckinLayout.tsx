'use client'

/**
 * Cohort-only daily check-in UI (e.g. SureSleep).
 * Activated when profiles.cohort_id IS NOT NULL — see DailyCheckinModal.
 * Does not alter the standard check-in component or API validation paths.
 */

import { useState } from 'react'

export type CohortCheckinLayoutProps = {
  isOpen: boolean
  onClose: () => void
  onEnergyUpdate: (energy: number) => void
  userId: string
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

export default function CohortCheckinLayout({
  isOpen,
  onClose,
  onEnergyUpdate,
  userId: _userId,
}: CohortCheckinLayoutProps) {
  void _userId
  const [sleepQuality, setSleepQuality] = useState(5)
  const [energy, setEnergy] = useState(5)
  const [sleepOnsetBucket, setSleepOnsetBucket] = useState<number | null>(null)
  const [nightWakes, setNightWakes] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  if (!isOpen) return null

  const handleCohortSubmit = async () => {
    setIsSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_quality: sleepQuality,
          energy,
          sleep_onset_bucket: sleepOnsetBucket,
          night_wakes: nightWakes,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean }
      if (!res.ok) {
        setMessage(typeof json?.error === 'string' ? `❗ ${json.error}` : '❗ Failed to save check-in')
        setIsSaving(false)
        return
      }
      onEnergyUpdate(energy)
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">How would you rate last night&apos;s sleep?</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={sleepQuality}
                onChange={(e) => setSleepQuality(Number(e.target.value))}
                className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
              />
              <span className="w-10 text-right text-sm font-medium text-gray-700">{sleepQuality}/10</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">How is your energy this morning?</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
                className="flex-1 h-3 rounded-lg appearance-none cursor-pointer bg-gray-300 min-w-0"
              />
              <span className="w-10 text-right text-sm font-medium text-gray-700">{energy}/10</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">How long did it take you to fall asleep?</label>
            <p className="text-xs text-gray-500">Optional</p>
            <div className="flex flex-wrap gap-2">
              {ONSET_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSleepOnsetBucket(o.value)}
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

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">How many times did you wake in the night?</label>
            <p className="text-xs text-gray-500">Optional</p>
            <div className="flex flex-wrap gap-2">
              {WAKES_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setNightWakes(o.value)}
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
