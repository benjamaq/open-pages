'use client'
import { useState } from 'react'
import { toast } from 'sonner'

type Props = {
  onComplete?: (data: { mood: 1|2|3; energy: 1|2|3; focus: 1|2|3 }) => void
  inline?: boolean
}

export default function QuickCheckin({ onComplete, inline = false }: Props) {
  const [energy, setEnergy] = useState<1|2|3|null>(null)
  const [mood, setMood] = useState<1|2|3|null>(null)
  const [focus, setFocus] = useState<1|2|3|null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(true)

  const ready = energy != null && mood != null && focus != null

  async function submit() {
    if (!ready || loading) return
    setLoading(true)
    try {
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          energy,
          focus
        })
      })
      toast.success('✓ Check-in complete!', { description: 'Your data has been recorded' })
      window.dispatchEvent(new CustomEvent('bs_signals_updated'))
      onComplete?.({ mood: mood!, energy: energy!, focus: focus! })
      if (!inline) {
        setTimeout(() => setOpen(false), 500)
      }
    } catch (e) {
      console.error('Check-in failed', e)
      console.log('Check-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (inline) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Daily Check-in</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">Takes 5 seconds. Tap once per row.</p>
        <Section
          label="ENERGY"
          options={[
            { key: 1 as const, emoji: '🔋', label: 'Drained' },
            { key: 2 as const, emoji: '🔋', label: 'Normal' },
            { key: 3 as const, emoji: '⚡', label: 'Energized' },
          ]}
          value={energy}
          onChange={setEnergy}
          ariaPrefix="energy"
        />
        <div className="h-6" />
        <Section
          label="MOOD"
          options={[
            { key: 1 as const, emoji: '😔', label: 'Down' },
            { key: 2 as const, emoji: '😐', label: 'Neutral' },
            { key: 3 as const, emoji: '😊', label: 'Up' },
          ]}
          value={mood}
          onChange={setMood}
          ariaPrefix="mood"
        />
        <div className="h-6" />
        <Section
          label="FOCUS"
          options={[
            { key: 1 as const, emoji: '🌫️', label: 'Scattered' },
            { key: 2 as const, emoji: '🎯', label: 'OK' },
            { key: 3 as const, emoji: '🎯', label: 'Laser' },
          ]}
          value={focus}
          onChange={setFocus}
          ariaPrefix="focus"
        />
        <button
          aria-label="Submit check-in"
          aria-disabled={!ready || loading}
          disabled={!ready || loading}
          onClick={submit}
          className={`mt-6 w-full h-12 rounded-xl text-sm font-semibold transition-colors ${
            ready && !loading
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {ready ? (loading ? 'Submitting…' : 'Submit Check-in') : 'Select all 3 to continue'}
        </button>
      </div>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">Daily Check-in</h3>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">Takes 5 seconds. Tap once per row.</p>
          <Section
            label="ENERGY"
            options={[
              { key: 1 as const, emoji: '🔋', label: 'Drained' },
              { key: 2 as const, emoji: '🔋', label: 'Normal' },
              { key: 3 as const, emoji: '⚡', label: 'Energized' },
            ]}
            value={energy}
            onChange={setEnergy}
            ariaPrefix="energy"
          />
          <div className="h-6" />
          <Section
            label="MOOD"
            options={[
              { key: 1 as const, emoji: '😔', label: 'Down' },
              { key: 2 as const, emoji: '😐', label: 'Neutral' },
              { key: 3 as const, emoji: '😊', label: 'Up' },
            ]}
            value={mood}
            onChange={setMood}
            ariaPrefix="mood"
          />
          <div className="h-6" />
          <Section
            label="FOCUS"
            options={[
              { key: 1 as const, emoji: '🌫️', label: 'Scattered' },
              { key: 2 as const, emoji: '🎯', label: 'OK' },
              { key: 3 as const, emoji: '🎯', label: 'Laser' },
            ]}
            value={focus}
            onChange={setFocus}
            ariaPrefix="focus"
          />
          <button
            aria-label="Submit check-in"
            aria-disabled={!ready || loading}
            disabled={!ready || loading}
            onClick={submit}
            className={`mt-6 w-full h-12 rounded-xl text-sm font-semibold transition-colors ${
              ready && !loading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {ready ? (loading ? 'Submitting…' : 'Submit Check-in') : 'Select all 3 to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section<T extends 1|2|3>({
  label,
  options,
  value,
  onChange,
  ariaPrefix
}: {
  label: string
  options: { key: T; emoji: string; label: string }[]
  value: T | null
  onChange: (v: T) => void
  ariaPrefix: string
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-600 mb-2">{label}</div>
      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => {
          const active = value === opt.key
          return (
            <button
              key={opt.key}
              aria-label={`Select ${opt.label} ${ariaPrefix} level`}
              aria-pressed={active}
              onClick={() => onChange(opt.key)}
              className={[
                'relative h-12 rounded-xl border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2',
                active
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              ].join(' ')}
            >
              <span className="text-base mr-1">{opt.emoji}</span>{opt.label}
              {active && <span className="absolute top-1 right-2 text-emerald-600">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}


