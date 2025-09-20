'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export interface SimpleNutritionData {
  selected_statements?: string[] // Max 3 selected from available options
  enabled: boolean
}

interface SimpleNutritionEditorProps {
  isOpen: boolean
  onClose: () => void
  initialData: SimpleNutritionData
  onSave: (data: SimpleNutritionData) => Promise<void>
}

const STATEMENT_OPTIONS = [
  // Eating styles
  { key: 'eating_style', value: 'mediterranean', statement: 'I eat Mediterranean' },
  { key: 'eating_style', value: 'keto', statement: 'I eat keto' },
  { key: 'eating_style', value: 'carnivore', statement: 'I eat carnivore' },
  { key: 'eating_style', value: 'plant_based', statement: 'I eat plant-based' },
  { key: 'eating_style', value: 'paleo', statement: 'I eat paleo' },
  { key: 'eating_style', value: 'whole_foods', statement: 'I eat whole foods only' },
  
  // Never eat/consume
  { key: 'never_eat', value: 'seed_oils', statement: 'I never eat seed oils' },
  { key: 'never_eat', value: 'processed', statement: 'I never eat processed foods' },
  { key: 'never_eat', value: 'sugar', statement: 'I never eat added sugar' },
  { key: 'never_eat', value: 'late_meals', statement: 'I never eat late meals' },
  { key: 'never_eat', value: 'alcohol', statement: 'I never consume alcohol' },
  { key: 'never_eat', value: 'gluten', statement: 'I never eat gluten' },
  { key: 'never_eat', value: 'dairy', statement: 'I never eat dairy' },
  
  // Fasting styles
  { key: 'fasting_style', value: '16:8', statement: 'I intermittent fast 16:8' },
  { key: 'fasting_style', value: '18:6', statement: 'I intermittent fast 18:6' },
  { key: 'fasting_style', value: 'omad', statement: 'I intermittent fast OMAD' },
  { key: 'fasting_style', value: '5:2', statement: 'I fast 2 days per week' },
  
  // Workout fuel
  { key: 'workout_fuel', value: 'fasted', statement: 'I train fasted' },
  { key: 'workout_fuel', value: 'caffeine', statement: 'I fuel workouts with caffeine' },
  { key: 'workout_fuel', value: 'carbs', statement: 'I fuel workouts with carbs' },
  
  // Sleep rules
  { key: 'sleep_rule', value: 'no_late_food', statement: 'I stop eating 3 hours before bed' },
  { key: 'sleep_rule', value: 'no_caffeine', statement: 'I avoid caffeine after 2pm' },
  
  // Recovery methods
  { key: 'recovery_method', value: 'sauna', statement: 'I prioritize sauna therapy' },
  { key: 'recovery_method', value: 'cold', statement: 'I prioritize cold therapy' },
  { key: 'recovery_method', value: 'sleep', statement: 'I prioritize sleep optimization' }
]

export default function SimpleNutritionEditor({ 
  isOpen, 
  onClose, 
  initialData, 
  onSave 
}: SimpleNutritionEditorProps) {
  const [selectedStatements, setSelectedStatements] = useState<string[]>(
    initialData.selected_statements || []
  )
  const [isSaving, setIsSaving] = useState(false)

  const handleToggleStatement = (value: string) => {
    setSelectedStatements(prev => {
      if (prev.includes(value)) {
        return prev.filter(s => s !== value)
      } else if (prev.length < 3) {
        return [...prev, value]
      } else {
        // Replace the last one if at max
        return [...prev.slice(0, 2), value]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const enabled = selectedStatements.length > 0
      await onSave({ 
        selected_statements: selectedStatements,
        enabled 
      })
      onClose()
    } catch (error) {
      console.error('Failed to save nutrition data:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getSelectedStatements = () => {
    return selectedStatements.map(value => {
      const option = STATEMENT_OPTIONS.find(opt => opt.value === value)
      return option?.statement || value
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Health Philosophy</h2>
            <p className="text-sm text-gray-600">Choose up to 3 statements that describe your approach</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Select statements ({selectedStatements.length}/3)</h3>
              {selectedStatements.length >= 3 && (
                <span className="text-xs text-amber-600">Maximum reached - selecting another will replace the last one</span>
              )}
            </div>
            
            {/* Group statements by category */}
            {[
              { category: 'Eating Style', key: 'eating_style' },
              { category: 'Never Consume', key: 'never_eat' },
              { category: 'Fasting', key: 'fasting_style' },
              { category: 'Workout', key: 'workout_fuel' },
              { category: 'Sleep', key: 'sleep_rule' },
              { category: 'Recovery', key: 'recovery_method' }
            ].map(({ category, key }) => {
              const categoryOptions = STATEMENT_OPTIONS.filter(opt => opt.key === key)
              
              return (
                <div key={key} className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{category}</h4>
                  <div className="space-y-2">
                    {categoryOptions.map(option => (
                      <label
                        key={option.value}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStatements.includes(option.value)
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          !selectedStatements.includes(option.value) && selectedStatements.length >= 3
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStatements.includes(option.value)}
                          onChange={() => handleToggleStatement(option.value)}
                          disabled={!selectedStatements.includes(option.value) && selectedStatements.length >= 3}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${
                            selectedStatements.includes(option.value) 
                              ? 'text-gray-900 font-medium' 
                              : 'text-gray-700'
                          }`}>
                            "{option.statement}"
                          </span>
                        </div>
                        {selectedStatements.includes(option.value) && (
                          <div className="w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">How it will appear</h4>
              <div className="space-y-1">
                {getSelectedStatements().map((statement, index) => (
                  <div key={index} className="text-sm text-blue-800 italic">
                    "{statement}"
                  </div>
                ))}
                {selectedStatements.length === 0 && (
                  <div className="text-sm text-blue-600 italic">
                    Select statements to see preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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