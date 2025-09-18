'use client'

import { useState } from 'react'

interface ShareButtonProps {
  profileSlug: string
  className?: string
}

export default function ShareButton({ profileSlug, className = "" }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`https://biostackr.com/u/${profileSlug}`)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      alert('Link copied!')
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={className}
        title="Copy your public Biostackr link"
      >
        Copy Public Link
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
