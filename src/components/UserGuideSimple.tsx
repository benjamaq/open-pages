'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  action?: string
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BioStackr! 🚀',
    description: 'Let\'s take a quick tour of your dashboard and key features.',
  },
  {
    id: 'add-items',
    title: 'Add Your Stack',
    description: 'Build your biohacking stack by adding supplements, protocols, movement routines, and mindfulness practices. You can add items directly from the dashboard using the "+" buttons, or click the "Manage" button to go to the full management page.',
    action: 'Click any "+" button to add an item!'
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Your dashboard shows all items scheduled for TODAY. To see all your supplements, protocols, and other items from all time, click "Manage" or visit your public profile. You can check off items throughout the day to track your progress.',
    action: 'Notice how you can check off items as you take them!'
  },
  {
    id: 'mood-tracker',
    title: 'Mood & Health Tracking',
    description: 'Track your daily mood, sleep, and pain levels. Click "Daily Check-in" to log your day, or "Heatmap" to see your progress over time.',
    action: 'Click the "Daily Check-in" button to see how it works!'
  },
  {
    id: 'heatmap-click',
    title: 'Interactive Heatmap',
    description: 'Click on any day in the heatmap to see detailed information about that day - your supplements, protocols, and mood data.',
    action: 'Try clicking on a day in the heatmap!'
  },
  {
    id: 'public-profile',
    title: 'Your Public Profile',
    description: 'Share your biohacking journey with others! You can share with friends, socials, doctors, or whatever. Click the profile link button to get your shareable link.',
    action: 'Click the link button to get your shareable profile URL!'
  },
  {
    id: 'settings',
    title: 'Settings & Email',
    description: 'Customize your profile, manage your subscription, and configure email settings. You can schedule daily reminder emails to see what you need to take and do each day. Set up follower notifications and manage your email preferences.',
    action: 'Visit Settings to customize your experience!'
  }
]

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function UserGuide({ isOpen, onClose, onComplete }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onComplete?.()
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  if (!isOpen) return null

  const currentTourStep = tourSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <HelpCircle className="w-6 h-6 mr-3 text-purple-600" />
            {currentTourStep.title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">{currentTourStep.description}</p>
          {currentTourStep.action && (
            <p className="text-sm text-purple-600 font-semibold mb-4 flex items-center">
              💡 {currentTourStep.action}
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <span className="text-sm text-gray-500">Step {currentStep + 1} of {tourSteps.length}</span>
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
                Previous
              </button>
            )}
            <button onClick={handleNext} className="px-3 py-1 rounded-md bg-gray-900 text-white text-sm hover:bg-black">
              {currentStep < tourSteps.length - 1 ? 'Next' : 'Finish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuickHelp() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all z-50"
        aria-label="Quick Help"
        title="Quick Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <HelpCircle className="w-6 h-6 mr-3 text-purple-600" />
                Quick Help & Guide
              </h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Build Your Stack</h4>
                    <p className="text-sm text-gray-600">Add supplements, protocols, movement, and mindfulness. Use "+" buttons or "Manage" for full control.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Dashboard</h4>
                    <p className="text-sm text-gray-600">Shows today's items. Check off as you take them to track progress throughout the day.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Mood Tracking</h4>
                    <p className="text-sm text-gray-600">Track daily mood, sleep, and pain. Click heatmap to see detailed day information.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Public Profile</h4>
                    <p className="text-sm text-gray-600">Share with friends, socials, doctors, or whatever. Click the profile link button to get your shareable URL.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
