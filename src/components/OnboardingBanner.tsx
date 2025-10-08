'use client'

import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { getOnboardingBannerMessage, getOnboardingBannerAction, shouldShowProfileBanner } from '@/lib/onboarding'

interface OnboardingBannerProps {
  profile: any
  onStartOnboarding: () => void
}

export default function OnboardingBanner({ profile, onStartOnboarding }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const message = getOnboardingBannerMessage(profile)
  const actionText = getOnboardingBannerAction(profile)
  const isProfileBanner = shouldShowProfileBanner(profile)

  if (!message || isDismissed) return null

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-lg mb-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-indigo-200" />
          <div>
            <h3 className="font-semibold text-sm">
              {isProfileBanner ? 'Share your journey' : 'Complete your setup'}
            </h3>
            <p className="text-indigo-100 text-sm">{message}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onStartOnboarding}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
          >
            {actionText}
          </button>
          {/* Only show X button for optional profile banner (steps 3-4) */}
          {isProfileBanner && (
            <button
              onClick={() => setIsDismissed(true)}
              className="text-indigo-200 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
