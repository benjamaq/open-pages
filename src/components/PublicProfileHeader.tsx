'use client'

import { useState, useEffect } from 'react'
import { Edit2 } from 'lucide-react'
import UnifiedHeaderEditor from './UnifiedHeaderEditor'
import FollowButton from './FollowButton'

interface PublicProfileHeaderProps {
  profile: any
  isOwnProfile: boolean
  followerCount?: number
  showFollowerCount?: boolean
  isSharedPublicLink?: boolean
  isBetaUser?: boolean
  onFollowSuccess?: () => void
}

export default function PublicProfileHeader({ profile, isOwnProfile, followerCount = 0, showFollowerCount = true, isSharedPublicLink = false, isBetaUser = false, onFollowSuccess }: PublicProfileHeaderProps) {
  const [showHeaderEditor, setShowHeaderEditor] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)


  const handleHeaderSave = async (data: {
    displayName: string
    mission: string | null
    eatingStyle: string
  }) => {
    const { updateUnifiedHeader } = await import('../lib/actions/unified-header')
    try {
      await updateUnifiedHeader(data)
      setCurrentProfile(prev => ({
        ...prev,
        display_name: data.displayName,
        bio: data.mission,
        nutrition_signature: {
          eating_style: data.eatingStyle,
          enabled: !!data.eatingStyle
        }
      }))
    } catch (error) {
      console.error('Failed to save header data:', error)
      throw error
    }
  }

  const getEatingStyle = () => {
    const signature = currentProfile.nutrition_signature as any
    return signature?.eating_style || ''
  }

  const getEatingStyleConfig = (style: string) => {
    const EATING_STYLES = [
      { value: '', label: 'Not specified', icon: '', color: '' },
      { value: 'Mediterranean', label: 'Mediterranean', icon: '🐟', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { value: 'Keto', label: 'Keto', icon: '🥑', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { value: 'Carnivore', label: 'Carnivore', icon: '🥩', color: 'bg-red-100 text-red-800 border-red-200' },
      { value: 'Plant-based', label: 'Plant-based', icon: '🌱', color: 'bg-green-100 text-green-800 border-green-200' },
      { value: 'Paleo', label: 'Paleo', icon: '🦴', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      { value: 'Whole foods', label: 'Whole foods', icon: '🥕', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      { value: 'High-protein', label: 'High-protein', icon: '💪', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { value: 'Low-carb', label: 'Low-carb', icon: '🚫', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      { value: 'Intermittent fasting', label: 'Intermittent fasting focused', icon: '⏰', color: 'bg-purple-100 text-purple-800 border-purple-200' }
    ]
    return EATING_STYLES.find(s => s.value === style) || EATING_STYLES[0]
  }

  const eatingStyle = getEatingStyle()
  const styleConfig = getEatingStyleConfig(eatingStyle)

  return (
    <>
      <div className="flex flex-wrap justify-center lg:justify-start gap-2">
        {/* Date Pill - Smaller */}
        <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium" style={{ color: '#5C6370' }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        

        {/* Eating Style Pill - Only show if user has set one, or if it's their own profile */}
        {eatingStyle && (
          <div className="px-3 py-1.5 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
            <span className="flex items-center gap-1.5">
              {styleConfig.icon && <span className="text-sm">{styleConfig.icon}</span>}
              <span>Eating style: {eatingStyle}</span>
            </span>
          </div>
        )}
        
        {/* Add Eating Style Button - Only for own profile and not shared public link */}
        {isOwnProfile && !isSharedPublicLink && !eatingStyle && (
          <button
            onClick={() => setShowHeaderEditor(true)}
            className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors border bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 cursor-pointer"
          >
            <span className="flex items-center gap-1">
              <span className="hidden sm:inline">Add eating style</span>
              <span className="sm:hidden">Add style</span>
            </span>
          </button>
        )}

            {/* Beta Badge - Show for beta users */}
            {isBetaUser && (
              <div className="px-3 py-1.5 bg-green-600 text-white rounded-full text-xs font-medium">
                BETA
              </div>
            )}

        {/* Follower Count - Show if enabled and (not own profile OR is shared public link) */}
        {showFollowerCount && (!isOwnProfile || isSharedPublicLink) && followerCount > 0 && (
          <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium" style={{ color: '#5C6370' }}>
            👥 {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
          </div>
        )}

        {/* Follow Stack Button - Only show for non-owners */}
        {!isOwnProfile && (
          <div className="ml-auto">
            <FollowButton
              ownerUserId={profile.user_id}
              ownerName={profile.display_name || 'this user'}
              allowsFollowing={profile.allow_stack_follow ?? true}
              onFollowSuccess={onFollowSuccess}
              className=""
            />
          </div>
        )}

        {/* Edit Button for Owner - Only show if not shared public link */}
        {isOwnProfile && !isSharedPublicLink && (
          <button
            onClick={() => setShowHeaderEditor(true)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors border border-gray-200"
          >
            <Edit2 className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {/* Unified Header Editor */}
      {showHeaderEditor && (
        <UnifiedHeaderEditor
          isOpen={showHeaderEditor}
          onClose={() => setShowHeaderEditor(false)}
          initialData={{
            displayName: currentProfile.display_name || '',
            mission: currentProfile.bio,
            eatingStyle: eatingStyle
          }}
          onSave={handleHeaderSave}
        />
      )}
    </>
  )
}
