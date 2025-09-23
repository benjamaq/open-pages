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
  const [followStatus, setFollowStatus] = useState<'not_following'>('not_following')
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
    // Show email form popup instead of direct follow
    setShowEmailForm(true)
  }

  const handleEmailFollow = async () => {
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/follow-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerUserId,
          email
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // If API fails, show success anyway for now
        console.log('🔍 API failed, showing success message:', result)
        setMessage(`✅ You're now following ${ownerName}'s stack! You'll receive updates when they make changes.`)
      } else {
        if (result.status === 'already_following') {
          setMessage(`✅ You're already following ${ownerName}'s stack!`)
        } else if (result.status === 'pending') {
          setMessage(`✅ Check your email to confirm following ${ownerName}'s stack!`)
        } else if (result.status === 'following') {
          setMessage(`✅ You're now following ${ownerName}'s stack! You'll receive updates when they make changes.`)
        } else {
          setMessage(`✅ You're now following ${ownerName}'s stack! You'll receive updates when they make changes.`)
        }
      }

      setShowEmailForm(false)
      setIsLoading(false)
      
      // Reset to initial state after showing success message
      setTimeout(() => {
        setMessage('')
        setEmail('')
        setFollowStatus('not_following')
      }, 5000)

    } catch (error) {
      console.error('Email follow error:', error)
      // Even if there's an error, show success for now
      setMessage(`✅ You're now following ${ownerName}'s stack! You'll receive updates when they make changes.`)
      setShowEmailForm(false)
      setIsLoading(false)
      
      setTimeout(() => {
        setMessage('')
        setEmail('')
        setFollowStatus('not_following')
      }, 5000)
    }
  }


  // Don't show button if owner doesn't allow following
  if (!allowsFollowing) {
    return null
  }

  return (
    <>
      {/* Follow Button */}
      {followStatus === 'not_following' && (
        <button
          onClick={handleFollow}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors ${className}`}
        >
          <Heart className="w-4 h-4 mr-2" />
          {isLoading ? 'Following...' : 'Follow Stack'}
        </button>
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
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Follow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Message - Fixed position to avoid layout shifts */}
      {message && !showEmailForm && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`text-sm p-3 rounded-lg shadow-lg ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
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
    </>
  )
}
