'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface WhatsNextCardProps {
  profile: any
}

export default function WhatsNextCard({ profile }: WhatsNextCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!profile) {
      setIsVisible(false)
      return
    }
    
    // Check if user has completed onboarding
    const hasCompletedOnboarding = profile?.onboarding_completed === true
    
    // Check if card was previously dismissed
    const wasDismissed = localStorage.getItem('whatsNextDismissed') === 'true'
    
    // Show card only if onboarding is complete AND not previously dismissed
    setIsVisible(hasCompletedOnboarding && !wasDismissed)
  }, [profile])

  const handleDismiss = () => {
    localStorage.setItem('whatsNextDismissed', 'true')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-5 mb-6 relative">
      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-purple-400 hover:text-purple-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      
      <h3 className="text-base font-semibold text-gray-900 mb-3">
        🎉 Welcome to BioStackr! Here's how to get started:
      </h3>
      
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold mt-0.5">1.</span>
          <p>
            <strong>Build your stack:</strong> Scroll down to find modules for Supplements, Protocols, Movement, and Mindfulness. Click the <strong>Add</strong> button in each module to add items. Once added, they'll appear in your daily checklist at the top.
          </p>
        </div>
        
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold mt-0.5">2.</span>
          <p>
            <strong>Explore your heatmap:</strong> Scroll to the Mood Tracker and click the purple <strong>Heatmap</strong> button. As you add more daily check-ins, you'll see color patterns for your mood, pain, and sleep. Click any day to see exactly what you were taking and how you felt.
          </p>
        </div>
        
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold mt-0.5">3.</span>
          <p>
            <strong>Add a journal entry:</strong> Click <strong>Journal & Notes</strong> in the top navigation bar to record your thoughts and experiences. You can share these with your followers.
          </p>
        </div>
        
        <div className="flex items-start space-x-2">
          <span className="text-purple-600 font-bold mt-0.5">4.</span>
          <p>
            <strong>Customize your settings:</strong> Click <strong>Settings</strong> in the top right to set up daily email reminders and control what's visible on your public profile.
          </p>
        </div>
      </div>
    </div>
  )
}

