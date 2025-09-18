'use client'

import { useState } from 'react'

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

  if (supplements.length === 0) return null

  const displayItems = showAllSupplements ? supplements : supplements.slice(0, 8)
  const hasMore = supplements.length > 8

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
          Supplements ({supplements.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-4">
              <div className="mb-2">
                <h3 className="font-medium text-gray-900 text-base">{item.name}</h3>
              </div>
              <div className="mt-2 space-y-1">
                {item.dose && (
                  <p className="text-sm" style={{ color: '#5C6370' }}>Dose: {item.dose}</p>
                )}
                {item.timing && (
                  <p className="text-sm" style={{ color: '#5C6370' }}>Timing: {item.timing}</p>
                )}
                {item.brand && (
                  <p className="text-sm" style={{ color: '#A6AFBD' }}>Brand: {item.brand}</p>
                )}
              </div>
            </div>
          ))}
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
