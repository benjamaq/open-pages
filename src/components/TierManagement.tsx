'use client'

import { useState, useEffect } from 'react'
import { Crown, Zap, Palette, Check } from 'lucide-react'

interface TierManagementProps {
  currentTier: 'free' | 'pro' | 'creator'
  isOwner: boolean
}

export default function TierManagement({ currentTier, isOwner }: TierManagementProps) {
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'creator'>(currentTier)
  const [trialStatus, setTrialStatus] = useState<{
    isInTrial: boolean
    daysRemaining: number
  } | null>(null)

  useEffect(() => {
    fetchTrialStatus()
  }, [])

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial-status')
      if (response.ok) {
        const data = await response.json()
        setTrialStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error)
    }
  }

  if (!isOwner) {
    return null
  }

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: '/month',
      icon: '🆓',
      color: 'gray',
      features: [
        '10 supplements',
        '3 protocols',
        '2 movement items',
        '2 mindfulness items',
        '5 file uploads',
        'Public profile',
        'Daily check-ins'
      ],
      current: currentTier === 'free',
      trialActive: trialStatus?.isInTrial && currentTier === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: '/month',
      icon: '⚡',
      color: 'blue',
      features: [
        'Everything in Free',
        'Unlimited supplements',
        'Unlimited protocols',
        'Unlimited movement & mindfulness',
        'Unlimited library files',
        'Featured Current Plan',
        'Priority support'
      ],
      current: currentTier === 'pro'
    },
    {
      id: 'creator',
      name: 'Creator',
      price: '$29.95',
      period: '/month',
      icon: '🎨',
      color: 'purple',
      features: [
        'Everything in Pro',
        'Affiliate links & buy buttons',
        'Custom logo upload',
        'Shop My Gear page',
        'Copy stack analytics',
        'Creator support',
        'Custom branding'
      ],
      current: currentTier === 'creator'
    }
  ]

  const handleUpgrade = (tier: 'pro' | 'creator') => {
    // Redirect to the appropriate pricing page
    if (tier === 'pro') {
      window.location.href = '/pricing/pro'
    } else if (tier === 'creator') {
      window.location.href = '/pricing/creator'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Subscription Plan</h3>
          <p className="text-sm text-gray-600">Manage your BioStackr subscription</p>
        </div>
      </div>

      <div className="space-y-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`border rounded-xl p-4 transition-all ${
              tier.current
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-600">{tier.period}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {tier.current && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                    Current Plan
                  </span>
                )}
                
                {tier.id === 'free' && trialStatus?.isInTrial && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                    Pro Trial Active ({trialStatus.daysRemaining} days left)
                  </span>
                )}
                
                {!tier.current && tier.id !== 'free' && (
                  <button
                    onClick={() => handleUpgrade(tier.id as 'pro' | 'creator')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      tier.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Tier Benefits Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-medium text-gray-900 mb-2">Tier Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-600">🆓</span>
              <span className="font-medium">Free</span>
            </div>
            <p className="text-gray-600">Perfect for getting started</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Pro</span>
            </div>
            <p className="text-gray-600">For serious health optimizers</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Creator</span>
            </div>
            <p className="text-gray-600">For coaches & influencers</p>
          </div>
        </div>
      </div>

      {/* Billing Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Cancel anytime. No long-term contracts.</p>
        <p>Annual plans save 20% (2 months free).</p>
      </div>
    </div>
  )
}
