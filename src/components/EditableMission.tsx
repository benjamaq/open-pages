'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit2, Check, X } from 'lucide-react'

interface EditableMissionProps {
  mission: string
  isOwnProfile: boolean
  className?: string
  onUpdate?: (mission: string) => void
}

export default function EditableMission({ 
  mission, 
  isOwnProfile, 
  className = "",
  onUpdate
}: EditableMissionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempMission, setTempMission] = useState(mission || '')
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
    setTempMission(mission || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmedMission = tempMission.trim()
    
    // Validation - max 120 chars
    if (trimmedMission && trimmedMission.length > 120) {
      setShowToast('Mission must be 120 characters or less.')
      setTimeout(() => setShowToast(''), 3000)
      return
    }

    try {
      // Call update function if provided
      if (onUpdate) {
        await onUpdate(trimmedMission)
      }

      setIsEditing(false)
      
      // Show success toast
      setShowToast(trimmedMission ? 'Mission updated' : 'Mission removed')
      setTimeout(() => setShowToast(''), 2000)
    } catch (error) {
      setShowToast('Couldn\'t save changes. Try again.')
      setTimeout(() => setShowToast(''), 3000)
    }
  }

  const handleCancel = () => {
    setTempMission(mission || '')
    setIsEditing(false)
  }

  const displayMission = mission && mission.trim() ? mission : null

  return (
    <div className="relative">
      <div className="flex items-center">
        {/* Mission or Ghost Text */}
        {displayMission ? (
          <p className={className} style={{ color: '#5C6370' }}>
            {displayMission}
          </p>
        ) : (
          <button
            ref={buttonRef}
            onClick={handleEdit}
            className={`${className} text-gray-400 hover:text-gray-600 transition-colors`}
            aria-label="Add mission"
          >
            Set your mission
          </button>
        )}
        
        {/* Always-visible Pencil Icon - 6-8px right, same line */}
        {isOwnProfile && (
          <button
            ref={!displayMission ? undefined : buttonRef}
            onClick={handleEdit}
            className="p-1 rounded-full hover:bg-gray-100 transition-all duration-200 opacity-60 hover:opacity-100 focus:opacity-100"
            style={{ marginLeft: '7px' }}
            title="Edit mission"
            aria-label="Edit mission"
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
            {/* Mission Input */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#5C6370' }}>
                Mission
              </label>
              <input
                type="text"
                value={tempMission}
                onChange={(e) => setTempMission(e.target.value)}
                placeholder="Your daily mission or about line"
                maxLength={120}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
                style={{ color: '#0F1115', height: '36px' }}
                autoFocus
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs" style={{ color: '#A6AFBD' }}>
                  {tempMission.length}/120 characters
                </span>
                {tempMission.length > 120 && (
                  <span className="text-xs text-red-500">Too long</span>
                )}
              </div>
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
                disabled={tempMission.length > 120}
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
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {showToast}
        </div>
      )}
    </div>
  )
}
