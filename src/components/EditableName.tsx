'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit2, Check, X } from 'lucide-react'

interface EditableNameProps {
  name: string
  isOwnProfile: boolean
  className?: string
  showNamePublic?: boolean
  onUpdate?: (name: string, showPublic: boolean) => void
}

export default function EditableName({ 
  name, 
  isOwnProfile, 
  className = "",
  showNamePublic = true,
  onUpdate
}: EditableNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(name || '')
  const [tempShowPublic, setTempShowPublic] = useState(showNamePublic)
  const [showToast, setShowToast] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEditing])

  // Close on ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditing) {
        handleCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isEditing])

  const handleEdit = () => {
    setTempName(name || '')
    setTempShowPublic(showNamePublic)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmedName = tempName.trim()
    
    // Validation - must have content if not empty
    if (tempName && trimmedName.length === 0) {
      setShowToast('Enter 1–40 characters.')
      setTimeout(() => setShowToast(''), 3000)
      return
    }

    if (trimmedName && (trimmedName.length < 1 || trimmedName.length > 40)) {
      setShowToast('Enter 1–40 characters.')
      setTimeout(() => setShowToast(''), 3000)
      return
    }

    // Validation: A-Z, a-z, 0-9, spaces, hyphen, underscore, apostrophe
    const validNameRegex = /^[a-zA-Z0-9\s\-\_\']*$/
    if (trimmedName && !validNameRegex.test(trimmedName)) {
      setShowToast('Only letters, numbers, spaces, hyphens, underscores, and apostrophes allowed.')
      setTimeout(() => setShowToast(''), 3000)
      return
    }

    try {
      // Call update function if provided
      if (onUpdate) {
        await onUpdate(trimmedName, tempShowPublic)
      }

      setIsEditing(false)
      
      // Show success toast
      if (!tempShowPublic) {
        setShowToast('Hidden on public profile')
      } else {
        setShowToast(trimmedName ? 'Name updated' : 'Name removed')
      }
      setTimeout(() => setShowToast(''), 2000)
    } catch (error) {
      setShowToast('Couldn\'t save changes. Try again.')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleCancel = () => {
    setTempName(name || '')
    setTempShowPublic(showNamePublic)
    setIsEditing(false)
  }

  const displayName = name && name.trim() ? name : null
  const shouldShowName = showNamePublic && displayName
  const displayText = shouldShowName ? displayName : 'Anonymous Stackr'

  return (
    <div className="relative">
      <div className="flex items-center">
        {/* Name or Ghost Text */}
        {displayName ? (
          <h1 className={className} style={{ color: '#0F1115' }}>
            {shouldShowName ? displayName : 'Anonymous Stackr'}
          </h1>
        ) : (
          <button
            ref={buttonRef}
            onClick={handleEdit}
            className={`${className} text-gray-400 hover:text-gray-600 transition-colors`}
            aria-label="Add display name"
          >
            Add name
          </button>
        )}
        
        {/* Always-visible Pencil Icon - 6-8px right, same line */}
        {isOwnProfile && (
          <button
            ref={!displayName ? undefined : buttonRef}
            onClick={handleEdit}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 opacity-60 hover:opacity-100 focus:opacity-100"
            style={{ marginLeft: '7px' }}
            title="Edit name"
            aria-label="Edit display name"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleEdit()
              }
            }}
          >
            <Edit2 className="w-4 h-4" style={{ color: '#5C6370' }} />
          </button>
        )}
      </div>

      {/* Popover Editor */}
      {isEditing && (
        <div 
          ref={popoverRef}
          className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <div className="space-y-4">
            {/* Display Name Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#5C6370' }}>
                Display Name
              </label>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Your display name"
                maxLength={40}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
                style={{ color: '#0F1115' }}
                autoFocus
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: '#A6AFBD' }}>
                  {tempName.length}/40 characters
                </span>
                {tempName.length > 40 && (
                  <span className="text-xs text-red-500">Too long</span>
                )}
              </div>
            </div>

            {/* Show Name Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: '#5C6370' }}>
                Show name on public profile
              </label>
              <button
                onClick={() => setTempShowPublic(!tempShowPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tempShowPublic ? 'bg-gray-900' : 'bg-gray-200'
                }`}
                aria-label="Toggle name visibility"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tempShowPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={tempName.length > 40}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {showToast}
        </div>
      )}
    </div>
  )
}
