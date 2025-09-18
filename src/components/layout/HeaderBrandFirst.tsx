'use client'

import Link from 'next/link'
import { UtilityMenu } from './UtilityMenu'

interface HeaderBrandFirstProps {
  userSlug?: string
}

export function HeaderBrandFirst({ userSlug }: HeaderBrandFirstProps) {
  const handleCopyPublicLink = async () => {
    if (!userSlug) return
    
    const publicUrl = `${window.location.origin}/u/${userSlug}`
    try {
      await navigator.clipboard.writeText(publicUrl)
      // Show toast notification
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm'
      toast.textContent = 'Public link copied to clipboard!'
      document.body.appendChild(toast)
      
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Row 1: Brand only */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-4 sm:py-5">
          <Link href="/dash" className="inline-flex items-center -ml-1">
            <img
              src="/BIOSTACKR LOGO.png"
              alt="Biostackr"
              className="h-16 sm:h-20"
              style={{ width: 'auto' }}
            />
            <span className="sr-only">Biostackr dashboard</span>
          </Link>
        </div>
      </div>

      {/* Row 2: Utility toolbar */}
      <div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end gap-2 py-3">
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {userSlug && (
                <Link href={`/u/${userSlug}`} className="btn-ghost">
                  Public Profile
                </Link>
              )}
              {userSlug && (
                <button 
                  type="button" 
                  className="btn-ghost" 
                  onClick={handleCopyPublicLink}
                  id="copy-public-link"
                >
                  Copy Public Link
                </button>
              )}
              {userSlug && (
                <Link href={`/u/${userSlug}#journal`} className="btn-ghost">
                  Journal
                </Link>
              )}
              <Link href="/dash/settings" className="btn-ghost">
                Settings
              </Link>
            </div>

            {/* Mobile kebab */}
            <div className="sm:hidden">
              <UtilityMenu userSlug={userSlug} onCopyPublicLink={handleCopyPublicLink} />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
