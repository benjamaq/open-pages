'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { formatFrequencyDisplay } from '../lib/frequency-utils'

interface SupplementItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  brand: string | null
  public: boolean
}

interface SupplementsSectionProps {
  supplements: SupplementItem[]
}

// Helper function to map supplement names to compound slugs
const getCompoundSlug = (supplementName: string): string | null => {
  const name = supplementName.toLowerCase()
  
  if (name.includes('creatine')) return 'creatine-monohydrate'
  if (name.includes('magnesium') && name.includes('glycinate')) return 'magnesium-glycinate'
  if (name.includes('omega-3') || name.includes('epa')) return 'omega-3-epa-heavy'
  if (name.includes('vitamin d3') || name.includes('d3')) return 'vitamin-d3'
  if (name.includes('berberine') || name.includes('dihydroberberine')) return 'berberine-dihydroberberine'
  if (name.includes('ashwagandha')) return 'ashwagandha'
  
  return null
}

export default function SupplementsSection({ supplements }: SupplementsSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <section id="supplements" className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#0F1115' }}>
            Supplements & Meds ({supplements.length})
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
          <div>
            {supplements.length > 0 ? (
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto pr-2"
                style={{ 
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E1 transparent'
                }}
              >
                {supplements.map((item) => {
                  const compoundSlug = getCompoundSlug(item.name)
                  
                  return (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="mb-2">
                        <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
                      </div>
                      
                      {/* Frequency and timing pills */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {item.frequency && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {formatFrequencyDisplay(item.frequency, item.schedule_days)}
                          </span>
                        )}
                        {item.timing && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {item.timing}
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {item.dose && (
                          <p className="text-sm" style={{ color: '#5C6370' }}>Dose: {item.dose}</p>
                        )}
                        {item.brand && (
                          <p className="text-sm" style={{ color: '#A6AFBD' }}>Brand: {item.brand}</p>
                        )}
                      </div>
                      
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No supplements shared yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}