'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FoodItem {
  id: string
  name: string
  time_preference: string | null
  notes: string | null
  public: boolean
}

interface FoodSectionProps {
  foodItems: FoodItem[]
}

export default function FoodSection({ foodItems }: FoodSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Group food items by time preference
  const groupedFood = foodItems.reduce((acc, item) => {
    const timeSlot = item.time_preference || 'anytime'
    if (!acc[timeSlot]) acc[timeSlot] = []
    acc[timeSlot].push(item)
    return acc
  }, {} as Record<string, FoodItem[]>)

  const timeSlots = ['morning', 'afternoon', 'evening', 'anytime']

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#0F1115' }}>
            Food ({foodItems.length})
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
            {foodItems.length > 0 ? (
              <div className="space-y-6">
                {timeSlots.map(timeSlot => {
                  const items = groupedFood[timeSlot]
                  if (!items || items.length === 0) return null
                  
                  return (
                    <div key={timeSlot}>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                        {timeSlot}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item) => (
                          <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="mb-2">
                              <h4 className="font-medium text-gray-900 text-base">{item.name}</h4>
                            </div>
                            {item.notes && (
                              <div className="mt-2">
                                <p className="text-sm" style={{ color: '#5C6370' }}>{item.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No food items shared yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
