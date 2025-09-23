'use client'

import { useState } from 'react'
import { X, Mail, Copy, Check } from 'lucide-react'

interface ProfileActionButtonsProps {
  isOwnProfile: boolean
  profileName: string
  profileSlug?: string
}

interface FollowModalProps {
  isOpen: boolean
  onClose: () => void
  profileName: string
  onSubmit: (email: string) => Promise<void>
}

function FollowModal({ isOpen, onClose, profileName, onSubmit }: FollowModalProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(email.trim())
      setEmail('')
      onClose()
    } catch (error) {
      console.error('Failed to follow:', error)
      alert('Failed to follow. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Follow {profileName}'s Stack</h2>
            <p className="text-sm text-gray-600">Get weekly updates when their stack changes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600">
              • Weekly digest only when stack changes<br/>
              • Unsubscribe anytime<br/>
              • No spam, just stack updates
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Following...' : 'Follow Stack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProfileActionButtons({ isOwnProfile, profileName, profileSlug }: ProfileActionButtonsProps) {
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleFollow = () => {
    setShowFollowModal(true)
  }

  const handleFollowSubmit = async (email: string) => {
    // TODO: Implement follow functionality
    console.log('Following with email:', email)
    alert(`✅ You're now following ${profileName}'s stack! Check your email for confirmation.`)
  }

  const handleCopyLink = async () => {
    if (!profileSlug) return
    
    // Add ?public=true parameter to force clean view when shared
    const profileUrl = `${window.location.origin}/u/${profileSlug}?public=true`
    
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = profileUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 lg:flex-shrink-0">
        {isOwnProfile ? (
          <button 
            onClick={handleCopyLink}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                Copy Public Link
              </>
            )}
          </button>
        ) : (
          <button 
            onClick={handleFollow}
            className="px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Follow my stack
          </button>
        )}
      </div>

      {/* Follow Modal */}
      <FollowModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        profileName={profileName}
        onSubmit={handleFollowSubmit}
      />
    </>
  )
}
