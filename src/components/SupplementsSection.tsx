'use client'

import { useEffect, useState } from 'react'
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
  category?: string | null
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [category, setCategory] = useState<string>('Uncategorized')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (editingId) {
      const s = supplements.find(x => x.id === editingId)
      setCategory(s?.category || 'Uncategorized')
    }
  }, [editingId, supplements])

  const saveCategory = async () => {
    if (!editingId) return
    try {
      setBusy(true)
      setMessage('')
      const res = await fetch(`/api/supplements/${encodeURIComponent(editingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(j?.error || 'Failed to save')
        setBusy(false)
        return
      }
      setEditingId(null)
      // Refresh dashboard pie or any data consumer
      try { if (typeof window !== 'undefined') window.dispatchEvent(new Event('progress:refresh')) } catch {}
      setMessage('Saved')
      setBusy(false)
    } catch (e: any) {
      setMessage(e?.message || 'Failed')
      setBusy(false)
    }
  }

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
                        <h3 className="font-medium text-gray-900 text-base break-words">{item.name}</h3>
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm" style={{ color: '#5C6370' }}>Category: {item.category || 'Uncategorized'}</p>
                          <button
                            type="button"
                            onClick={() => setEditingId(item.id)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No supplements & meds yet</p>
              </div>
            )}
          </div>
        )}
      </div>
      {editingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b">
              <div className="text-base font-semibold">Edit supplement</div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {['Gut Health','Energy & Stamina','Sleep Quality','Stress & Mood','Uncategorized'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {message && <div className="text-sm text-gray-600">{message}</div>}
            </div>
            <div className="px-5 py-4 border-t flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 text-sm text-gray-700 border rounded-lg"
                onClick={() => setEditingId(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg disabled:opacity-50"
                onClick={saveCategory}
                disabled={busy}
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}