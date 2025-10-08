'use client'

import { useState, useEffect } from 'react'
import { X, Check, Copy, ExternalLink } from 'lucide-react'

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
  
  // Step 1 - Check-in values
  const [mood, setMood] = useState(5)
  const [sleepQuality, setSleepQuality] = useState(5)
  const [pain, setPain] = useState(1)
  
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
    
    // Generate public link when component mounts or step changes
    if (userProfile?.slug && !publicLink) {
      setPublicLink(`${window.location.origin}/biostackr/${userProfile.slug}?public=true`)
    }
  }, [currentStep, userProfile, publicLink])
  
  const handleSkip = (stepToSkip: number) => {
    console.log('🎯 OnboardingModal - Skipping step:', stepToSkip)
    // Call parent skip handler - parent will manage step advancement
    if (onSkip) {
      onSkip(stepToSkip)
    }
  }

  const handleStep1Complete = async () => {
    setIsLoading(true)
    try {
      // Save the daily entry using the mood API
      const { saveDailyEntry } = await import('@/lib/db/mood')
      
      const entryData = {
        localDate: new Date().toISOString().split('T')[0],
        mood,
        sleep_quality: sleepQuality,
        pain,
        sleep_hours: null,
        night_wakes: null,
        tags: selectedMoodChips,
        journal: null,
        completedItems: null,
        wearables: null
      }
      
      console.log('🎯 Onboarding Step 1 - Saving check-in:', entryData)
      
      const result = await saveDailyEntry(entryData)
      
      console.log('✅ Check-in saved successfully:', result)
      
      // Enable follow stack by default
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allow_stack_follow: true
        })
      })
      
      // Let parent handler update the database (avoid double updates)
      onStepComplete(1)
    } catch (error) {
      console.error('❌ Error completing step 1:', error)
    } finally {
      setIsLoading(false)
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
          await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: userProfile?.display_name || 'there',
              slug: userProfile?.slug
            })
          })
          console.log('✅ Welcome email triggered')
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
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f3f4f6',
        boxSizing: 'border-box'
      }}>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 rounded-t-xl text-center">
          <h1 className="text-xl font-bold">Welcome to BioStackr!</h1>
          <p className="text-sm text-gray-300 mt-1">Let's get you set up in 4 quick steps</p>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-gray-100 p-3">
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

        {/* Step 1: First Check-In */}
        {currentStep === 1 && (
          <div className="p-6">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                How are you feeling today?
              </h2>
              <p className="text-sm text-gray-600">
                Let's create your first data point. Track your mood, sleep quality, and pain levels.
              </p>
            </div>
            
            <div className="space-y-4 mb-5">
              {/* Mood Slider */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Mood</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={mood} 
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="flex-1 h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 min-w-[3.5rem] text-center">
                    {mood}/10
                  </span>
                </div>
              </div>
              
              {/* Sleep Quality Slider */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Sleep Quality</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={sleepQuality}
                    onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                    className="flex-1 h-2.5 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 min-w-[3.5rem] text-center">
                    {sleepQuality}/10
                  </span>
                </div>
              </div>
              
              {/* Pain Level Slider */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Pain Level</label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={pain}
                    onChange={(e) => setPain(parseInt(e.target.value))}
                    className="flex-1 h-2.5 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 min-w-[3.5rem] text-center">
                    {pain}/10
                  </span>
                </div>
              </div>
              
              {/* Mood Chips */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">How are you feeling?</label>
                  <span className="text-xs text-gray-500">
                    Choose up to 4
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto w-full" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#d1d5db #f3f4f6',
                  boxSizing: 'border-box'
                }}>
                  <div className="flex flex-wrap gap-2">
                    {moodChips.map((chip: any) => {
                      const isSelected = selectedMoodChips.includes(chip.slug)
                      const isDisabled = !isSelected && selectedMoodChips.length >= 4
                      return (
                        <button
                          key={chip.slug}
                          onClick={() => toggleMoodChip(chip.slug)}
                          disabled={isDisabled}
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                              : isDisabled
                              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {chip.icon} {chip.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStep1Complete}
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Logging...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Add First Supplement */}
        {currentStep === 2 && (
          <div className="p-6">
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
          <div className="p-6">
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
          <div className="p-6">
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
    </div>
  )
}
