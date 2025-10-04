'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { updatePublicModules, type PublicModules } from '../lib/actions/public-modules'

interface SectionToggleSheetProps {
  currentModules: PublicModules
  onUpdate: (modules: PublicModules) => void
}

export default function SectionToggleSheet({ currentModules, onUpdate }: SectionToggleSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [modules, setModules] = useState(currentModules)

  const moduleLabels = {
    journal: 'Show Journal & Notes',
    supplements: 'Show Supplements & Meds',
    protocols: 'Show Protocols & Recovery',
    movement: 'Show Training & Rehab',
    mindfulness: 'Show Mind & Stress',
    library: 'Show Records & Plans',
    gear: 'Show Devices & Tools',
    mood: 'Show Mood Tracker'
  }

  const handleToggle = (module: keyof PublicModules) => {
    setModules(prev => ({
      ...prev,
      [module]: !prev[module]
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const updatedModules = await updatePublicModules(modules)
      onUpdate(updatedModules)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to update module visibility:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setModules(currentModules)
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        Customize module visibility
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Customize module visibility</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">
                Choose which sections to show on your public profile:
              </p>
              
              {Object.entries(moduleLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <label htmlFor={key} className="text-sm font-medium">
                    {label}
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id={key}
                      type="checkbox"
                      checked={modules[key as keyof PublicModules] || false}
                      onChange={() => handleToggle(key as keyof PublicModules)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
