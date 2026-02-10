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
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <section id="protocols" className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            Protocols & Recovery ({protocols.length})
          </h2>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!isCollapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        </div>

        {!isCollapsed && (
          <div 
            className="max-h-96 overflow-y-auto pr-2"
            style={{ 
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 transparent'
            }}
          >
            <Grid>
              {protocols.length > 0 ? (
                protocols.map((protocol) => (
                  <ProtocolCard
                    key={protocol.id}
                    name={protocol.name}
                    frequency={protocol.frequency || undefined}
                     scheduleDays={(protocol as any).schedule_days}
                    note={protocol.details || undefined}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No protocols & recovery yet</p>
                </div>
              )}
            </Grid>
          </div>
        )}
      </div>
    </section>
  )
}
