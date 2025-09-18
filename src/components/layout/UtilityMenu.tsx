'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface UtilityMenuProps {
  userSlug?: string
  onCopyPublicLink: () => void
}

export function UtilityMenu({ userSlug, onCopyPublicLink }: UtilityMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm font-medium hover:bg-gray-800 active:bg-gray-700"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
        </svg>
      </button>
      
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg"
        >
          {userSlug && (
            <Link 
              className="block rounded-lg px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50" 
              href={`/u/${userSlug}`} 
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Public Profile
            </Link>
          )}
          {userSlug && (
            <button 
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50" 
              role="menuitem" 
              onClick={() => {
                onCopyPublicLink()
                setOpen(false)
              }}
            >
              Copy Public Link
            </button>
          )}
          {userSlug && (
            <Link 
              className="block rounded-lg px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50" 
              href={`/u/${userSlug}#journal`} 
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              Journal
            </Link>
          )}
          <Link 
            className="block rounded-lg px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50" 
            href="/dash/settings" 
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
        </div>
      )}
    </div>
  )
}
