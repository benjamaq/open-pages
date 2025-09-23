'use client'

import { useState, useEffect } from 'react'
import { addGear } from '../lib/actions/gear'
import { getUserTier } from '../lib/actions/subscriptions'
import { useRouter } from 'next/navigation'

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
    buy_link: '', // Pro feature
    status: 'current', // current or past
    public: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'creator'>('free')
  const router = useRouter()

  // Check user's tier
  useEffect(() => {
    const checkUserTier = async () => {
      try {
        const tier = await getUserTier()
        setUserTier(tier)
      } catch (error) {
        console.error('Error fetching user tier:', error)
        setUserTier('free')
      }
    }
    
    checkUserTier()
  }, [])

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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🎧</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Gear</h2>
                <p className="text-sm text-gray-500">Add equipment to your stack</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Core Info Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder="e.g., WHOOP 4.0, Pod 4 Ultra"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="brand" className="block text-sm font-semibold text-gray-900">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="e.g., WHOOP, Eight Sleep"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="model" className="block text-sm font-semibold text-gray-900">
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="e.g., 4.0, Gen3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-900">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  >
                    {categoryOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-900">
                    Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  >
                    <option value="current">Current</option>
                    <option value="past">Past</option>
                  </select>
                  <p className="text-xs text-gray-500">Track gear you're using now vs. gear you've used before</p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                  placeholder="How do you use this gear? What do you like about it?"
                />
              </div>
            </div>

            {/* Affiliate Section (Creator Only) */}
            {userTier === 'creator' ? (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">💰 Affiliate Link</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">CREATOR</span>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="buy_link" className="block text-sm font-medium text-gray-700">
                    Affiliate Link (Optional)
                  </label>
                  <input
                    type="url"
                    id="buy_link"
                    name="buy_link"
                    value={formData.buy_link}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                    placeholder="https://affiliate-link.com/..."
                  />
                  <p className="text-xs text-gray-500">
                    Add your affiliate link to earn commissions when people buy this gear
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-gray-300 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">💰 Affiliate Links</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Add buy links to earn commissions from your gear recommendations
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      onClose() // Close the gear form first
                      window.location.href = '/upgrade/creator' // Navigate to creator upgrade page
                    }}
                    className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
                  >
                    Upgrade to Creator
                  </button>
                </div>
              </div>
            )}

            {/* Visibility Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Visibility
              </label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="public"
                  name="public"
                  checked={formData.public}
                  onChange={handleChange}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="public" className="block text-sm font-medium text-gray-900">
                    Show on my public profile
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Others will be able to see this gear when they visit your profile
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 p-6 pt-4">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="gear-form"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async (e) => {
                e.preventDefault()
                const form = document.querySelector('form')
                if (form) {
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                  form.dispatchEvent(formEvent)
                }
              }}
            >
              {isLoading ? 'Adding...' : 'Add Gear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}