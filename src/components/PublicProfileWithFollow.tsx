'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import PublicProfileHeader from './PublicProfileHeader'
import FollowButton from './FollowButton'

interface PublicProfileWithFollowProps {
  profile: any
  isOwnProfile: boolean
  initialFollowerCount: number
  showFollowerCount: boolean
  isSharedPublicLink: boolean
  isBetaUser?: boolean
}

export default function PublicProfileWithFollow({
  profile,
  isOwnProfile,
  initialFollowerCount,
  showFollowerCount,
  isSharedPublicLink,
  isBetaUser = false
}: PublicProfileWithFollowProps) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isRefreshing, setIsRefreshing] = useState(false)


  const refreshFollowerCount = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const supabase = createClient()
      const { count, error } = await supabase
        .from('stack_followers')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', profile.user_id)
        .not('verified_at', 'is', null)

      if (!error && count !== null) {
        setFollowerCount(count)
      }
    } catch (error) {
      console.error('Failed to refresh follower count:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleFollowSuccess = () => {
    // Refresh follower count after successful follow
    refreshFollowerCount()
  }

  return (
    <div className="space-y-4">
      <PublicProfileHeader 
        profile={profile}
        isOwnProfile={isOwnProfile}
        followerCount={followerCount}
        showFollowerCount={showFollowerCount}
        isSharedPublicLink={isSharedPublicLink}
        isBetaUser={isBetaUser}
      />
      
      {!isOwnProfile && (
        <div className="flex justify-center">
          <FollowButton
            ownerUserId={profile.user_id}
            ownerName={profile.display_name || 'this user'}
            allowsFollowing={profile.allow_stack_follow ?? true} // Default to true if not set
            onFollowSuccess={handleFollowSuccess}
            className="mt-4"
          />
        </div>
      )}
    </div>
  )
}
