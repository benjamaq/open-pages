'use client'

import { useState } from 'react'
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

export default function SupplementsSection({ supplements }: SupplementsSectionProps) {
  const [showAllSupplements, setShowAllSupplements] = useState(false)

  const displayItems = showAllSupplements ? supplements : supplements.slice(0, 8)
  const hasMore = supplements.length > 8

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
          Supplements ({supplements.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplements.length > 0 ? (
            displayItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
                </div>
                
                {/* Frequency and timing pills */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {item.frequency && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      {formatFrequencyDisplay(item.frequency, item.schedule_days)}
                    </span>
                  )}
                  {item.timing && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
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
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No supplements shared yet</p>
            </div>
          )}
        </div>
        {hasMore && !showAllSupplements && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAllSupplements(true)}
              className="text-sm font-medium hover:text-gray-700 transition-colors" 
              style={{ color: '#5C6370' }}
            >
              View full stack ({supplements.length - 8} more)
            </button>
          </div>
        )}
        {showAllSupplements && hasMore && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAllSupplements(false)}
              className="text-sm font-medium hover:text-gray-700 transition-colors" 
              style={{ color: '#5C6370' }}
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
