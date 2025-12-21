'use client'
import { useState } from 'react'

type Mood = 'low'|'ok'|'sharp'

export default function MultiStepCheckin({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState<1|2|3>(1)
  const [mood, setMood] = useState<Mood | null>(null)
  const [energy, setEnergy] = useState<number | null>(null) // 1..3
  const [focus, setFocus] = useState<number | null>(null)   // 1..3
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      await fetch('/api/checkins/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          energy,
          focus,
          day: new Date().toISOString().slice(0,10)
        })
      })
      window.dispatchEvent(new CustomEvent('bs_signals_updated'))
      onDone?.()
      // simple toast
      console.log('✅ Check-in saved', { mood, energy, focus })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">Question {step} of 3</div>
        {step < 3 && (
          <button className="text-sm text-gray-500 hover:text-gray-700" onClick={() => { setStep(3) }}>
            Skip remaining
          </button>
        )}
      </div>

      {step === 1 && (
        <div>
          <div className="text-base font-semibold text-gray-900 mb-3">How do you feel today?</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'low', label: 'Low', emoji: '😔' },
              { key: 'ok', label: 'OK', emoji: '😐' },
              { key: 'sharp', label: 'Sharp', emoji: '😊' }
            ].map((opt) => {
              const active = mood === (opt.key as Mood)
              return (
                <button
                  key={opt.key}
                  onClick={() => setMood(opt.key as Mood)}
                  className={`h-12 rounded-xl border text-sm font-medium transition-all ${active ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  <span className="text-base mr-1">{opt.emoji}</span>{opt.label}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button disabled={!mood} onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-neutral-900 text-white disabled:bg-gray-400">
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="text-base font-semibold text-gray-900 mb-3">How's your energy?</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 1, label: 'Drained', emoji: '🔋' },
              { key: 2, label: 'Normal', emoji: '🔋' },
              { key: 3, label: 'Energized', emoji: '⚡' }
            ].map((opt) => {
              const active = energy === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setEnergy(opt.key)}
                  className={`h-12 rounded-xl border text-sm font-medium transition-all ${active ? 'border-blue-400 bg-blue-50 text-blue-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  <span className="text-base mr-1">{opt.emoji}</span>{opt.label}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(1)} className="px-3 py-2 rounded-lg border text-sm">Back</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-neutral-900 text-white">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="text-base font-semibold text-gray-900 mb-3">How's your focus?</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 1, label: 'Scattered', emoji: '🌫️' },
              { key: 2, label: 'OK', emoji: '🎯' },
              { key: 3, label: 'Laser', emoji: '🎯' }
            ].map((opt) => {
              const active = focus === opt.key
              return (
                <button
                  key={opt.key}
                  onClick={() => setFocus(opt.key)}
                  className={`h-12 rounded-xl border text-sm font-medium transition-all ${active ? 'border-purple-400 bg-purple-50 text-purple-800' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  <span className="text-base mr-1">{opt.emoji}</span>{opt.label}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={() => setStep(2)} className="px-3 py-2 rounded-lg border text-sm">Back</button>
            <button disabled={loading} onClick={submit} className="px-4 py-2 rounded-lg bg-neutral-900 text-white disabled:bg-gray-400">
              {loading ? 'Saving…' : 'All done! 🎉'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


