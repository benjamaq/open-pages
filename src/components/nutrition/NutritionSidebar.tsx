'use client'

import { useState } from 'react'
import { Edit2, ChevronDown } from 'lucide-react'
import { 
  NutritionSignature, 
  formatBadgeLabel, 
  getBadgeIcon, 
  getBadgeAccentClass,
  BADGE_ACCENTS 
} from '../../lib/nutrition/signature'

interface NutritionSidebarProps {
  signature: NutritionSignature
  isOwner?: boolean
  onCustomize?: () => void
}

export default function NutritionSidebar({ 
  signature, 
  isOwner = false, 
  onCustomize 
}: NutritionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Convert signature to badge objects
  const badges = (signature.header_badges || [])
    .map(key => {
      const label = formatBadgeLabel(key, signature)
      if (!label) return null
      return {
        key,
        label,
        icon: getBadgeIcon(key),
        accent: BADGE_ACCENTS[key]
      }
    })
    .filter(Boolean)

  // Don't render if no badges enabled
  if (!signature.enabled || badges.length === 0) {
    return isOwner ? (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="text-center">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Nutrition</h3>
          <p className="text-xs text-gray-500 mb-3">Share your nutrition approach</p>
          <button
            onClick={onCustomize}
            className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add Badges
          </button>
        </div>
      </div>
    ) : null
  }

  const BadgeItem = ({ badge }: { badge: any }) => (
    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getBadgeAccentClass(badge.accent)}`}>
      <div className="flex items-center gap-1">
        <span className="text-xs">{badge.icon}</span>
        <span className="truncate">{badge.label}</span>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Nutrition</h3>
        <div className="flex items-center gap-2">
          {isOwner && onCustomize && (
            <button
              onClick={onCustomize}
              className="text-xs text-gray-500 hover:text-gray-700 p-1"
              title="Customize nutrition badges"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {badges.length <= 4 ? (
            // Small list: simple stack
            <div className="space-y-2">
              {badges.map((badge, index) => (
                <BadgeItem key={`${badge.key}-${index}`} badge={badge} />
              ))}
            </div>
          ) : (
            // Large list: 2-column grid
            <div className="grid grid-cols-2 gap-2">
              {badges.map((badge, index) => (
                <BadgeItem key={`${badge.key}-${index}`} badge={badge} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
