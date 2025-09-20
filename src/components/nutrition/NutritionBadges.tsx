'use client'

import { useState, useEffect, useRef } from 'react'
import { Edit2, MoreHorizontal } from 'lucide-react'
import { 
  NutritionSignature, 
  BadgeKey, 
  formatBadgeLabel, 
  getBadgeIcon, 
  getBadgeAccentClass,
  BADGE_ACCENTS 
} from '../../lib/nutrition/signature'

interface NutritionBadgesProps {
  signature: NutritionSignature
  isOwner?: boolean
  onCustomize?: () => void
}

interface Badge {
  key: BadgeKey
  label: string
  icon: string
  accent: string
}

export default function NutritionBadges({ 
  signature, 
  isOwner = false, 
  onCustomize 
}: NutritionBadgesProps) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [visibleBadges, setVisibleBadges] = useState<Badge[]>([])
  const [hiddenBadges, setHiddenBadges] = useState<Badge[]>([])
  const [showPopover, setShowPopover] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert signature to badge objects
  const allBadges: Badge[] = (signature.header_badges || [])
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
    .filter(Boolean) as Badge[]

  // Simplified responsive behavior - use window width instead of container
  useEffect(() => {
    const updateLayout = () => {
      const windowWidth = window.innerWidth
      console.log('Window width:', windowWidth, 'Total badges:', allBadges.length)
      
      // Use window width for more reliable responsive behavior
      const mobile = windowWidth < 640 // sm breakpoint
      setIsMobile(mobile)
      
      if (mobile) {
        // Mobile: show single "Nutrition" pill
        console.log('Mobile mode: showing nutrition pill')
        setVisibleBadges([])
        setHiddenBadges(allBadges)
      } else {
        // Desktop/Tablet: show individual badges based on window width
        let maxBadges = 6
        if (windowWidth < 1280) maxBadges = 4
        if (windowWidth < 1024) maxBadges = 3
        
        console.log('Desktop mode: showing', Math.min(maxBadges, allBadges.length), 'badges')
        setVisibleBadges(allBadges.slice(0, maxBadges))
        setHiddenBadges(allBadges.slice(maxBadges))
      }
    }

    // Initial layout
    updateLayout()

    // Listen for window resize
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [allBadges]) // Only depend on badges array

  // Don't render anything if no badges enabled
  if (!signature.enabled || allBadges.length === 0) {
    return null
  }

  const BadgeChip = ({ badge, isCompact = false }: { badge: Badge; isCompact?: boolean }) => (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium transition-colors hover:shadow-sm ${getBadgeAccentClass(badge.accent)}`}
      title={`${badge.key}: ${badge.label}`}
      style={{ maxWidth: isCompact ? '120px' : '140px' }}
    >
      <span className="text-sm">{badge.icon}</span>
      <span className="truncate">{badge.label}</span>
    </div>
  )

  const OverflowBadge = ({ count }: { count: number }) => (
    <button
      onClick={() => setShowPopover(true)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors"
      aria-label={`Show ${count} more nutrition badges`}
    >
      <MoreHorizontal className="w-3 h-3" />
      <span>+{count}</span>
    </button>
  )

  const NutritionPill = () => (
    <button
      onClick={() => setShowPopover(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm font-medium transition-colors"
    >
      <span>🍽️</span>
      <span>Nutrition</span>
    </button>
  )

  return (
    <>
      <div ref={containerRef} className="flex items-center gap-2 flex-wrap">
        {isMobile ? (
          // Mobile: Single "Nutrition" pill
          <NutritionPill />
        ) : (
          // Desktop/Tablet: Show visible badges + overflow
          <>
            {visibleBadges.map((badge, index) => (
              <BadgeChip key={`${badge.key}-${index}`} badge={badge} />
            ))}
            
            {hiddenBadges.length > 0 && (
              <OverflowBadge count={hiddenBadges.length} />
            )}
          </>
        )}

        {/* Owner customize button */}
        {isOwner && onCustomize && (
          <button
            onClick={onCustomize}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white/70 text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors ml-1"
            aria-label="Customize nutrition badges"
          >
            <Edit2 className="w-3 h-3" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        )}
      </div>

      {/* Popover for showing all badges */}
      {showPopover && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">About my nutrition</h3>
              <button
                onClick={() => setShowPopover(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {allBadges.map((badge, index) => (
                <div key={`${badge.key}-popover-${index}`} className="flex items-center gap-3">
                  <span className="text-lg">{badge.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {badge.key.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">{badge.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {isOwner && onCustomize && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPopover(false)
                    onCustomize()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Nutrition Signature</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// Demo component for testing
export function DemoNutritionBadges() {
  const [signature] = useState<NutritionSignature>({
    style: { key: "mediterranean", label: "Mediterranean" },
    fasting: { window: "16:8", days_per_week: 5 },
    protein_target_g: 130,
    rule: { key: "no_late_meals", label: "No late meals" },
    goto_meal: "Salmon bowl",
    weakness: "Dark choc",
    plant_goal: { per_week: 30 },
    experiment: "30-plants challenge",
    header_badges: ["style", "fasting", "weakness", "protein", "rule", "plants", "experiment", "goto"],
    enabled: true
  })

  return (
    <div className="w-full max-w-5xl p-4">
      <div className="mb-2 text-sm text-gray-600">Resize to see adaptive behavior.</div>
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-gray-900">Ben</div>
            <div className="text-gray-600">Mission: Clarity & longevity</div>
          </div>
          <NutritionBadges 
            signature={signature} 
            isOwner={true}
            onCustomize={() => alert("Open editor modal")} 
          />
        </div>
      </div>
    </div>
  )
}
