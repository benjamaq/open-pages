'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

interface ShareButtonProps {
  profileSlug: string
  className?: string
}

export default function ShareButton({ profileSlug, className = "" }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleShare = async () => {
    try {
      // Use production domain for sharing, localhost for development
      const baseUrl = typeof window !== 'undefined' && window.location.host.includes('localhost')
        ? `${window.location.protocol}//${window.location.host}`
        : 'https://biostackr.com'
      
      await navigator.clipboard.writeText(`${baseUrl}/u/${profileSlug}?public=true`)
      setShowToast(true)
      trackEvent('profile_shared', { share_method: 'copy_link' })
      setTimeout(() => setShowToast(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      alert(`Link: ${baseUrl}/u/${profileSlug}?public=true`)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={className}
        title="Copy your public Biostackr link"
      >
        Share Profile
      </button>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Link copied!
        </div>
      )}
    </>
  )
}
