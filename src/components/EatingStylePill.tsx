'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export interface EatingStyleData {
  style?: string
  enabled: boolean
}

interface EatingStylePillProps {
  profile: any
  isOwner: boolean
}

interface EatingStyleEditorProps {
  isOpen: boolean
  onClose: () => void
  initialStyle: string
  onSave: (style: string) => Promise<void>
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

function EatingStyleEditor({ isOpen, onClose, initialStyle, onSave }: EatingStyleEditorProps) {
  const [style, setStyle] = useState(initialStyle)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(style)
      onClose()
    } catch (error) {
      console.error('Failed to save eating style:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Eating Style</h2>
            <p className="text-sm text-gray-600">Share your dietary approach (optional)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              My current nutrition style is:
            </label>
            <div className="space-y-2">
              {EATING_STYLES.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStyle(option.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    style === option.value
                      ? option.color || 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {option.icon && <span className="text-lg">{option.icon}</span>}
                    <span className="font-medium">{option.label}</span>
                    {style === option.value && (
                      <span className="ml-auto text-xs px-2 py-1 rounded-full bg-black/10">
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            {style ? (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                EATING_STYLES.find(s => s.value === style)?.color || 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {EATING_STYLES.find(s => s.value === style)?.icon && (
                  <span>{EATING_STYLES.find(s => s.value === style)?.icon}</span>
                )}
                <span>My nutrition style is {style}</span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600 border border-gray-200">
                No nutrition style set
              </div>
            )}
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
            disabled={isSaving}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EatingStylePill({ profile, isOwner }: EatingStylePillProps) {
  const [showEditor, setShowEditor] = useState(false)
  const [eatingStyle, setEatingStyle] = useState(() => {
    // Extract from nutrition_signature if it exists
    const signature = profile.nutrition_signature as any
    return signature?.eating_style || ''
  })

  const handleSave = async (newStyle: string) => {
    const { updateEatingStyle } = await import('../lib/actions/eating-style')
    try {
      await updateEatingStyle(newStyle)
      setEatingStyle(newStyle)
    } catch (error) {
      console.error('Failed to save eating style:', error)
      throw error
    }
  }

  const getStyleConfig = (style: string) => {
    return EATING_STYLES.find(s => s.value === style) || EATING_STYLES[0]
  }

  const styleConfig = getStyleConfig(eatingStyle)

  return (
    <>
      {/* Eating Style Pill */}
      {(eatingStyle || isOwner) && (
        <button
          onClick={isOwner ? () => setShowEditor(true) : undefined}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
            eatingStyle && styleConfig.color ? 
              `${styleConfig.color} ${isOwner ? 'hover:opacity-80' : ''}` :
              `bg-gray-100 text-gray-600 border-gray-200 ${isOwner ? 'hover:bg-gray-200' : ''}`
          } ${isOwner ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <span className="flex items-center gap-2">
            {styleConfig.icon && <span>{styleConfig.icon}</span>}
            <span>{eatingStyle ? `My nutrition style is ${eatingStyle}` : 'Add nutrition style'}</span>
          </span>
        </button>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <EatingStyleEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          initialStyle={eatingStyle}
          onSave={handleSave}
        />
      )}
    </>
  )
}
