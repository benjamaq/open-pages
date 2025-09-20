'use client'

import { useState } from 'react'
import { X, Edit2 } from 'lucide-react'

interface UnifiedHeaderEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: {
    displayName: string
    mission: string | null
    eatingStyle: string
  }
  onSave: (data: {
    displayName: string
    mission: string | null
    eatingStyle: string
  }) => Promise<void>
}

const EATING_STYLES = [
  { value: '', label: 'Not specified', icon: '', color: '' },
  { value: 'Mediterranean', label: 'Mediterranean', icon: '🐟', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Keto', label: 'Keto', icon: '🥑', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'Carnivore', label: 'Carnivore', icon: '🥩', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'Plant-based', label: 'Plant-based', icon: '🌱', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'Paleo', label: 'Paleo', icon: '🦴', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'Whole foods', label: 'Whole foods', icon: '🥕', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'High-protein', label: 'High-protein', icon: '💪', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'Low-carb', label: 'Low-carb', icon: '🚫', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'Intermittent fasting', label: 'Intermittent fasting focused', icon: '⏰', color: 'bg-purple-100 text-purple-800 border-purple-200' }
]

export default function UnifiedHeaderEditor({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}: UnifiedHeaderEditorProps) {
  const [displayName, setDisplayName] = useState(initialData.displayName)
  const [mission, setMission] = useState(initialData.mission || '')
  const [eatingStyle, setEatingStyle] = useState(initialData.eatingStyle)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        displayName: displayName.trim(),
        mission: mission.trim() || null,
        eatingStyle
      })
      onClose()
    } catch (error) {
      console.error('Failed to save header data:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getStyleConfig = (style: string) => {
    return EATING_STYLES.find(s => s.value === style) || EATING_STYLES[0]
  }

  const selectedStyleConfig = getStyleConfig(eatingStyle)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Edit Header</h2>
            <p className="text-sm text-gray-600">Update your name, mission, and eating style</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
              placeholder="Enter your name..."
              maxLength={50}
            />
          </div>

          {/* Mission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission Statement
            </label>
            <textarea
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base resize-none"
              placeholder="Share your health mission or goal..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{mission.length}/200 characters</p>
          </div>

          {/* Eating Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Eating Style (Optional)
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {EATING_STYLES.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setEatingStyle(option.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    eatingStyle === option.value
                      ? option.color || 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && <span className="text-lg">{option.icon}</span>}
                    <span className="font-medium">{option.label}</span>
                    {eatingStyle === option.value && (
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-black/10">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
            <div className="space-y-3">
              {/* Name and Mission */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {displayName || 'Your Name'}
                </h3>
                {mission && (
                  <p className="text-gray-600 text-sm mt-1">
                    {mission}
                  </p>
                )}
              </div>
              
              {/* Pills Preview */}
              <div className="flex flex-wrap gap-3">
                {/* Date Pill */}
                <div className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                
                {/* Energy/Mood Pill */}
                <div className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                  🔋 7/10 • Dialed in
                </div>

                {/* Eating Style Pill */}
                {eatingStyle && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                    selectedStyleConfig.color || 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {selectedStyleConfig.icon && (
                      <span>{selectedStyleConfig.icon}</span>
                    )}
                    <span>My eating style is {eatingStyle}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
