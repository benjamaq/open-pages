'use client'

import { useState } from 'react'

type EnergyLevel = 1 | 2 | 3

const ENERGY_OPTIONS = [
  { value: 1 as EnergyLevel, emoji: '😴', label: 'Low' },
  { value: 2 as EnergyLevel, emoji: '🙂', label: 'OK' },
  { value: 3 as EnergyLevel, emoji: '⚡', label: 'Sharp' },
]

const SIDE_EFFECTS = ['Wired', 'Groggy', 'Nausea', 'Headache', 'Irritable']

type Props = {
  onSubmit: (data: { energy: EnergyLevel; sideEffects: string[] }) => Promise<{ confidenceNudge?: string }>
  hasCheckedToday: boolean
}

export default function DailyQuickCheck({ onSubmit, hasCheckedToday }: Props) {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel | null>(null)
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nudge, setNudge] = useState<string | null>(null)
  const [showSideEffects, setShowSideEffects] = useState(false)
  
  if (hasCheckedToday && !nudge) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span>
            <span className="text-sm text-green-800 font-medium">Check-in complete for today</span>
          </div>
        </div>
      </div>
    )
  }
  
  async function handleSubmit() {
    if (!selectedEnergy) return
    setIsSubmitting(true)
    try {
      const result = await onSubmit({ energy: selectedEnergy, sideEffects: selectedSideEffects })
      if (result.confidenceNudge) {
        setNudge(result.confidenceNudge)
        setTimeout(() => setNudge(null), 5000)
      }
      try {
        window.dispatchEvent(new Event('bs_signals_updated'))
      } catch {}
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {nudge ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{nudge}</p>
              <p className="text-xs text-gray-500 mt-0.5">Keep checking in daily for accurate patterns</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">How's today feel?</h3>
              <span className="text-xs text-gray-500">1-tap keeps your signals honest</span>
            </div>
            
            <div className="flex gap-2 mb-3">
              {ENERGY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedEnergy(option.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedEnergy === option.value
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:scale-102'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.emoji}</div>
                  <div className={`text-xs font-medium ${selectedEnergy === option.value ? 'text-white' : 'text-gray-700'}`}>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowSideEffects(!showSideEffects)}
              className="text-xs text-blue-600 hover:text-blue-700 mb-2 underline underline-offset-2"
            >
              {showSideEffects ? '− Hide' : '+'} Any side effects?
            </button>
            
            {showSideEffects && (
              <div className="flex flex-wrap gap-2 mb-3">
                {SIDE_EFFECTS.map((effect) => (
                  <button
                    key={effect}
                    onClick={() => {
                      setSelectedSideEffects(prev => prev.includes(effect) ? prev.filter(e => e !== effect) : [...prev, effect])
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSideEffects.includes(effect)
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {effect}
                  </button>
                ))}
              </div>
            )}
            
            {selectedEnergy && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Check In →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


