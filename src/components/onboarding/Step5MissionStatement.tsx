'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackOnboardingEvent } from '@/lib/analytics/onboarding'

interface Step5MissionStatementProps {
  userId: string
  displayName: string
  onNext: () => void
  onSkip: () => void
}

export default function Step5MissionStatement({ userId, displayName, onNext, onSkip }: Step5MissionStatementProps) {
  const [mission, setMission] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const maxLength = 280

  const supabase = createClient()

  const examples = [
    "I haven't slept well in months and I need to figure out why",
    "I'm managing chronic pain and want to find what actually helps",
    "I'm exhausted and need to understand what's draining my energy",
    "I want proof of what's working so I can feel confident in my choices"
  ]

  const handleSave = async () => {
    if (!mission.trim()) return handleSkip()
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ mission_statement: mission.trim(), mission_added_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) throw error
      await trackOnboardingEvent({ event_type: 'mission_added', step_number: 5, metadata: { character_count: mission.trim().length } })
    } catch (e) {
      console.warn('Mission save failed', e)
    } finally {
      setIsSaving(false)
      onNext()
    }
  }

  const handleSkip = async () => {
    try { await trackOnboardingEvent({ event_type: 'mission_skipped', step_number: 5 }) } catch {}
    onSkip()
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="text-4xl mb-4">💙</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">What are you working toward?</h2>
        <p className="text-lg text-gray-700">This helps me understand what success looks like for you. No pressure, no judgment — just honest.</p>
      </div>

      <div className="mb-8 space-y-3">
        <p className="text-sm font-medium text-gray-600 mb-3">Some people say:</p>
        {examples.map((ex, idx) => (
          <div key={idx} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-700 text-sm flex items-start gap-2"><span className="text-base">💬</span><span>"{ex}"</span></p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative">
          <textarea
            value={mission}
            onChange={(e) => { if (e.target.value.length <= maxLength) setMission(e.target.value) }}
            placeholder="I'm fighting..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={maxLength}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">{mission.length}/{maxLength}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-purple-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {isSaving ? (<><span className="animate-spin">⏳</span>Saving...</>) : (<><span>✍️</span>Save My Mission</>)}
        </button>
        <button onClick={handleSkip} disabled={isSaving} className="flex-1 bg-gray-100 text-gray-700 py-4 px-6 rounded-lg font-medium text-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed">Skip For Now →</button>
      </div>
      <p className="text-xs text-gray-500 text-center mt-4">You can edit or add this later from your profile settings</p>
    </div>
  )
}


