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
  onFollowSuccess?: () => void
}

export default function FollowButton({ 
  ownerUserId, 
  ownerName, 
  allowsFollowing, 
  className = '',
  onFollowSuccess
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
    try { console.log('🔵 Follow button clicked') } catch {}
    setShowEmailForm(true)
  }

  const handleEmailFollow = async () => {
    try { console.log('🔵 Email entered:', email) } catch {}
    if (!email) {
      setMessage('Please enter your email address')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      try { console.log('🔵 Calling API...') } catch {}
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

      try { console.log('🔵 API Response status:', response.status) } catch {}
      const result = await response.json()
      try { console.log('🔵 API Response data:', result) } catch {}

      if (!response.ok) {
        console.error('🔍 API failed:', result)
        setMessage(`❌ Failed to follow ${ownerName}. Please try again.`)
        setIsLoading(false)
        return
      }

      // Only show success if API actually succeeded
      if (result.status === 'already_following') {
        const msg = `✅ You're already following ${ownerName}!`
        setMessage(msg)
        try { alert(msg) } catch {}
      } else if (result.status === 'pending') {
        const msg = `✅ Check your email to confirm following ${ownerName}!`
        setMessage(msg)
        try { alert(msg) } catch {}
      } else if (result.status === 'following') {
        const msg = `✅ You're now following ${ownerName}! You'll receive updates when they share changes.`
        setMessage(msg)
        try { alert(msg) } catch {}
      } else {
        const msg = `✅ You're now following ${ownerName}! You'll receive updates when they share changes.`
        setMessage(msg)
        try { alert(msg) } catch {}
      }

      setShowEmailForm(false)
      setIsLoading(false)
      
      // Only notify parent component if API actually succeeded
      if (onFollowSuccess) {
        onFollowSuccess()
      }
      
      // Reset to initial state after showing success message
      setTimeout(() => {
        setMessage('')
        setEmail('')
        setFollowStatus('not_following')
      }, 5000)

    } catch (error: any) {
      console.error('🔴 API Error:', error)
      try { alert('Error: ' + (error?.message || 'Unknown error')) } catch {}
      setMessage(`❌ Failed to follow ${ownerName}. Please try again.`)
      setShowEmailForm(false)
      setIsLoading(false)
      
      setTimeout(() => {
        setMessage('')
        setEmail('')
        setFollowStatus('not_following')
      }, 5000)
    }
  }


  // Always show on public link pages (?public=true)
  const isPublicLink = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('public') === 'true'
  if (!allowsFollowing && !isPublicLink) return null

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
          {isLoading ? 'Following...' : `Follow ${ownerName}`}
        </button>
      )}

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Follow {ownerName}</h3>
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter your email to receive weekly updates when {ownerName} shares changes to their health journey.
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
