'use client'

import { useState, useEffect } from 'react'
import { X, GripVertical, Monitor, Tablet, Smartphone } from 'lucide-react'
import { 
  NutritionSignature, 
  BadgeKey, 
  DIET_STYLES, 
  FASTING_WINDOWS, 
  COMMON_RULES,
  validateNutritionSignature,
  getDefaultNutritionSignature
} from '../../lib/nutrition/signature'
import NutritionBadges from './NutritionBadges'

interface NutritionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  initialSignature?: NutritionSignature
  onSave: (signature: NutritionSignature) => Promise<void>
}

const BADGE_TYPES = [
  { key: 'style', label: 'Diet Style', description: 'Your eating approach' },
  { key: 'fasting', label: 'Fasting', description: 'Intermittent fasting schedule' },
  { key: 'protein', label: 'Protein Target', description: 'Daily protein goal' },
  { key: 'rule', label: 'Food Rule', description: 'What you avoid' },
  { key: 'goto', label: 'Go-to Meal', description: 'Your reliable meal' },
  { key: 'weakness', label: 'Weakness', description: 'Your food kryptonite' },
  { key: 'plants', label: 'Plant Goal', description: 'Vegetable variety target' },
  { key: 'experiment', label: 'Experiment', description: 'Current nutrition trial' }
] as const

export default function NutritionEditorModal({ 
  isOpen, 
  onClose, 
  initialSignature, 
  onSave 
}: NutritionEditorModalProps) {
  const [signature, setSignature] = useState<NutritionSignature>(
    initialSignature || getDefaultNutritionSignature()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    if (initialSignature) {
      setSignature(initialSignature)
    }
  }, [initialSignature])

  const handleToggleBadge = (key: BadgeKey) => {
    setSignature(prev => {
      const badges = prev.header_badges || []
      const isEnabled = badges.includes(key)
      
      if (isEnabled) {
        // Remove badge
        return {
          ...prev,
          header_badges: badges.filter(b => b !== key)
        }
      } else {
        // Add badge
        return {
          ...prev,
          header_badges: [...badges, key]
        }
      }
    })
  }

  const handleReorderBadges = (fromIndex: number, toIndex: number) => {
    setSignature(prev => {
      const badges = [...(prev.header_badges || [])]
      const [moved] = badges.splice(fromIndex, 1)
      badges.splice(toIndex, 0, moved)
      return { ...prev, header_badges: badges }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const validated = validateNutritionSignature(signature)
      await onSave(validated)
      onClose()
    } catch (error) {
      console.error('Failed to save nutrition signature:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isEnabled = (key: BadgeKey) => signature.header_badges?.includes(key) || false

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nutrition Signature</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add badges that describe how you eat. These appear on your public profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden max-h-[calc(90vh-140px)]">
          {/* Left Panel - Badge Configuration */}
          <div className="w-1/2 p-6 overflow-y-auto border-r border-gray-200" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Badges</h3>
            
            <div className="space-y-4">
              {BADGE_TYPES.map(({ key, label, description }) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                      <p className="text-xs text-gray-500">{description}</p>
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

                  {/* Value Editor */}
                  {isEnabled(key) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {key === 'style' && (
                        <select
                          value={signature.style?.key || ''}
                          onChange={(e) => {
                            const selectedStyle = DIET_STYLES.find(s => s.key === e.target.value)
                            setSignature(prev => ({
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
                        <div className="space-y-2">
                          <select
                            value={signature.fasting?.window || ''}
                            onChange={(e) => {
                              setSignature(prev => ({
                                ...prev,
                                fasting: { 
                                  ...prev.fasting,
                                  window: e.target.value as any
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
                          <input
                            type="number"
                            min="1"
                            max="7"
                            placeholder="Days per week (optional)"
                            value={signature.fasting?.days_per_week || ''}
                            onChange={(e) => {
                              setSignature(prev => ({
                                ...prev,
                                fasting: {
                                  ...prev.fasting!,
                                  days_per_week: e.target.value ? parseInt(e.target.value) : undefined
                                }
                              }))
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      )}

                      {key === 'protein' && (
                        <input
                          type="number"
                          min="50"
                          max="500"
                          placeholder="Daily protein target (grams)"
                          value={signature.protein_target_g || ''}
                          onChange={(e) => {
                            setSignature(prev => ({
                              ...prev,
                              protein_target_g: e.target.value ? parseInt(e.target.value) : undefined
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}

                      {key === 'rule' && (
                        <select
                          value={signature.rule?.key || ''}
                          onChange={(e) => {
                            const selectedRule = COMMON_RULES.find(r => r.key === e.target.value)
                            setSignature(prev => ({
                              ...prev,
                              rule: selectedRule ? { key: selectedRule.key, label: selectedRule.label } : undefined
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select rule...</option>
                          {COMMON_RULES.map(rule => (
                            <option key={rule.key} value={rule.key}>
                              {rule.icon} {rule.label}
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
                            key === 'goto' ? signature.goto_meal || '' :
                            key === 'weakness' ? signature.weakness || '' :
                            signature.experiment || ''
                          }
                          onChange={(e) => {
                            setSignature(prev => ({
                              ...prev,
                              [key === 'goto' ? 'goto_meal' : key]: e.target.value
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}

                      {key === 'plants' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="1"
                              max="50"
                              placeholder="Per day"
                              value={signature.plant_goal?.per_day || ''}
                              onChange={(e) => {
                                setSignature(prev => ({
                                  ...prev,
                                  plant_goal: {
                                    ...prev.plant_goal,
                                    per_day: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }))
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            <span className="px-3 py-2 text-sm text-gray-500">OR</span>
                            <input
                              type="number"
                              min="1"
                              max="200"
                              placeholder="Per week"
                              value={signature.plant_goal?.per_week || ''}
                              onChange={(e) => {
                                setSignature(prev => ({
                                  ...prev,
                                  plant_goal: {
                                    ...prev.plant_goal,
                                    per_week: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }))
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Set either daily or weekly plant variety goal</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
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
              <div className={`border border-gray-200 rounded-lg p-4 ${
                previewDevice === 'desktop' ? 'w-full' :
                previewDevice === 'tablet' ? 'w-96 mx-auto' :
                'w-80 mx-auto'
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Your Name</div>
                    <div className="text-gray-600">Your mission statement</div>
                  </div>
                  <div className="flex-shrink-0">
                    <NutritionBadges 
                      signature={signature} 
                      isOwner={true}
                      onCustomize={() => {}}
                    />
                  </div>
                </div>
              </div>

              {/* Badge Order */}
              {signature.header_badges && signature.header_badges.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Badge Order</h4>
                  <p className="text-xs text-gray-500 mb-3">Drag to reorder badge priority</p>
                  <div className="space-y-2">
                    {signature.header_badges.map((key, index) => (
                      <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <div className="ml-auto text-xs text-gray-500">#{index + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">How it works</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Badges adapt to screen size automatically</li>
                  <li>• Only enabled badges appear publicly</li>
                  <li>• Order determines priority when space is limited</li>
                  <li>• Overflow badges show in "+N" pill</li>
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
