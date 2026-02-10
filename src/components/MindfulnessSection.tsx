'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Grid from './Grid'
import MindfulnessCard from './MindfulnessCard'

interface MindfulnessItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  frequency: string | null
  schedule_days: string[] | null
  notes: string | null
  public: boolean
}

interface MindfulnessSectionProps {
  mindfulnessItems: MindfulnessItem[]
}

export default function MindfulnessSection({ mindfulnessItems }: MindfulnessSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">
            Mind & Stress ({mindfulnessItems.length})
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
              {mindfulnessItems.length > 0 ? (
                mindfulnessItems.map((item) => (
                  <MindfulnessCard
                    key={item.id}
                    name={item.name}
                    duration={item.dose || undefined}
                    timing={item.timing || undefined}
                    frequency={item.frequency || undefined}
                     scheduleDays={item.schedule_days as any}
                    notes={item.notes || undefined}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No mind & stress yet</p>
                </div>
              )}
            </Grid>
          </div>
        )}
      </div>
    </section>
  )
}
