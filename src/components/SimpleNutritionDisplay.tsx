'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import SimpleNutritionEditor, { SimpleNutritionData } from './SimpleNutritionEditor'
import { updateSimpleNutritionData } from '../lib/actions/simple-nutrition'

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

interface SimpleNutritionDisplayProps {
  initialData: SimpleNutritionData
  isOwner: boolean
}

export default function SimpleNutritionDisplay({ 
  initialData, 
  isOwner 
}: SimpleNutritionDisplayProps) {
  const [data, setData] = useState<SimpleNutritionData>(initialData)
  const [showEditor, setShowEditor] = useState(false)

  const handleSave = async (newData: SimpleNutritionData) => {
    try {
      await updateSimpleNutritionData(newData)
      setData(newData)
    } catch (error) {
      console.error('Failed to save nutrition data:', error)
      throw error
    }
  }

  const getSelectedStatements = () => {
    if (!data.selected_statements || data.selected_statements.length === 0) {
      return []
    }
    
    return data.selected_statements.map(value => {
      const option = STATEMENT_OPTIONS.find(opt => opt.value === value)
      return option?.statement || value
    })
  }

  const statements = getSelectedStatements()

  return (
    <>
      {/* Quote-style statements without container */}
      <div className="space-y-1">
        {statements.map((statement, index) => (
          <div key={index} className="text-sm text-gray-600 italic">
            "{statement}"
          </div>
        ))}
        
        {/* Edit button for owners */}
        {isOwner && (
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors mt-2"
          >
            <Edit2 className="w-3 h-3" />
            {statements.length > 0 ? 'Edit philosophy' : 'Add health philosophy'}
          </button>
        )}
        
        {/* Empty state for visitors */}
        {!isOwner && statements.length === 0 && (
          <div className="text-sm text-gray-400 italic">
            No health philosophy shared
          </div>
        )}
      </div>

      {/* Simple Nutrition Editor */}
      {showEditor && (
        <SimpleNutritionEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          initialData={data}
          onSave={handleSave}
        />
      )}
    </>
  )
}
