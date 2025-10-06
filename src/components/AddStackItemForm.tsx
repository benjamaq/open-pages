'use client'

import { useState, useEffect } from 'react'
import { addStackItem } from '../lib/actions/stack'
import { useRouter } from 'next/navigation'
import { checkItemLimit } from '../lib/actions/trial-limits'
import UpgradeModal from './UpgradeModal'

interface AddStackItemFormProps {
  onClose: () => void
  itemType?: 'supplements' | 'movement' | 'food' | 'mindfulness'
}

export default function AddStackItemForm({ onClose, itemType = 'supplements' }: AddStackItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    timing: '',
    brand: '',
    notes: '',
    public: true,
    frequency: 'daily',
    time_preference: 'morning',
    schedule_days: [0, 1, 2, 3, 4, 5, 6], // All days by default
    category: 'General'
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [limitInfo, setLimitInfo] = useState({ canAdd: true, currentCount: 0, limit: 0 })
  const router = useRouter()

  // Check limits on mount
  useEffect(() => {
    const checkLimits = async () => {
      try {
        // Only check supplements and protocols for limits
        if (itemType === 'supplements') {
          const result = await checkItemLimit('supplements')
          setLimitInfo({
            canAdd: result.allowed,
            currentCount: result.currentCount,
            limit: result.limit
          })
          
          if (!result.allowed) {
            setShowUpgradeModal(true)
          }
        } else {
          // For movement, mindfulness, etc., allow unlimited
          setLimitInfo({ canAdd: true, currentCount: 0, limit: -1 })
        }
      } catch (error) {
        console.error('Error checking limits:', error)
        // Default to allowing if there's an error
        setLimitInfo({ canAdd: true, currentCount: 0, limit: -1 })
      }
    }

    checkLimits()
  }, [itemType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check limits again before submitting
    if (!limitInfo.canAdd) {
      setShowUpgradeModal(true)
      return
    }
    
    setIsLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError('Name is required.')
      setIsLoading(false)
      return
    }

    try {
      await addStackItem({ ...formData, itemType })
      onClose()
      router.refresh()
    } catch (err) {
      console.error('Add stack item error:', err)
      let errorMessage = 'An unexpected error occurred'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // More specific error messages
        if (err.message.includes('not authenticated')) {
          errorMessage = 'Please log in again to continue.'
        } else if (err.message.includes('Profile not found')) {
          errorMessage = 'Profile setup incomplete. Please contact support.'
        } else if (err.message.includes('Failed to create stack item')) {
          errorMessage = 'Unable to save item. Please check your connection and try again.'
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFrequencyChange = (frequency: string) => {
    let defaultDays = [0, 1, 2, 3, 4, 5, 6] // All days
    
    if (frequency === 'weekly') {
      // Default to today's day of week for weekly
      defaultDays = [new Date().getDay()]
    } else if (frequency === 'bi-weekly') {
      // Default to today's day of week for bi-weekly
      defaultDays = [new Date().getDay()]
    }
    
    setFormData(prev => ({
      ...prev,
      frequency,
      schedule_days: defaultDays
    }))
  }

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(dayIndex)
        ? prev.schedule_days.filter(d => d !== dayIndex)
        : [...prev.schedule_days, dayIndex].sort()
    }))
  }

  const dayNames = [
    { short: 'S', full: 'Sun' },
    { short: 'M', full: 'Mon' },
    { short: 'T', full: 'Tue' },
    { short: 'W', full: 'Wed' },
    { short: 'T', full: 'Thu' },
    { short: 'F', full: 'Fri' },
    { short: 'S', full: 'Sat' }
  ]

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'custom', label: 'Custom' }
  ]

  const timeOptions = [
    { value: 'morning', label: 'Morning', icon: '🌅' },
    { value: 'midday', label: 'Midday', icon: '☀️' },
    { value: 'evening', label: 'Evening', icon: '🌙' },
    { value: 'anytime', label: 'Anytime', icon: '⏰' }
  ]

  const categoryOptions = [
    'General',
    'Vitamins',
    'Minerals', 
    'Amino Acids',
    'Peptides',
    'Herbals / Adaptogens',
    'Powders',
    'Pre-workout',
    'Post-workout',
    'Gut / Probiotics',
    'Sleep',
    'Cognition'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {itemType === 'supplements' && 'Add Supplements & Meds'}
              {itemType === 'movement' && 'Add Movement'}
              {itemType === 'mindfulness' && 'Add Mind & Stress'}
              {itemType === 'food' && 'Add Food'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Core Info Section */}
            <div className="space-y-4">
            <div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full text-base sm:text-lg font-medium px-0 py-2 sm:py-3 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent placeholder-gray-400"
                placeholder={
                  itemType === 'supplements' ? 'Supplement/medication name...' :
                  itemType === 'movement' ? 'Training/rehab name...' :
                  itemType === 'food' ? 'Food name...' :
                  itemType === 'mindfulness' ? 'Practice name...' :
                  'Item name...'
                }
                required
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Visibility</span>
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${!formData.public ? 'text-gray-900' : 'text-gray-400'}`}>
                  Private
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, public: !prev.public }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.public ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.public ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${formData.public ? 'text-gray-900' : 'text-gray-400'}`}>
                  Public
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Schedule</h3>
            
            {/* Frequency Pills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFrequencyChange(option.value)}
                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border-2 transition-all ${
                      formData.frequency === option.value
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day Picker for Weekly, Bi-weekly, and Custom */}
            {(formData.frequency === 'weekly' || formData.frequency === 'bi-weekly' || formData.frequency === 'custom') && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {formData.frequency === 'weekly' ? 'Select Day of Week' :
                   formData.frequency === 'bi-weekly' ? 'Select Day of Week' :
                   'Select Days'}
                </label>
                <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`w-10 h-10 sm:w-10 sm:h-10 rounded-full text-xs sm:text-sm font-medium border-2 transition-all flex-shrink-0 ${
                        formData.schedule_days.includes(index)
                          ? 'bg-gray-900 text-white border-gray-900 shadow-sm transform scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                {formData.frequency === 'weekly' && (
                  <p className="text-xs text-gray-500 mt-2">This item will appear every week on the selected day</p>
                )}
                {formData.frequency === 'bi-weekly' && (
                  <p className="text-xs text-gray-500 mt-2">This item will appear every other week on the selected day</p>
                )}
                {formData.frequency === 'custom' && (
                  <p className="text-xs text-gray-500 mt-2">Select the days when this item should appear</p>
                )}
              </div>
            )}

            {/* Time of Day Pills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Time of Day</label>
              <div className="grid grid-cols-2 gap-2">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, time_preference: option.value }))}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center space-x-2 ${
                      formData.time_preference === option.value
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-base">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector - Only for supplements */}
            {itemType === 'supplements' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Advanced Details - Collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-3 text-left"
            >
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Advanced Details
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvanced && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Supplements-specific fields */}
                {itemType === 'supplements' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dose</label>
                      <input
                        type="text"
                        value={formData.dose}
                        onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 1000 IU, 2 caps"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Thorne, NOW Foods"
                      />
                    </div>
                  </>
                )}

                {/* Movement-specific fields */}
                {itemType === 'movement' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration/Sets</label>
                    <input
                      type="text"
                      value={formData.dose} // Reuse dose field for duration
                      onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., 30 minutes, 3 sets of 10"
                    />
                  </div>
                )}

                {/* Food-specific fields */}
                {itemType === 'food' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Portion/Amount</label>
                    <input
                      type="text"
                      value={formData.dose} // Reuse dose field for portion
                      onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., 1 cup, 100g, 1 serving"
                    />
                  </div>
                )}

                {/* Mindfulness-specific fields */}
                {itemType === 'mindfulness' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <input
                      type="text"
                      value={formData.dose} // Reuse dose field for duration
                      onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                      placeholder="e.g., 10 minutes, 5 breaths"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>
            )}
          </div>

            </div>

            {/* Bottom CTA - Sticky */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6 mt-4">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : '+ Add to Schedule'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false)
          onClose() // Close the add form too
        }}
        itemType={itemType === 'supplements' ? 'supplement' : 
                  itemType === 'movement' ? 'movement' :
                  itemType === 'mindfulness' ? 'mindfulness' :
                  itemType === 'food' ? 'file' : 'supplement'}
        currentCount={limitInfo.currentCount}
        limit={limitInfo.limit}
      />
    </div>
  )
}