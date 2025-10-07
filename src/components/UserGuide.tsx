'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, HelpCircle, MapPin, MousePointer, BarChart3, Calendar, Plus, Eye, Share2, BookOpen, Settings } from 'lucide-react'

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
    id: 'add-items',
    title: 'Add Your Stack',
    description: 'Build your biohacking stack by adding supplements, protocols, movement routines, and mindfulness practices. You can add items directly from the dashboard using the "+" buttons, or click the "Manage" button to go to the full management page.',
    target: '[data-tour="add-items"]',
    position: 'bottom',
    icon: <Plus className="w-6 h-6" />,
    action: 'Click any "+" button to add an item!'
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    description: 'Your dashboard shows all items scheduled for TODAY. To see all your supplements, protocols, and other items from all time, click "Manage" or visit your public profile. You can check off items throughout the day to track your progress.',
    target: '[data-tour="add-items"]',
    position: 'bottom',
    icon: <BarChart3 className="w-6 h-6" />,
    action: 'Notice how you can check off items as you take them!'
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
           id: 'public-profile',
           title: 'Your Public Profile',
           description: 'Share your biohacking journey with others! You can share with friends, socials, doctors, or whatever. Click the profile link button to get your shareable link.',
           target: '[data-tour="public-profile"]',
           position: 'left',
           icon: <Eye className="w-6 h-6" />,
           action: 'Click the link button to get your shareable profile URL!'
         },
  {
    id: 'settings',
    title: 'Settings & Email',
    description: 'Customize your profile, manage your subscription, and configure email settings. You can schedule daily reminder emails to see what you need to take and do each day. Set up follower notifications and manage your email preferences.',
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

export default function UserGuide({ isOpen, onClose, onComplete }: UserGuideProps) {
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
                      <Plus className="w-5 h-5 text-purple-500 mr-2" />
                      <h4 className="font-medium">Build Your Stack</h4>
                    </div>
                    <p className="text-sm text-gray-600">Add supplements, protocols, movement, and mindfulness. Use "+" buttons or "Manage" for full control.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                      <h4 className="font-medium">Dashboard</h4>
                    </div>
                    <p className="text-sm text-gray-600">Shows today's items. Check off as you take them to track progress throughout the day.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-5 h-5 text-green-500 mr-2" />
                      <h4 className="font-medium">Mood Tracking</h4>
                    </div>
                    <p className="text-sm text-gray-600">Track daily mood, sleep, and pain. Click heatmap to see detailed day information.</p>
                  </div>

                         <div className="bg-gray-50 rounded-lg p-4">
                           <div className="flex items-center mb-2">
                             <Eye className="w-5 h-5 text-orange-500 mr-2" />
                             <h4 className="font-medium">Public Profile</h4>
                           </div>
                           <p className="text-sm text-gray-600">Share with friends, socials, doctors, or whatever. Click the profile link button to get your shareable URL.</p>
                         </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Settings className="w-5 h-5 text-gray-500 mr-2" />
                      <h4 className="font-medium">Settings & Email</h4>
                    </div>
                    <p className="text-sm text-gray-600">Schedule daily reminders, manage follower notifications, and customize your experience.</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Share2 className="w-5 h-5 text-indigo-500 mr-2" />
                      <h4 className="font-medium">Sharing</h4>
                    </div>
                    <p className="text-sm text-gray-600">Share your profile link with others. Followers get weekly email updates when you make changes.</p>
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
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Add items to your stack</p>
                      <p className="text-sm text-gray-600">Use "+" buttons for quick adds, or "Manage" for full control</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Check off items as you take them</p>
                      <p className="text-sm text-gray-600">Track your daily progress by checking off supplements and protocols</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Click the heatmap</p>
                      <p className="text-sm text-gray-600">Click any day to see detailed information about that day</p>
                    </div>
                  </div>
                         <div className="flex items-start space-x-3">
                           <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                           <div>
                             <p className="font-medium">Share your profile</p>
                             <p className="text-sm text-gray-600">Click the profile link button to get your shareable URL</p>
                           </div>
                         </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Set up email reminders</p>
                      <p className="text-sm text-gray-600">Go to Settings to schedule daily emails with your stack</p>
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
                    <li>• <strong>Dashboard vs Public Profile:</strong> Dashboard shows today's items, Public Profile shows everything</li>
                    <li>• <strong>Check off items:</strong> Mark supplements and protocols as taken throughout the day</li>
                    <li>• <strong>Email reminders:</strong> Set up daily emails in Settings to never miss your stack</li>
                    <li>• <strong>Followers & Updates:</strong> People can follow your profile and get weekly email updates</li>
                    <li>• <strong>Mood tracking:</strong> Your mood data is private by default - only you can see it</li>
                    <li>• <strong>Heatmap insights:</strong> Click any day to see detailed information about that day</li>
                    <li>• <strong>Sharing:</strong> Use the link button to share your profile with others</li>
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
