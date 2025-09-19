'use client'

import { formatFrequencyDisplay } from '../lib/frequency-utils'

interface MindfulnessCardProps {
  name: string
  duration?: string
  timing?: string
  frequency?: string
  scheduleDays?: number[]
  notes?: string
}

export default function MindfulnessCard({ name, duration, timing, frequency, scheduleDays, notes }: MindfulnessCardProps) {
  return (
    <div className="rounded-xl border bg-card hover:shadow-sm transition-shadow p-4">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-gray-900 line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center gap-2 flex-wrap">
          {duration && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {duration}
            </span>
          )}
          {timing && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {timing}
            </span>
          )}
          {frequency && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {formatFrequencyDisplay(frequency, scheduleDays)}
            </span>
          )}
        </div>
        
        {notes && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {notes}
          </p>
        )}
      </div>
    </div>
  )
}
