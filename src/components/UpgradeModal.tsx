'use client'

import { useState } from 'react'
import { X, Zap, Check } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  itemType: string
  currentCount: number
  limit: number
}

const itemTypeLabels: Record<string, string> = {
  supplement: 'supplements',
  protocol: 'protocols',
  movement: 'movement items',
  mindfulness: 'mindfulness items',
  file: 'files',
  followers: 'followers'
}

const proFeatures = [
  'Unlimited supplements, protocols, movement & mindfulness',
  '100 file uploads (1GB storage)',
  'Unlimited followers & weekly digest emails',
  'Advanced analytics & trends',
  'Priority support'
]

export default function UpgradeModal({ isOpen, onClose, itemType, currentCount, limit }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false)

  if (!isOpen) return null

  const itemLabel = itemTypeLabels[itemType] || itemType

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      // For now, redirect to a pricing page
      // In production, this would integrate with Stripe
      window.open('/pricing', '_blank')
    } catch (error) {
      console.error('Error upgrading:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upgrade to Pro</h2>
              <p className="text-sm text-gray-500">You've reached your free limit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Limit Message */}
          <div className="text-center">
            <p className="text-gray-700">
              You've used <span className="font-semibold">{currentCount} of {limit}</span> free {itemLabel}.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Upgrade to Biostackr Pro to unlock unlimited {itemLabel} and more powerful features.
            </p>
          </div>

          {/* Pro Features */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">What you'll get with Pro:</h3>
            <div className="space-y-2">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-900">$9.99</div>
            <div className="text-sm text-green-700">per month</div>
            <div className="text-xs text-green-600 mt-1">Cancel anytime</div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro'}
          </button>
        </div>
      </div>
    </div>
  )
}
