'use client'

import { useState } from 'react'

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
  const [showAllFood, setShowAllFood] = useState(false)

  const displayItems = showAllFood ? foodItems : foodItems.slice(0, 8)
  const hasMore = foodItems.length > 8

  // Group food items by time preference
  const groupedFood = displayItems.reduce((acc, item) => {
    const timeSlot = item.time_preference || 'anytime'
    if (!acc[timeSlot]) acc[timeSlot] = []
    acc[timeSlot].push(item)
    return acc
  }, {} as Record<string, FoodItem[]>)

  const timeSlots = ['morning', 'afternoon', 'evening', 'anytime']

  return (
    <section className="mb-8">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#0F1115' }}>
          Food ({foodItems.length})
        </h2>
        
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
        
        {hasMore && !showAllFood && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAllFood(true)}
              className="text-sm font-medium hover:text-gray-700 transition-colors" 
              style={{ color: '#5C6370' }}
            >
              View all food ({foodItems.length - 8} more)
            </button>
          </div>
        )}
        {showAllFood && hasMore && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowAllFood(false)}
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
