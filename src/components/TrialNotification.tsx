'use client'

import { useState, useEffect } from 'react'
import { Crown, X, ArrowRight, Zap } from 'lucide-react'

interface TrialStatus {
  isInTrial: boolean
  daysRemaining: number
  trialStartedAt: string | null
  trialEndedAt: string | null
}

interface TrialNotificationProps {
  userId: string
  currentTier: 'free' | 'pro' | 'creator'
}

export default function TrialNotification({ userId, currentTier }: TrialNotificationProps) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user has dismissed trial notifications
    const dismissedKey = `trial-notification-dismissed-${userId}`
    const isDismissed = localStorage.getItem(dismissedKey) === 'true'
    setDismissed(isDismissed)

    fetchTrialStatus()
  }, [userId])

  const fetchTrialStatus = async () => {
    try {
      const response = await fetch('/api/trial-status')
      if (response.ok) {
        const data = await response.json()
        setTrialStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    const dismissedKey = `trial-notification-dismissed-${userId}`
    localStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
  }

  const handleUpgrade = () => {
    window.location.href = '/pricing'
  }

  if (loading || dismissed) {
    return null
  }

  // Don't show for Pro/Creator users
  if (currentTier !== 'free') {
    return null
  }

  // Don't show if not in trial
  if (!trialStatus?.isInTrial) {
    return null
  }

  const daysRemaining = trialStatus.daysRemaining
  const isExpiringSoon = daysRemaining <= 3

  if (isExpiringSoon) {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Pro trial expiring in {daysRemaining === 1 ? '1 day' : `${daysRemaining} days`}
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Continue enjoying unlimited supplements, protocols, and files. 
                Upgrade now to keep all your Pro features.
              </p>
              <button
                onClick={handleUpgrade}
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>
    )
  }

  // Show trial active notification (only show for first few days)
  if (daysRemaining > 10) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                🎉 Welcome to your Pro trial!
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                You have {daysRemaining} days to explore unlimited supplements, protocols, 
                and all Pro features. No limits, no restrictions!
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleUpgrade}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade Now
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-xs text-blue-600">
                  Save 20% with annual billing
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>
    )
  }

  return null
}
