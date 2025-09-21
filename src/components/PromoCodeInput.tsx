'use client'

import { useState } from 'react'

interface PromoCodeInputProps {
  onPromoApplied: (promoCode: string, discount: { type: 'percent' | 'amount'; value: number; description: string }) => void
  onPromoRemoved: () => void
}

export default function PromoCodeInput({ onPromoApplied, onPromoRemoved }: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: { type: 'percent' | 'amount'; value: number; description: string } } | null>(null)

  const validatePromoCode = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      // Check for special promo codes
      const normalizedCode = code.toLowerCase().trim()
      
      if (normalizedCode === 'redditgo') {
        const discount = {
          type: 'percent' as const,
          value: 100, // 100% off for 6 months
          description: '6 months free Pro (Reddit exclusive)'
        }
        setAppliedPromo({ code, discount })
        onPromoApplied(code, discount)
        return
      }

      // For other codes, you would normally validate with Stripe
      // For now, we'll just show an error
      setError('Invalid promo code')
    } catch (err) {
      setError('Failed to validate promo code')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!promoCode.trim()) return
    validatePromoCode(promoCode)
  }

  const handleRemove = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setError('')
    onPromoRemoved()
  }

  if (appliedPromo) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">
                Promo code "{appliedPromo.code}" applied
              </p>
              <p className="text-xs text-green-700">
                {appliedPromo.discount.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter promo code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          onKeyPress={(e) => e.key === 'Enter' && handleApply()}
        />
        <button
          onClick={handleApply}
          disabled={loading || !promoCode.trim()}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-colors"
        >
          {loading ? 'Checking...' : 'Apply'}
        </button>
      </div>
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Have a promo code? Try "redditgo" for 6 months free Pro!</p>
      </div>
    </div>
  )
}
