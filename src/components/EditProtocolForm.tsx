'use client'

import { useState } from 'react'
import { updateProtocol } from '../lib/actions/protocols'
import { useRouter } from 'next/navigation'

interface Protocol {
  id: string
  name: string
  description: string | null
  frequency: string | null
  time_preference: string | null
  schedule_days: number[] | null
  public: boolean
}

interface EditProtocolFormProps {
  protocol: Protocol
  onClose: () => void
}

export default function EditProtocolForm({ protocol, onClose }: EditProtocolFormProps) {
  const [formData, setFormData] = useState({
    name: protocol.name,
    description: protocol.description || '',
    frequency: protocol.frequency || 'weekly',
    time_preference: protocol.time_preference || 'anytime',
    schedule_days: protocol.schedule_days || [0, 1, 2, 3, 4, 5, 6],
    public: protocol.public
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!formData.name.trim()) {
      setError('Name is required.')
      setIsLoading(false)
      return
    }

    try {
      await updateProtocol(protocol.id, {
        name: formData.name,
        description: formData.description || undefined,
        frequency: formData.frequency,
        time_preference: formData.time_preference,
        schedule_days: formData.schedule_days,
        public: formData.public
      })
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFrequencyChange = (frequency: string) => {
    let defaultDays = [0, 1, 2, 3, 4, 5, 6] // All days
    
    if (frequency === 'weekly') {
      defaultDays = [1] // Default to Monday for weekly
    } else if (frequency === 'bi-weekly') {
      defaultDays = [1] // Default to Monday for bi-weekly
    }
    
    setFormData(prev => ({
      ...prev,
      frequency,
      schedule_days: frequency === 'custom' ? prev.schedule_days : defaultDays
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Edit Protocol</h2>
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
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  className="w-full text-lg font-medium px-0 py-3 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent placeholder-gray-400"
                  placeholder="Protocol name..."
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
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
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
                    {formData.frequency === 'weekly' ? 'Select day(s) for weekly schedule' :
                     formData.frequency === 'bi-weekly' ? 'Select day(s) for bi-weekly schedule' :
                     'Select Days'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDayToggle(index)}
                        className={`w-10 h-10 rounded-full text-sm font-medium border-2 transition-all ${
                          formData.schedule_days.includes(index)
                            ? 'bg-gray-900 text-white border-gray-900 shadow-sm transform scale-105'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                  {formData.frequency === 'bi-weekly' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Bi-weekly items will appear every other week on the selected day(s)
                    </p>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Describe your protocol, benefits, or any notes..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom CTA - Sticky */}
            <div className="sticky bottom-0 bg-white pt-4 -mx-6 px-6 pb-6">
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
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
