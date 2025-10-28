'use client'

import { useState, useEffect, useRef } from 'react'
import { addStackItem } from '../lib/actions/stack'
import { useRouter } from 'next/navigation'
import { checkItemLimit } from '../lib/actions/trial-limits'
import UpgradeModal from './UpgradeModal'

interface AddStackItemFormProps {
  onClose: () => void
  itemType?: 'supplements' | 'movement' | 'food' | 'mindfulness'
  onSuccess?: (itemName: string) => void // Optional callback when item is successfully added
  isOnboarding?: boolean // When true, show onboarding-specific header and purple buttons
}

export default function AddStackItemForm({ onClose, itemType = 'supplements', onSuccess, isOnboarding = false }: AddStackItemFormProps) {
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

  // Body scroll lock (prevents iOS keyboard/viewport flicker behind modal)
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  // Check limits on mount (guard to avoid repeat calls that can cause flicker)
  const didCheckLimitsRef = useRef(false)
  useEffect(() => {
    if (didCheckLimitsRef.current) return
    didCheckLimitsRef.current = true
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
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(formData.name)
        // Don't call onClose() when onSuccess is provided - let the parent handle the flow
        return
      }
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-sm max-h-[82vh] sm:max-h-[82vh] flex flex-col overflow-hidden" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        {/* Header */}
        <div className="bg-white rounded-t-2xl border-b border-gray-100 p-2 sm:p-3">
          <div className="flex items-center justify-between">
            {itemType !== 'supplements' && (
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {itemType === 'movement' && 'Add Movement'}
                {itemType === 'mindfulness' && 'Add Mind & Stress'}
                {itemType === 'food' && 'Add Food'}
              </h2>
            )}
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
        <div className="flex-1 overflow-y-auto rounded-b-2xl" style={{ WebkitOverflowScrolling: 'touch' as any }}>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className={`flex-1 ${itemType === 'supplements' ? 'pt-1 sm:pt-2 px-3 sm:px-5' : 'p-3 sm:p-5'} space-y-3 sm:space-y-5`}>
            {itemType === 'supplements' && isOnboarding && (
              <div className="text-center">
                <div className="text-4xl mb-3">💙</div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">Add your first medication or supplement</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">You can edit or add more later.</p>
              </div>
            )}
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
                className={`w-full text-sm sm:text-base font-medium px-0 py-1.5 sm:py-2 border-0 border-b-2 border-gray-200 ${isOnboarding ? 'focus:border-purple-500' : 'focus:border-blue-500'} focus:outline-none bg-transparent placeholder-gray-400`}
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
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${!formData.public ? 'text-gray-900' : 'text-gray-400'}`}>
                  Private
                </span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, public: !prev.public }))}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    formData.public ? (isOnboarding ? 'bg-purple-600' : 'bg-gray-900') : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      formData.public ? 'translate-x-5' : 'translate-x-1'
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
              <div className="flex flex-wrap gap-1.5">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFrequencyChange(option.value)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium border-2 transition-all ${
                      formData.frequency === option.value
                        ? (isOnboarding ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-gray-900 text-white border-gray-900 shadow-sm')
                        : (isOnboarding ? 'bg-white text-gray-700 border-purple-200 hover:border-purple-300 hover:shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm')
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
                <div className="flex flex-wrap gap-1.5 sm:space-x-1.5 sm:gap-0">
                  {dayNames.map((day, index) => (
                  <button
                      key={index}
                      type="button"
                      onClick={() => handleDayToggle(index)}
                      className={`w-9 h-9 sm:w-9 sm:h-9 rounded-full text-[11px] sm:text-xs font-medium border-2 transition-all flex-shrink-0 ${
                        formData.schedule_days.includes(index)
                          ? (isOnboarding ? 'bg-purple-600 text-white border-purple-600 shadow-sm transform scale-105' : 'bg-gray-900 text-white border-gray-900 shadow-sm transform scale-105')
                          : (isOnboarding ? 'bg-white text-gray-700 border-purple-200 hover:border-purple-300 hover:shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm')
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
              <div className="grid grid-cols-2 gap-1.5">
                {timeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, time_preference: option.value }))}
                    className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border-2 transition-all flex items-center justify-center space-x-2 ${
                      formData.time_preference === option.value
                        ? (isOnboarding ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-gray-900 text-white border-gray-900 shadow-sm')
                        : (isOnboarding ? 'bg-white text-gray-700 border-purple-200 hover:border-purple-300 hover:shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm')
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-600' : 'focus:ring-gray-900'} focus:border-transparent bg-white text-sm`}
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
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200 text-sm">
                {/* Supplements-specific fields */}
                {itemType === 'supplements' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dose</label>
                      <input
                        type="text"
                        value={formData.dose}
                        onChange={(e) => setFormData(prev => ({ ...prev, dose: e.target.value }))}
                        className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent text-sm`}
                        placeholder="e.g., 1000 IU, 2 caps"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent text-sm`}
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
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent text-sm`}
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
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent text-sm`}
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
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent text-sm`}
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
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ${isOnboarding ? 'focus:ring-purple-500' : 'focus:ring-blue-500'} focus:border-transparent resize-none text-sm`}
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
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${isOnboarding ? 'border border-purple-200 text-purple-700 hover:bg-purple-50' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${isOnboarding ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
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