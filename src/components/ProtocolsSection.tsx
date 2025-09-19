'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Grid from './Grid'
import ProtocolCard from './ProtocolCard'

interface Protocol {
  id: string
  name: string
  frequency: string | null
  details: string | null
  public: boolean
}

interface ProtocolsSectionProps {
  protocols: Protocol[]
}

export default function ProtocolsSection({ protocols }: ProtocolsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Always render if called, show empty state if no protocols

  const displayedProtocols = isExpanded ? protocols : protocols.slice(0, 9)
  const hasMore = protocols.length > 9

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-semibold text-gray-900">
            Protocols ({protocols.length})
          </h2>
          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              {isExpanded ? 'Show less' : 'View full protocols'}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <Grid>
          {protocols.length > 0 ? (
            displayedProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                name={protocol.name}
                frequency={protocol.frequency || undefined}
                scheduleDays={protocol.schedule_days}
                note={protocol.details || undefined}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No protocols shared yet</p>
            </div>
          )}
        </Grid>
      </div>
    </section>
  )
}
