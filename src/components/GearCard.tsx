'use client'

import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

// Row 4 — Gear Card (Full Width)
export default function GearCard({ items = [], onAdd, onManage }: { items?: any[]; onAdd: () => void; onManage: () => void }) {
  const [collapsed, setCollapsed] = useState(false)


  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: collapsed ? '80px' : '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center space-x-3">
          <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Devices & Tools</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAdd}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Add devices & tools"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage gear"
          >
            Manage
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 max-h-72 overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 break-words">{item.name}</h3>
                        {item.brand && (
                          <p className="text-xs text-gray-500 break-words">{item.brand}{item.model && ` ${item.model}`}</p>
                        )}
                        <p className="text-xs text-gray-400">{item.category}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.buy_link && (
                          <a
                            href={item.buy_link}
                            target="_blank"
                            rel="nofollow sponsored noopener"
                            className="text-xs bg-gray-900 text-white px-2 py-1 rounded-md hover:bg-gray-800 transition-colors"
                          >
                            Buy
                          </a>
                        )}
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          item.public 
                            ? 'bg-gray-900 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {item.public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onManage}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Gear
                </button>
                <p className="text-xs leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Track your health equipment.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}