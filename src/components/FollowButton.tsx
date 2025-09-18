'use client'

import { useState, useEffect } from 'react'
import { Heart, Mail, Check } from 'lucide-react'
import { getUserSubscription } from '../lib/actions/subscriptions'
import UpgradeModal from './UpgradeModal'

interface FollowButtonProps {
  ownerUserId: string
  ownerName: string
  allowsFollowing: boolean
  className?: string
}

export default function FollowButton({ 
  ownerUserId, 
  ownerName, 
  allowsFollowing, 
  className = '' 
}: FollowButtonProps) {
  const [followStatus, setFollowStatus] = useState<'not_following' | 'following' | 'pending'>('not_following')
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [ownerCanReceiveFollowers, setOwnerCanReceiveFollowers] = useState(true)

  useEffect(() => {
    checkFollowStatus()
  }, [ownerUserId])

  const checkFollowStatus = async () => {
    // For now, assume not following - in a full implementation, 
    // you'd check the current user's follow status
    setFollowStatus('not_following')
  }

  const handleFollow = async () => {
    // Check if owner can receive more followers (free plan limit)
    if (!ownerCanReceiveFollowers) {
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ownerUserId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to follow')
      }

      if (result.status === 'following') {
        setFollowStatus('following')
        setMessage(`✅ You're now following ${ownerName}'s stack! You'll receive weekly email updates.`)
      } else if (result.status === 'already_following') {
        setFollowStatus('following')
        setMessage(`You're already following ${ownerName}'s stack.`)
      }

    } catch (error) {
      console.error('Follow error:', error)
      setMessage('Failed to follow. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailFollow = async () => {
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    // Check if owner can receive more followers (free plan limit)
    if (!ownerCanReceiveFollowers) {
      setShowUpgradeModal(true)
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ownerUserId, email })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to follow')
      }

      if (result.status === 'pending') {
        setFollowStatus('pending')
        setMessage(`✅ Check your email to confirm following ${ownerName}'s stack!`)
        setShowEmailForm(false)
      } else if (result.status === 'already_following') {
        setFollowStatus('following')
        setMessage(`You're already following ${ownerName}'s stack.`)
        setShowEmailForm(false)
      }

    } catch (error) {
      console.error('Email follow error:', error)
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnfollow = async () => {
    if (!confirm(`Stop following ${ownerName}'s stack?`)) {
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/follow', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ownerUserId, email: showEmailForm ? email : undefined })
      })

      if (!response.ok) {
        throw new Error('Failed to unfollow')
      }

      setFollowStatus('not_following')
      setMessage(`You've unfollowed ${ownerName}'s stack.`)

    } catch (error) {
      console.error('Unfollow error:', error)
      setMessage('Failed to unfollow. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if owner doesn't allow following
  if (!allowsFollowing) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Follow Button */}
      {followStatus === 'not_following' && (
        <div>
          <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors ${className}`}
          >
            <Heart className="w-4 h-4 mr-2" />
            {isLoading ? 'Following...' : 'Follow Stack'}
          </button>
          
          <button
            onClick={() => setShowEmailForm(true)}
            className="ml-2 text-sm text-purple-600 hover:text-purple-700 underline"
          >
            Follow with email
          </button>
        </div>
      )}

      {/* Following Status */}
      {followStatus === 'following' && (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleUnfollow}
            disabled={isLoading}
            className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors ${className}`}
          >
            <Check className="w-4 h-4 mr-2" />
            Following
          </button>
          <span className="text-sm text-gray-600">• Manage emails</span>
        </div>
      )}

      {/* Pending Verification */}
      {followStatus === 'pending' && (
        <div className={`inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium ${className}`}>
          <Mail className="w-4 h-4 mr-2" />
          Verification Pending
        </div>
      )}

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Follow {ownerName}'s Stack</h3>
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter your email to receive weekly updates when {ownerName} changes their public stack.
            </p>

            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailFollow}
                  disabled={isLoading || !email}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Follow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className={`text-sm p-3 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Upgrade Modal for Owner */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        itemType="followers"
        currentCount={0}
        limit={0}
      />
    </div>
  )
}
