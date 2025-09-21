'use client'

import { useState } from 'react'
import { updateBackgroundColor } from '../lib/actions/background-color'

interface BackgroundColorPickerProps {
  userTier: 'free' | 'pro' | 'creator'
  initialColor: string
  isOwner: boolean
}

export default function BackgroundColorPicker({ 
  userTier, 
  initialColor, 
  isOwner 
}: BackgroundColorPickerProps) {
  const [color, setColor] = useState(initialColor)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Don't show for non-creator tiers or if user is not owner
  if (userTier !== 'creator' || !isOwner) {
    return null
  }

  // Predefined color options
  const colorOptions = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Light Gray', value: '#F9FAFB' },
    { name: 'Light Blue', value: '#F0F9FF' },
    { name: 'Light Purple', value: '#FAF5FF' },
    { name: 'Light Green', value: '#F0FDF4' },
    { name: 'Light Yellow', value: '#FEFCE8' },
    { name: 'Light Pink', value: '#FDF2F8' },
    { name: 'Light Orange', value: '#FFF7ED' },
  ]

  const handleColorChange = async (newColor: string) => {
    setLoading(true)
    setMessage('')
    
    try {
      await updateBackgroundColor(newColor)
      setColor(newColor)
      setMessage('Background color updated successfully!')
      
      // Apply the color immediately to the current page
      document.body.style.backgroundColor = newColor
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update color')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setColor(newColor)
    handleColorChange(newColor)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Background Color</h3>
          <p className="text-sm text-gray-500">Customize your dashboard and profile background</p>
        </div>
        <div className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
          <span>⭐</span>
          <span className="ml-1">Creator Feature</span>
        </div>
      </div>

      {/* Color Options Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {colorOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleColorChange(option.value)}
            disabled={loading}
            className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              color === option.value
                ? 'border-purple-500 ring-2 ring-purple-500/20'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{ backgroundColor: option.value }}
          >
            <div className="w-full h-8 rounded border border-gray-200/50"></div>
            <p className="text-xs text-gray-700 mt-2 font-medium">{option.name}</p>
            {color === option.value && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Or choose a custom color:
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            value={color}
            onChange={handleCustomColorChange}
            disabled={loading}
            className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex-1">
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={() => handleColorChange(color)}
              placeholder="#FFFFFF"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleColorChange(color)}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded-md transition-colors"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 rounded-lg border border-gray-200" style={{ backgroundColor: color }}>
        <p className="text-sm text-gray-700 font-medium mb-2">Preview:</p>
        <div className="bg-white rounded-md p-3 shadow-sm">
          <p className="text-sm text-gray-900">This is how your dashboard and profile will look with this background color.</p>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${
          message.includes('success') 
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Background Color Tips:</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Light colors work best for readability</li>
          <li>• Your color will apply to your dashboard and public profile</li>
          <li>• Changes are saved automatically</li>
          <li>• You can change this anytime</li>
        </ul>
      </div>
    </div>
  )
}
