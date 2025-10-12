'use client'

import { useState, useEffect } from 'react'
import { X, Check, Copy, ExternalLink } from 'lucide-react'
import EnhancedDayDrawerV2 from '@/app/components/mood/EnhancedDayDrawerV2'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  currentStep: number
  onStepComplete: (step: number) => void
  onComplete: () => void
  onSkip?: (step: number) => void
  userProfile?: any
}

export default function OnboardingModal({ 
  isOpen, 
  onClose, 
  currentStep, 
  onStepComplete, 
  onComplete,
  onSkip,
  userProfile 
}: OnboardingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [supplementName, setSupplementName] = useState('')
  const [supplementDose, setSupplementDose] = useState('')
  const [supplementTiming, setSupplementTiming] = useState('morning')
  const [missionStatement, setMissionStatement] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [publicLink, setPublicLink] = useState('')
  
  // Step 1 - Check-in drawer state
  const [showCheckinDrawer, setShowCheckinDrawer] = useState(false)
  const [checkinCompleted, setCheckinCompleted] = useState(false)
  
  // Copy feedback
  const [copied, setCopied] = useState(false)
  
  // Import chip catalog for professional mood chips
  const [selectedMoodChips, setSelectedMoodChips] = useState<string[]>([])
  
  // Get expressive mood chips from catalog (mix of good, moderate, and bad)
  const { getExpressiveChipsByEnergy, CHIP_CATALOG } = require('@/lib/constants/chip-catalog')
  const expressiveHighChips = getExpressiveChipsByEnergy('high').slice(0, 4) // 4 positive
  const expressiveLowChips = getExpressiveChipsByEnergy('low').slice(0, 4) // 4 negative
  const expressiveNeutralChips = getExpressiveChipsByEnergy('neutral').slice(0, 6) // 6 moderate
  const moodChips = [...expressiveHighChips, ...expressiveNeutralChips, ...expressiveLowChips]
  
  const toggleMoodChip = (slug: string) => {
    if (selectedMoodChips.includes(slug)) {
      setSelectedMoodChips(selectedMoodChips.filter(s => s !== slug))
    } else if (selectedMoodChips.length < 4) {
      setSelectedMoodChips([...selectedMoodChips, slug])
    }
  }

  useEffect(() => {
    console.log('🎯 OnboardingModal - Current step changed:', currentStep)
    
    // Show check-in drawer when on Step 1
    if (currentStep === 1) {
      setShowCheckinDrawer(true)
    }
    
    // Generate public link when component mounts or step changes
    if (userProfile?.slug && !publicLink) {
      setPublicLink(`${window.location.origin}/biostackr/${userProfile.slug}?public=true`)
    }
  }, [currentStep, userProfile, publicLink])

  // Auto-advance to Step 2 when check-in drawer is closed on Step 1
  useEffect(() => {
    if (currentStep === 1 && !showCheckinDrawer && !checkinCompleted) {
      console.log('🎯 OnboardingModal - Check-in drawer closed on Step 1, auto-advancing to Step 2')
      // Auto-advance to Step 2 after a short delay
      setTimeout(() => {
        onStepComplete(1)
      }, 500) // 500ms delay to ensure smooth transition
    }
  }, [currentStep, showCheckinDrawer, checkinCompleted, onStepComplete])
  
  const handleSkip = (stepToSkip: number) => {
    console.log('🎯 OnboardingModal - Skipping step:', stepToSkip)
    // Call parent skip handler - parent will manage step advancement
    if (onSkip) {
      onSkip(stepToSkip)
    }
  }

  const handleCheckinComplete = async () => {
    console.log('🎯 OnboardingModal - Check-in completed')
    
    // Mark check-in as completed
    setCheckinCompleted(true)
    
    // Close the check-in drawer
    setShowCheckinDrawer(false)
    
    try {
      // Enable follow stack by default
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allow_stack_follow: true
        })
      })
      
      // Move to Step 2
      onStepComplete(1)
    } catch (error) {
      console.error('❌ Error updating profile:', error)
      // Still proceed to next step even if this fails
      onStepComplete(1)
    }
  }

  const handleStep2Complete = async () => {
    if (!supplementName.trim()) return
    
    setIsLoading(true)
    try {
      console.log('🎯 Step 2 - Adding supplement to database...')
      
      // Add supplement to stack IMMEDIATELY
      const response = await fetch('/api/stack-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supplementName,
          dose: supplementDose,
          item_type: 'supplements',
          frequency: 'daily'
        })
      })
      
      if (response.ok) {
        console.log('✅ Supplement saved to database')
        
        // Let parent handler update the database (avoid double updates)
        onStepComplete(2)
      } else {
        console.error('❌ Failed to save supplement')
      }
    } catch (error) {
      console.error('Error adding supplement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep3Complete = async () => {
    if (!missionStatement.trim()) return
    
    setIsLoading(true)
    try {
      // First, handle profile photo upload if provided
      if (profilePhoto && userProfile?.user_id) {
        const formData = new FormData()
        formData.append('file', profilePhoto)
        formData.append('type', 'avatar')
        formData.append('userId', userProfile.user_id)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadResponse.json()
        
        if (uploadData.url) {
          // Update profile with avatar URL and mission statement
          const profileResponse = await fetch('/api/profile/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatar_url: uploadData.url,
              bio: missionStatement,
              onboarding_step: 3,
              profile_created: true,
              allow_stack_follow: true
            })
          })
          
          if (profileResponse.ok) {
            const link = `${window.location.origin}/biostackr/${userProfile?.slug || 'your-profile'}?public=true`
            console.log('🔗 Generated public link:', link)
            setPublicLink(link)
            
            // Only call parent handler - don't update local step
            onStepComplete(3)
          }
        }
      } else {
        // No photo, just update mission statement
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bio: missionStatement,
            onboarding_step: 3,
            profile_created: true,
            allow_stack_follow: true
          })
        })
        
        if (response.ok) {
          const link = `${window.location.origin}/biostackr/${userProfile?.slug || 'your-profile'}?public=true`
          console.log('🔗 Generated public link:', link)
          setPublicLink(link)
          
          // Only call parent handler - don't update local step
          onStepComplete(3)
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep4Complete = async () => {
    setIsLoading(true)
    try {
      // Mark onboarding as complete
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onboarding_completed: true,
          onboarding_step: 4
        })
      })
      
      if (response.ok) {
        // Send welcome email
        try {
          console.log('📧 Triggering welcome email for:', userProfile?.display_name, userProfile?.slug)
          const emailResponse = await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userProfile?.display_name || 'there',
              slug: userProfile?.slug
            })
          })
          
          const emailResult = await emailResponse.json()
          console.log('📧 Welcome email response:', emailResult)
          
          if (emailResponse.ok) {
            console.log('✅ Welcome email sent successfully')
          } else {
            console.error('❌ Welcome email failed:', emailResult)
          }
        } catch (emailError) {
          console.error('❌ Welcome email failed (non-blocking):', emailError)
          // Don't block onboarding completion if email fails
        }
        
        onStepComplete(4)
        onComplete()
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const openPublicPage = () => {
    window.open(publicLink, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-0" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f3f4f6',
        boxSizing: 'border-box'
      }}>
        {/* Welcome Banner */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Welcome to BioStackr!</h1>
              <p className="text-xs sm:text-sm text-gray-600">Let's get you set up in 4 quick steps</p>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <span className="text-xs font-medium text-gray-600">
                Step {currentStep} of 4
              </span>
              <span className="text-xs text-gray-500 ml-2 hidden sm:inline">
                {currentStep === 1 && 'Complete your first check-in'}
                {currentStep === 2 && 'Add your first supplement'}
                {currentStep === 3 && 'Create your profile (optional)'}
                {currentStep === 4 && 'View your public page (optional)'}
              </span>
            </div>
            {/* Only show X button for steps 3-4 */}
            {(currentStep === 3 || currentStep === 4) && onSkip && (
              <button
                onClick={() => onSkip(currentStep)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: First Check-In - Uses Enhanced Check-in Drawer */}
        {currentStep === 1 && !checkinCompleted && (
          <div className="px-6 py-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Complete Your First Check-In
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                The check-in modal will open automatically. You only need to complete the 3 sliders (Mood, Sleep, Pain). All other sections are optional!
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Add First Supplement */}
        {currentStep === 2 && (
          <div className="px-6 py-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Add Your First Supplement or Medication
              </h2>
              <p className="text-sm text-gray-600">
                Start building your stack with one supplement, medication, or protocol
              </p>
            </div>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={supplementName}
                  onChange={(e) => setSupplementName(e.target.value)}
                  placeholder="e.g., Magnesium 400mg, BPC-157 peptide, Metformin"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dose <span className="text-gray-500">(optional)</span></label>
                <input
                  type="text"
                  value={supplementDose}
                  onChange={(e) => setSupplementDose(e.target.value)}
                  placeholder="e.g., 400mg, 1 capsule, 250mcg"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time of day</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSupplementTiming('morning')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      supplementTiming === 'morning'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    onClick={() => setSupplementTiming('midday')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      supplementTiming === 'midday'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Midday
                  </button>
                  <button
                    onClick={() => setSupplementTiming('afternoon')}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                      supplementTiming === 'afternoon'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Afternoon
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleStep2Complete}
              disabled={!supplementName.trim() || isLoading}
              className="w-full bg-gray-900 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Adding...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 3: Create Profile */}
        {currentStep === 3 && (
          <div className="px-6 py-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Want to share your journey?
              </h2>
              <p className="text-sm text-gray-600">
                Create your profile to share with doctors, coaches, or friends. Takes 30 seconds.
              </p>
            </div>
            
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Profile Photo <span className="text-gray-500">(optional)</span></label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">What are you optimizing for?</label>
                <textarea
                  value={missionStatement}
                  onChange={(e) => setMissionStatement(e.target.value)}
                  placeholder="e.g., Managing chronic pain and improving sleep quality"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              {onSkip && (
                <button
                  onClick={() => handleSkip(3)}
                  className="w-full sm:w-auto text-gray-600 py-1.5 px-4 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Skip for now
                </button>
              )}
              <button
                onClick={handleStep3Complete}
                disabled={!missionStatement.trim() || isLoading}
                className="w-full sm:flex-1 bg-gray-900 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors order-1 sm:order-2"
              >
                {isLoading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: View Public Page */}
        {currentStep === 4 && (
          <div className="px-6 py-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your profile is ready!
              </h2>
              <p className="text-sm text-gray-600">
                View your profile page by clicking the link below. You can share it with your doctor, coach, friends, or support network to follow your health journey.
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
              <div className="flex items-center space-x-2 mb-2">
                <ExternalLink className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-700">Your shareable link</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={publicLink}
                  readOnly
                  className="flex-1 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600"
                />
                <button
                  onClick={copyPublicLink}
                  className={`p-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  title={copied ? 'Copied!' : 'Copy link'}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={openPublicPage}
                  className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Open your public page"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              {copied && (
                <p className="text-green-600 text-xs font-medium mt-2">
                  Link copied to clipboard
                </p>
              )}
            </div>

            <button
              onClick={handleStep4Complete}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Success Messages */}
        {currentStep > 1 && (
          <div className="px-8 pb-4">
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentStep === 2 && 'First check-in logged!'}
                {currentStep === 3 && 'Supplement added to your stack!'}
                {currentStep === 4 && 'Profile created successfully!'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Check-in Drawer - For First Check-In */}
      {showCheckinDrawer && userProfile?.id && (
        <EnhancedDayDrawerV2
          isOpen={showCheckinDrawer}
          onClose={handleCheckinComplete}
          date={new Date().toISOString().split('T')[0]}
          userId={userProfile.id}
          isFirstCheckIn={true}
          todayItems={{
            supplements: [],
            protocols: [],
            movement: [],
            mindfulness: [],
            food: [],
            gear: []
          }}
          initialData={null}
        />
      )}
    </div>
  )
}
