'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Grid from './Grid'
import MovementCard from './MovementCard'

interface MovementItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  notes: string | null
  public: boolean
}

interface MovementSectionProps {
  movementItems: MovementItem[]
}

export default function MovementSection({ movementItems }: MovementSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Always render if called, show empty state if no movement items

  const displayedItems = isExpanded ? movementItems : movementItems.slice(0, 6)
  const hasMore = movementItems.length > 6

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-semibold text-gray-900">
            Movement ({movementItems.length})
          </h2>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? 'Show less' : 'View more'}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <Grid>
          {displayedItems.map((item) => (
            <MovementCard
              key={item.id}
              name={item.name}
              duration={item.dose || undefined}
              timing={item.timing || undefined}
              frequency={item.frequency || undefined}
              scheduleDays={item.schedule_days}
              notes={item.notes || undefined}
            />
          ))}
        </Grid>
      </div>
    </section>
  )
}
