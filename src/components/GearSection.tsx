'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface GearItem {
  id: string
  name: string
  brand?: string | null
  model?: string | null
  category: string
  description?: string | null
  buy_link?: string | null
  status?: string
  public: boolean
}

interface GearSectionProps {
  gear: GearItem[]
}

export default function GearSection({ gear }: GearSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Group gear by status
  const currentGear = gear.filter(item => item.status !== 'past')
  const pastGear = gear.filter(item => item.status === 'past')

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Wearables': '⌚',
      'Recovery': '🛁',
      'Kitchen': '🍳',
      'Fitness': '🏋️',
      'Sleep': '🛏️',
      'Other': '🔧'
    }
    return icons[category] || '🔧'
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🎧</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gear</h2>
            <p className="text-sm text-gray-500">{gear.length} item{gear.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
        </button>
      </div>

      {!isCollapsed && (
        <div className="max-h-96 overflow-y-auto overflow-x-hidden">
          {gear.length > 0 ? (
            <div className="space-y-6 pr-2">
              {/* Current Gear */}
              {currentGear.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Current</h3>
                    <span className="text-sm text-gray-500">({currentGear.length})</span>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {currentGear.map((item) => (
                      <GearItem key={item.id} item={item} getCategoryIcon={getCategoryIcon} />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Gear */}
              {pastGear.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-500">Past</h3>
                    <span className="text-sm text-gray-400">({pastGear.length})</span>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {pastGear.map((item) => (
                      <GearItem key={item.id} item={item} getCategoryIcon={getCategoryIcon} isPast={true} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎧</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No gear yet</h3>
              <p className="text-gray-500">This user hasn't shared any gear items yet.</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// Individual Gear Item Component
function GearItem({ item, getCategoryIcon, isPast = false }: { 
  item: GearItem; 
  getCategoryIcon: (category: string) => string;
  isPast?: boolean;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow ${isPast ? 'opacity-75' : ''} w-full overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{getCategoryIcon(item.category)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 truncate">{item.name}</h3>
            {item.brand && (
              <p className="text-sm text-gray-500 truncate">
                {item.brand}{item.model && ` ${item.model}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {item.category}
          </span>
          {isPast && (
            <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded-full">
              Past
            </span>
          )}
        </div>
      </div>

      {item.description && (
        <p className="text-sm text-gray-600 mb-3 leading-relaxed break-words">
          {item.description}
        </p>
      )}

      {item.buy_link && !isPast && (
        <div className="mt-3">
          <a
            href={item.buy_link}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium truncate max-w-full"
          >
            <span className="truncate">
              {item.brand ? `→ Buy at ${item.brand}` : '→ Buy this item'}
            </span>
          </a>
        </div>
      )}
    </div>
  )
}