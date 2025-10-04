'use client'

import { useState, useEffect } from 'react'
import { X, Monitor, Tablet, Smartphone, User, FileText, Utensils } from 'lucide-react'
import { 
  NutritionSignature, 
  BadgeKey, 
  DIET_STYLES, 
  FASTING_WINDOWS, 
  COMMON_RULES,
  validateNutritionSignature,
  getDefaultNutritionSignature
} from '../lib/nutrition/signature'
import NutritionBadges from './nutrition/NutritionBadges'

interface ProfileHeaderEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: {
    displayName: string
    bio: string | null
    nutritionSignature: NutritionSignature
  }
  onSave: (data: {
    displayName: string
    bio: string | null
    nutritionSignature: NutritionSignature
  }) => Promise<void>
}

const BADGE_TYPES = [
  { key: 'style', label: 'Diet Style', description: 'Your eating approach', icon: '🥑' },
  { key: 'fasting', label: 'Fasting', description: 'Intermittent fasting schedule', icon: '⏳' },
  { key: 'protein', label: 'Protein Target', description: 'Daily protein goal', icon: '💪' },
  { key: 'rule', label: 'Food Rule', description: 'What you avoid', icon: '🚫' },
  { key: 'goto', label: 'Go-to Meal', description: 'Your reliable meal', icon: '🥗' },
  { key: 'weakness', label: 'Weakness', description: 'Your food kryptonite', icon: '🍫' },
  { key: 'plants', label: 'Plant Goal', description: 'Vegetable variety target', icon: '🥦' },
  { key: 'experiment', label: 'Experiment', description: 'Current nutrition trial', icon: '🧪' }
] as const

export default function ProfileHeaderEditor({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}: ProfileHeaderEditorProps) {
  const [displayName, setDisplayName] = useState(initialData.displayName)
  const [bio, setBio] = useState(initialData.bio || '')
  const [nutritionSignature, setNutritionSignature] = useState<NutritionSignature>(
    initialData.nutritionSignature || getDefaultNutritionSignature()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState<'identity' | 'nutrition'>('identity')

  useEffect(() => {
    setDisplayName(initialData.displayName)
    setBio(initialData.bio || '')
    setNutritionSignature(initialData.nutritionSignature || getDefaultNutritionSignature())
  }, [initialData])

  const handleToggleBadge = (key: BadgeKey) => {
    setNutritionSignature(prev => {
      const badges = prev.header_badges || []
      const isEnabled = badges.includes(key)
      
      if (isEnabled) {
        return {
          ...prev,
          header_badges: badges.filter(b => b !== key)
        }
      } else {
        return {
          ...prev,
          header_badges: [...badges, key]
        }
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const validated = validateNutritionSignature(nutritionSignature)
      await onSave({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        nutritionSignature: validated
      })
      onClose()
    } catch (error) {
      console.error('Failed to save profile header:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isEnabled = (key: BadgeKey) => nutritionSignature.header_badges?.includes(key) || false

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customize Profile Header</h2>
            <p className="text-sm text-gray-600 mt-1">
              Edit your name, mission, and nutrition badges all in one place
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('identity')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'identity'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Identity</span>
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'nutrition'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Nutrition</span>
            </button>
          </nav>
        </div>

        <div className="flex flex-1 overflow-hidden max-h-[calc(90vh-200px)]">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200">
            {activeTab === 'identity' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Identity</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    maxLength={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{displayName.length}/50 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mission Statement
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Your mission or bio..."
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{bio.length}/200 characters</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Profile Tips</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Keep your name clear and recognizable</li>
                    <li>• Mission should be concise and inspiring</li>
                    <li>• This appears prominently on your public profile</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Nutrition Badges</h3>
                
                {BADGE_TYPES.map(({ key, label, description, icon }) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleBadge(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isEnabled(key) ? 'bg-gray-900' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isEnabled(key) ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Value Editor - Simplified for now */}
                    {isEnabled(key) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {key === 'style' && (
                          <select
                            value={nutritionSignature.style?.key || ''}
                            onChange={(e) => {
                              const selectedStyle = DIET_STYLES.find(s => s.key === e.target.value)
                              setNutritionSignature(prev => ({
                                ...prev,
                                style: selectedStyle ? { key: selectedStyle.key, label: selectedStyle.label } : undefined
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Select diet style...</option>
                            {DIET_STYLES.map(style => (
                              <option key={style.key} value={style.key}>
                                {style.icon} {style.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {key === 'fasting' && (
                          <select
                            value={nutritionSignature.fasting?.window || ''}
                            onChange={(e) => {
                              setNutritionSignature(prev => ({
                                ...prev,
                                fasting: { 
                                  window: e.target.value as any,
                                  days_per_week: prev.fasting?.days_per_week
                                }
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Select fasting window...</option>
                            {FASTING_WINDOWS.map(window => (
                              <option key={window.key} value={window.key}>
                                {window.label} - {window.description}
                              </option>
                            ))}
                          </select>
                        )}

                        {(key === 'goto' || key === 'weakness' || key === 'experiment') && (
                          <input
                            type="text"
                            maxLength={24}
                            placeholder={
                              key === 'goto' ? 'Your go-to meal...' :
                              key === 'weakness' ? 'Your food weakness...' :
                              'Current experiment...'
                            }
                            value={
                              key === 'goto' ? nutritionSignature.goto_meal || '' :
                              key === 'weakness' ? nutritionSignature.weakness || '' :
                              nutritionSignature.experiment || ''
                            }
                            onChange={(e) => {
                              setNutritionSignature(prev => ({
                                ...prev,
                                [key === 'goto' ? 'goto_meal' : key]: e.target.value
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        )}

                        {key === 'protein' && (
                          <input
                            type="number"
                            min="50"
                            max="500"
                            placeholder="Daily protein target (grams)"
                            value={nutritionSignature.protein_target_g || ''}
                            onChange={(e) => {
                              setNutritionSignature(prev => ({
                                ...prev,
                                protein_target_g: e.target.value ? parseInt(e.target.value) : undefined
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-green-900 mb-1">Nutrition Badges</h4>
                  <ul className="text-xs text-green-800 space-y-1">
                    <li>• Badges show your nutrition approach at a glance</li>
                    <li>• Private by default - only show what you enable</li>
                    <li>• Adapts to screen size automatically</li>
                    <li>• Great conversation starters on your profile</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Live Preview */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                <div className="flex items-center border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`p-1 rounded ${previewDevice === 'tablet' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
                  >
                    <Tablet className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-gray-900 text-white' : 'text-gray-600'}`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview Container */}
              <div className={`border border-gray-200 rounded-lg p-6 bg-gray-50 ${
                previewDevice === 'desktop' ? 'w-full' :
                previewDevice === 'tablet' ? 'w-96 mx-auto' :
                'w-80 mx-auto'
              }`}>
                <div className="space-y-3">
                  {/* Name */}
                  <div className="text-xl font-bold text-gray-900">
                    {displayName || 'Your Name'}
                  </div>
                  
                  {/* Mission */}
                  <div className="text-gray-600">
                    {bio || 'Your mission statement'}
                  </div>

                  {/* Header Pills Row */}
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                      Sep 19
                    </div>
                    <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                      🔋 7/10
                    </div>
                    
                    {/* Nutrition Badges Preview */}
                    <NutritionBadges 
                      signature={nutritionSignature} 
                      isOwner={false} // Don't show customize button in preview
                    />
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Preview Tips</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• This shows how your header will look to visitors</li>
                  <li>• Badges adapt based on screen size</li>
                  <li>• Switch between devices to test responsiveness</li>
                  <li>• Only enabled badges will appear publicly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
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
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
