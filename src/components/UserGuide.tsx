'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, HelpCircle, MapPin, MousePointer, BarChart3, Calendar, Plus, Eye, Share2, BookOpen } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right'
  icon: React.ReactNode
  action?: string
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BioStackr! 🚀',
    description: 'Let\'s take a quick tour of your dashboard and key features.',
    target: 'body',
    position: 'top',
    icon: <HelpCircle className="w-6 h-6" />
  },
  {
    id: 'mood-tracker',
    title: 'Mood & Health Tracking',
    description: 'Track your daily mood, sleep, and pain levels. Click "Daily Check-in" to log your day, or "Heatmap" to see your progress over time.',
    target: '[data-tour="mood-tracker"]',
    position: 'bottom',
    icon: <BarChart3 className="w-6 h-6" />,
    action: 'Click the "Daily Check-in" button to see how it works!'
  },
  {
    id: 'heatmap-click',
    title: 'Interactive Heatmap',
    description: 'Click on any day in the heatmap to see detailed information about that day - your supplements, protocols, and mood data.',
    target: '[data-tour="heatmap"]',
    position: 'top',
    icon: <MousePointer className="w-6 h-6" />,
    action: 'Try clicking on a day in the heatmap!'
  },
  {
    id: 'add-items',
    title: 'Add Your Stack',
    description: 'Build your biohacking stack by adding supplements, protocols, movement routines, and mindfulness practices. Click the "+" buttons to get started.',
    target: '[data-tour="add-items"]',
    position: 'bottom',
    icon: <Plus className="w-6 h-6" />,
    action: 'Click any "+" button to add an item!'
  },
  {
    id: 'public-profile',
    title: 'Your Public Profile',
    description: 'Share your biohacking journey with others! Your public profile shows your stack, progress, and insights.',
    target: '[data-tour="public-profile"]',
    position: 'left',
    icon: <Eye className="w-6 h-6" />,
    action: 'Click "View Public Profile" to see how others see you!'
  },
  {
    id: 'settings',
    title: 'Customize Everything',
    description: 'Personalize your profile, manage your subscription, and configure your preferences in Settings.',
    target: '[data-tour="settings"]',
    position: 'right',
    icon: <Settings className="w-6 h-6" />,
    action: 'Visit Settings to customize your experience!'
  }
]

interface UserGuideProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export default function UserGuide({ isOverlay, onClose, onComplete }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Start the tour
      setTimeout(() => {
        highlightCurrentStep()
      }, 100)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, currentStep])

  const highlightCurrentStep = () => {
    const step = tourSteps[currentStep]
    if (step.target === 'body') {
      setTargetElement(document.body)
      return
    }

    const element = document.querySelector(step.target) as HTMLElement
    if (element) {
      setTargetElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      console.warn(`Tour target not found: ${step.target}`)
      setTargetElement(null)
    }
  }

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeTour = () => {
    setIsVisible(false)
    onComplete?.()
    onClose()
  }

  const skipTour = () => {
    setIsVisible(false)
    onClose()
  }

  if (!isOpen || !isVisible) return null

  const currentStepData = tourSteps[currentStep]

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
      
      {/* Spotlight effect */}
      {targetElement && targetElement !== document.body && (
        <div
          className="fixed inset-0 z-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${targetElement.offsetLeft + targetElement.offsetWidth / 2}px ${targetElement.offsetTop + targetElement.offsetHeight / 2}px, transparent 0px, transparent 200px, rgba(0,0,0,0.8) 300px)`
          }}
        />
      )}

      {/* Tour Card */}
      <div className="fixed z-50 max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
                <p className="text-sm text-blue-100">Step {currentStep + 1} of {tourSteps.length}</p>
              </div>
            </div>
            <button
              onClick={skipTour}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">{currentStepData.description}</p>
          
          {currentStepData.action && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800 font-medium">{currentStepData.action}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-2">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Complete' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Quick Help Component for persistent help
export function QuickHelp() {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-40 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        title="Quick Help"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Quick Help Guide</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                      <h4 className="font-medium">Mood Tracking</h4>
                    </div>
                    <p className="text-sm text-gray-600">Track daily mood, sleep, and pain. Click "Daily Check-in" to log your day.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="font-medium">Heatmap</h4>
                    </div>
                    <p className="text-sm text-gray-600">Click any day to see detailed information about your supplements and mood.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Plus className="w-5 h-5 text-purple-500 mr-2" />
                      <h4 className="font-medium">Build Your Stack</h4>
                    </div>
                    <p className="text-sm text-gray-600">Add supplements, protocols, movement, and mindfulness practices.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Eye className="w-5 h-5 text-orange-500 mr-2" />
                      <h4 className="font-medium">Public Profile</h4>
                    </div>
                    <p className="text-sm text-gray-600">Share your biohacking journey with others through your public profile.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MousePointer className="w-5 h-5 mr-2" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Click the heatmap</p>
                      <p className="text-sm text-gray-600">Click any day to see detailed information about that day</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Use the "+" buttons</p>
                      <p className="text-sm text-gray-600">Add new items to your stack in each category</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">View your public profile</p>
                      <p className="text-sm text-gray-600">See how others see your biohacking journey</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Pro Tips
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-yellow-800">
                    <li>• Your mood data is private by default - only you can see it</li>
                    <li>• Use the heatmap to track patterns in your health over time</li>
                    <li>• Share your public profile to connect with other biohackers</li>
                    <li>• Set up daily check-ins to build consistent tracking habits</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
