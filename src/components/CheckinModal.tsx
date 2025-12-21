'use client'

import { useEffect, useState } from 'react'
import { CheckinSuccessModal } from './checkin/CheckinSuccessModal'
import type { UserContext } from '@/lib/types'

interface CheckinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CheckinModal({ isOpen, onClose, onSuccess }: CheckinModalProps) {
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [focus, setFocus] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successCtx, setSuccessCtx] = useState<UserContext | null>(null)
  const [noise, setNoise] = useState<string[]>(['clean_day'])
  const [submittedNoise, setSubmittedNoise] = useState<string[] | null>(null)
  const [suppList, setSuppList] = useState<Array<{ id: string; name: string }>>([])
  const [suppIntake, setSuppIntake] = useState<Record<string, boolean>>({})
  const toggleNoise = (value: string, enabled: boolean) => {
    setNoise((prev) => toggleNoiseValue(prev, value, enabled))
  }

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const r = await fetch('/api/supplements', { cache: 'no-store' })
        if (!r.ok) return
        const arr = await r.json()
        const mapped = Array.isArray(arr) ? arr.map((s: any) => ({ id: String(s.id), name: String(s.name || 'Supplement') })) : []
        setSuppList(mapped)
        // Default: checked (taken)
        const def: Record<string, boolean> = {}
        for (const s of mapped) def[s.id] = true
        // Fetch skip suggestions and uncheck suggested items
        try {
          const sug = await fetch('/api/suggestions/dailySkip', { cache: 'no-store' })
          if (sug.ok) {
            const j = await sug.json()
            const suggestions = Array.isArray(j?.suggestions) ? j.suggestions : []
            // eslint-disable-next-line no-console
            console.log('[checkin] dailySkip suggestions:', suggestions)
            const idsToUncheck = new Set<string>(suggestions.map((x: any) => String(x.id)))
            for (const id of idsToUncheck) {
              if (def.hasOwnProperty(id)) def[id] = false
            }
          }
        } catch {}
        setSuppIntake(def)
      } catch {}
    })()
  }, [isOpen])

  async function handleSubmit() {
    if (isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      // Debug logs
      // eslint-disable-next-line no-console
      console.log('Submitting check-in...', { mood, energy, focus, noise })

      const intakeObj: Record<string, string> = {}
      Object.entries(suppIntake).forEach(([id, taken]) => {
        intakeObj[id] = taken ? 'taken' : 'skipped'
      })

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mood,
          energy,
          focus,
          tags: noise.includes('clean_day') ? [] : noise,
          supplement_intake: intakeObj
        })
      })

      // eslint-disable-next-line no-console
      console.log('Response status:', response.status)
      let data: any = null
      try {
        data = await response.json()
        // eslint-disable-next-line no-console
        console.log('Response data:', data)
      } catch {
        // eslint-disable-next-line no-console
        console.log('No JSON body in response')
      }

      if (!response.ok) {
        const message = (data && data.error) ? data.error : 'Check-in failed'
        throw new Error(message)
      }

      // Load Elli context and show success modal
      try {
        const ctxRes = await fetch('/api/elli/context', { cache: 'no-store', credentials: 'include' })
        if (ctxRes.ok) {
          const ctx = await ctxRes.json()
          setSubmittedNoise(noise.includes('clean_day') ? [] : noise)
          setSuccessCtx(ctx)
          setShowSuccess(true)
        } else {
          try { onSuccess() } catch {}
          try { onClose() } catch {}
        }
      } catch {
        try { onSuccess() } catch {}
        try { onClose() } catch {}
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit check-in'
      setError(msg)
      // eslint-disable-next-line no-alert
      alert('❌ Failed: ' + msg)
      // eslint-disable-next-line no-console
      console.error('Check-in error:', e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && !showSuccess) return null

  return (
    <>
    {isOpen && (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal container - full screen on mobile, centered on larger screens */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center">
        <div className="w-full h-[100dvh] sm:h-auto sm:max-w-lg bg-white sm:rounded-xl shadow-xl sm:m-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Daily Check-in</h2>
              <p className="text-xs text-gray-500">Rate how you feel today</p>
            </div>
            <button
              className="text-sm text-gray-600 hover:text-gray-900"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Close
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            <RatingSlider
              label="Mood"
              value={mood}
              onChange={setMood}
              leftHint="😟 Poor"
              rightHint="😊 Excellent"
            />

            <RatingSlider
              label="Energy"
              value={energy}
              onChange={setEnergy}
              leftHint="🔋 Drained"
              rightHint="⚡ Energized"
            />

            <RatingSlider
              label="Focus"
              value={focus}
              onChange={setFocus}
              leftHint="😵 Scattered"
              rightHint="🎯 Laser sharp"
            />

            {/* Noise events */}
            <div className="space-y-2">
              <div>
                <div className="text-sm font-medium text-gray-900">Anything unusual today?</div>
                <div className="text-xs text-gray-500">Helps us filter noise from your results</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NoiseCheckbox
                  label="🍷 Alcohol"
                  value="alcohol"
                  checked={noise.includes('alcohol')}
                  onChange={(v) => toggleNoise('alcohol', v)}
                />
                <NoiseCheckbox
                  label="✈️ Travel / timezone change"
                  value="travel"
                  checked={noise.includes('travel')}
                  onChange={(v) => toggleNoise('travel', v)}
                />
                <NoiseCheckbox
                  label="🤒 Feeling sick"
                  value="illness"
                  checked={noise.includes('illness')}
                  onChange={(v) => toggleNoise('illness', v)}
                />
                <NoiseCheckbox
                  label="😰 High stress day"
                  value="high_stress"
                  checked={noise.includes('high_stress')}
                  onChange={(v) => toggleNoise('high_stress', v)}
                />
                <NoiseCheckbox
                  label="😴 Very poor sleep (under 5 hours)"
                  value="poor_sleep"
                  checked={noise.includes('poor_sleep')}
                  onChange={(v) => toggleNoise('poor_sleep', v)}
                />
                <NoiseCheckbox
                  label="🏋️ Intense exercise / overtraining"
                  value="intense_exercise"
                  checked={noise.includes('intense_exercise')}
                  onChange={(v) => toggleNoise('intense_exercise', v)}
                />
                <NoiseCheckbox
                  label="🆕 Started a new supplement this week"
                  value="new_supplement"
                  checked={noise.includes('new_supplement')}
                  onChange={(v) => toggleNoise('new_supplement', v)}
                />
                <NoiseCheckbox
                  label="✅ Nothing unusual"
                  value="clean_day"
                  checked={noise.includes('clean_day')}
                  onChange={(v) => {
                    if (v) setNoise(['clean_day'])
                    else setNoise([])
                  }}
                />
              </div>
            </div>

          {/* Supplement intake selection */}
          <div className="space-y-2">
            <div>
              <div className="text-sm font-medium text-gray-900">Which supplements did you take today?</div>
              <div className="text-xs text-gray-500">Uncheck any you skipped today. This helps us build ON/OFF comparisons.</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suppList.length === 0 ? (
                <div className="text-sm text-gray-500">No active supplements yet.</div>
              ) : (
                suppList.map(s => (
                  <label key={s.id} className="inline-flex items-center gap-2 text-sm text-gray-800 p-2 rounded-md">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={!!suppIntake[s.id]}
                      onChange={(e) => setSuppIntake(prev => ({ ...prev, [s.id]: e.target.checked }))}
                    />
                    <span className="break-keep">{s.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3 flex items-center justify-end gap-2">
            <button
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Check-in'}
            </button>
          </div>
        </div>
      </div>
    </div>
    )}
    {showSuccess && successCtx && (
      <CheckinSuccessModal
        context={successCtx}
        noiseTags={submittedNoise || undefined}
        onClose={() => {
          setShowSuccess(false)
          try { onSuccess() } catch {}
          try { onClose() } catch {}
        }}
      />
    )}
    </>
  )
}

function RatingSlider({
  label,
  value,
  onChange,
  leftHint,
  rightHint
}: {
  label: string
  value: number
  onChange: (v: number) => void
  leftHint: string
  rightHint: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        <span className="text-xs text-gray-600">{value}/5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      <div className="flex justify-between text-sm text-gray-500 mt-1">
        <span>{leftHint}</span>
        <span>{rightHint}</span>
      </div>
    </div>
  )
}

export default CheckinModal

// Success modal overlay
// Render after component so it sits above
// eslint-disable-next-line react/display-name
export function CheckinModalOverlay(props: any) { return null }

function NoiseCheckbox({
  label,
  value,
  checked,
  onChange
}: {
  label: string
  value: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-800 p-2 rounded-md">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="break-keep">{label}</span>
    </label>
  )
}

function toggleNoiseValue(arr: string[], value: string, enabled: boolean): string[] {
  const set = new Set(arr)
  if (enabled) {
    set.delete('clean_day')
    set.add(value)
  } else {
    set.delete(value)
  }
  return Array.from(set)
}

function toggleNoiseHelper(setter: (v: string[]) => void, current: string[], value: string, enabled: boolean) {
  setter(toggleNoiseValue(current, value, enabled))
}

function toggleNoise(this: any, value: string, enabled: boolean) {
  // placeholder for TS; replaced inline
}


