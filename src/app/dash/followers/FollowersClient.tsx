'use client'

import { useState, useEffect } from 'react'
import { Users, Mail, Calendar, Trash2, Settings } from 'lucide-react'

interface Follower {
  id: string
  type: 'user' | 'email'
  name: string | null
  slug: string | null
  email: string | null
  cadence: 'off' | 'daily' | 'weekly'
  followedAt: string
  lastDigestSent: string | null
}

interface FollowersClientProps {
  profile: any
}

export default function FollowersClient({ profile }: FollowersClientProps) {
  const [followers, setFollowers] = useState<Follower[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadFollowers()
  }, [])

  const loadFollowers = async () => {
    try {
      const response = await fetch('/api/stack-follow/followers')
      if (response.ok) {
        const data = await response.json()
        setFollowers(data.followers || [])
      } else {
        setMessage('Failed to load followers')
      }
    } catch (error) {
      console.error('Error loading followers:', error)
      setMessage('Failed to load followers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFollower = async (followerId: string) => {
    if (!confirm('Remove this follower? They will stop receiving email updates.')) {
      return
    }

    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ownerUserId: profile.user_id, followerId })
      })

      if (response.ok) {
        setFollowers(prev => prev.filter(f => f.id !== followerId))
        setMessage('✅ Follower removed successfully')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to remove follower')
      }
    } catch (error) {
      console.error('Error removing follower:', error)
      setMessage('Failed to remove follower')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCadenceBadge = (cadence: string) => {
    const colors = {
      daily: 'bg-green-100 text-green-800',
      weekly: 'bg-blue-100 text-blue-800',
      off: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[cadence as keyof typeof colors] || colors.off}`}>
        {cadence === 'off' ? 'Paused' : cadence.charAt(0).toUpperCase() + cadence.slice(1)}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading followers...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="w-6 h-6 text-purple-500" />
          <h1 className="text-2xl font-semibold text-gray-900">Stack Followers</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{followers.length}</div>
            <div className="text-sm text-gray-500">Total Followers</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {followers.filter(f => f.cadence !== 'off').length}
            </div>
            <div className="text-sm text-gray-500">Active Subscribers</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {followers.filter(f => f.type === 'user').length}
            </div>
            <div className="text-sm text-gray-500">Registered Users</div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Followers List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Followers List</h2>
          <p className="text-sm text-gray-500 mt-1">
            People who receive email updates when you change your public stack
          </p>
        </div>

        {followers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
            <p className="text-gray-500 mb-4">
              Share your public profile to get your first followers!
            </p>
            <a
              href={`/u/${profile.slug}`}
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              View Public Profile
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {followers.map((follower) => (
              <div key={follower.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        {follower.type === 'user' ? (
                          <Users className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Mail className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {follower.name || follower.email || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {follower.type === 'user' ? 'Registered user' : 'Email subscriber'}
                          {follower.slug && (
                            <span> • <a href={`/u/${follower.slug}`} className="text-purple-600 hover:text-purple-700">@{follower.slug}</a></span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Followed {formatDate(follower.followedAt)}</span>
                      </div>
                      {follower.lastDigestSent && (
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>Last email {formatDate(follower.lastDigestSent)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getCadenceBadge(follower.cadence)}
                    
                    <button
                      onClick={() => handleRemoveFollower(follower.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove follower"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Settings className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Managing Followers</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Followers receive email digests when you change your public stack items</p>
              <p>• They can choose daily, weekly, or no emails</p>
              <p>• Private items are never included in digests</p>
              <p>• You can remove followers anytime</p>
              <p>• Disable following entirely in Settings → Stack Followers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
