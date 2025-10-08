'use client'

import { useState, useEffect, ReactNode } from 'react'

interface FirstTimeTooltipProps {
  id: string // Unique ID for this tooltip (e.g., 'heatmap-hover')
  message: string
  children: ReactNode
  trigger?: 'hover' | 'click'
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function FirstTimeTooltip({ 
  id, 
  message, 
  children, 
  trigger = 'hover',
  position = 'top'
}: FirstTimeTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if this tooltip has been shown before
    const wasShown = localStorage.getItem(`tooltip_${id}`) === 'true'
    setHasShown(wasShown)
  }, [id])

  const handleInteraction = () => {
    if (!hasShown) {
      setShowTooltip(true)
      localStorage.setItem(`tooltip_${id}`, 'true')
      setHasShown(true)
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowTooltip(false)
      }, 5000)
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      handleInteraction()
    }
  }

  const handleClick = () => {
    if (trigger === 'click') {
      handleInteraction()
    }
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
      
      {showTooltip && !hasShown && (
        <div 
          className={`absolute ${positionClasses[position]} z-50 w-64 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-fade-in`}
        >
          <div className="flex items-start space-x-2">
            <span>💡</span>
            <span>{message}</span>
          </div>
          {/* Arrow */}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
            position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
            position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
            position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' :
            'left-[-4px] top-1/2 -translate-y-1/2'
          }`} />
        </div>
      )}
    </div>
  )
}

