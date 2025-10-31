'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Step5MissionProfileProps {
  userId: string
  displayName: string
  onNext: () => void
  onSkip: () => void
}

export default function Step5MissionProfile({ userId, displayName, onNext, onSkip }: Step5MissionProfileProps) {
  const [mission, setMission] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const maxLength = 280

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      let avatarUrl: string | null = null

      // Upload photo if provided
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'avatar')
        const resp = await fetch('/api/upload', { method: 'POST', body: formData })
        if (resp.ok) {
          const data = await resp.json().catch(() => ({} as any))
          avatarUrl = data?.url || null
        }
      }

      // Save mission and optional avatar
      const updates: Record<string, any> = {}
      if (mission.trim()) {
        updates.mission_statement = mission.trim()
        updates.mission_added_at = new Date().toISOString()
      }
      if (avatarUrl) {
        updates.avatar_url = avatarUrl
      }
      if (Object.keys(updates).length) {
        await supabase.from('profiles').update(updates).eq('user_id', userId)
      }
    } catch (e) {
      console.warn('[Step5] Save failed (non-blocking):', e)
    } finally {
      setIsSaving(false)
      onNext()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <p className="text-2xl mb-4 text-center">💙</p>
          <h2 className="text-2xl font-medium mb-3 text-center">What matters most to you right now?</h2>
          <p className="text-gray-600 mb-4 text-center">
            This isn't about goals or perfection — it's about what matters to you.<br />
            Why you keep showing up, even on the hard days.
          </p>
          {/* Removed extra preface line per request */}

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">Some people say:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>💬 "I'm fighting fibromyalgia and trying to be present for my kids"</p>
              <p>💬 "I'm trying to find what actually helps so I can work again"</p>
              <p>💬 "I'm tired of doctors not believing me — I want proof"</p>
            </div>
          </div>

          <textarea
            value={mission}
            onChange={(e) => { if (e.target.value.length <= maxLength) setMission(e.target.value) }}
            placeholder={"I'm working toward..."}
            maxLength={maxLength}
            className="w-full border border-gray-400 rounded-lg p-4 mb-2"
            rows={4}
          />
          <p className="text-sm text-gray-500 text-right mb-6">{mission.length}/{maxLength}</p>

          <div className="mb-6">
            <p className="text-sm font-medium mb-2">📸 Add a profile photo (optional)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-700"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Save & Continue'}
            </button>
            <button
              onClick={onSkip}
              disabled={isSaving}
              className="flex-1 border py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Skip to Dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


