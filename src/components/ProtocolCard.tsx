'use client'

import { formatFrequencyDisplay } from '../lib/frequency-utils'

interface ProtocolCardProps {
  name: string
  frequency?: string
  scheduleDays?: number[]
  note?: string
}

export default function ProtocolCard({ name, frequency, scheduleDays, note }: ProtocolCardProps) {
  return (
    <div className="rounded-xl border bg-card hover:shadow-sm transition-shadow p-4">
      <div className="space-y-2">
        <h3 className="text-base font-medium text-gray-900 line-clamp-2">
          {name}
        </h3>
        
        <div className="flex items-center gap-2">
          {frequency && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {formatFrequencyDisplay(frequency, scheduleDays)}
            </span>
          )}
        </div>
        
        {note && (
          <p className="text-sm text-gray-600 line-clamp-1">
            {note}
          </p>
        )}
      </div>
    </div>
  )
}
