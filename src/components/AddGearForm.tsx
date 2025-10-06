'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addGear } from '../lib/actions/gear'

interface AddGearFormProps {
  onClose: () => void
}

export default function AddGearForm({ onClose }: AddGearFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'Wearables',
    description: '',
    buy_link: '',
    public: false
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      await addGear(formData)
      onClose()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const categoryOptions = [
    'Wearables',
    'Recovery',
    'Kitchen',
    'Fitness',
    'Sleep',
    'Other'
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add Device</h2>
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
                <textarea
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-lg font-medium px-0 py-4 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent placeholder-gray-400 resize-none overflow-hidden min-h-[3rem]"
                  placeholder="Device name..."
                  rows={2}
                  required
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.max(target.scrollHeight, 48) + 'px';
                  }}
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

            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                required
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., WHOOP, Eig"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 4.0, Gen3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Describe your gear..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buy Link</label>
                    <input
                      type="url"
                      name="buy_link"
                      value={formData.buy_link}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Affiliate Links Coming Soon */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 text-sm">✨</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-purple-900">Affiliate Links</h4>
                        <p className="text-xs text-purple-700 mt-1">
                          Coming soon! You'll be able to add affiliate links to earn commissions.
                        </p>
                      </div>
                    </div>
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
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}