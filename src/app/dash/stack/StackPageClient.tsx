'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2, Search, Filter, X } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import AddSupplementModal from '../../../components/supplements/AddSupplementModal'
import EditStackItemForm from '../../../components/EditStackItemForm'
import SupplementTimeline from '../../../components/supplements/SupplementTimeline'
import { updateStackItem, deleteStackItem } from '../../../lib/actions/stack'

interface StackItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  brand: string | null
  notes: string | null
  public: boolean
  frequency?: string
  time_preference?: string
  schedule_days?: number[]
  categories?: string[]
}

interface Profile {
  id: string
  slug: string
  display_name: string
}

interface StackPageClientProps {
  stackItems: StackItem[]
  profile: Profile
}

export default function StackPageClient({ stackItems, profile }: StackPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<StackItem | null>(null)
  const [showKebab, setShowKebab] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    visibility: '',
    category: '',
    timePreference: ''
  })
  const router = useRouter()

  // Filter supplements
  const filteredItems = stackItems.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.brand?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Apply other filters
    if (filters.visibility === 'public' && !item.public) return false
    if (filters.visibility === 'private' && item.public) return false
    if (filters.timePreference && item.time_preference !== filters.timePreference) return false
    
    return true
  })

  const clearFilters = () => {
    setFilters({
      visibility: '',
      category: '',
      timePreference: ''
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const handleTogglePublic = async (item: StackItem) => {
    try {
      await updateStackItem(item.id, {
        name: item.name,
        dose: item.dose || undefined,
        timing: item.timing || undefined,
        brand: item.brand || undefined,
        notes: item.notes || undefined,
        public: !item.public,
        frequency: item.frequency,
        time_preference: item.time_preference,
        schedule_days: item.schedule_days
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this supplement?')) {
      try {
        await deleteStackItem(itemId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const handleDuplicate = async (item: StackItem) => {
    try {
      // Import the addStackItem function
      const { addStackItem } = await import('../../../lib/actions/stack')
      
      // Create a duplicate with "Copy of" prefix
      const duplicateData = {
        name: `Copy of ${item.name}`,
        dose: item.dose || '',
        timing: item.timing || '',
        brand: item.brand || '',
        notes: item.notes || '',
        public: item.public,
        itemType: 'supplements',
        frequency: item.frequency || 'daily',
        time_preference: item.time_preference || 'anytime',
        schedule_days: item.schedule_days || [0, 1, 2, 3, 4, 5, 6]
      }
      
      await addStackItem(duplicateData)
      router.refresh()
    } catch (error) {
      console.error('Failed to duplicate supplement:', error)
      alert('Failed to duplicate supplement. Please try again.')
    }
  }

    return (
      <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Header - Brand First Design */}
        <div className="bg-white shadow-sm">
          {/* Row 1: Brand Only */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
              <Link href="/dash" className="inline-flex items-center -ml-1">
                <img
                  src="/BIOSTACKR LOGO 2.png"
                  alt="Biostackr"
                  className="h-14 w-auto"
                />
                <span className="sr-only">Biostackr dashboard</span>
              </Link>
            </div>
          </div>

          {/* Row 2: Utility Toolbar */}
          <div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-end gap-3 py-2">
                {/* Dashboard Button */}
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-1.5 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm">
          <Link href="/dash" className="text-gray-500 hover:text-gray-700">
            Dashboard
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900 font-medium">Supplements & Meds Management</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Supplements & Meds Management</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage what you take - supplements, medications, peptides, vitamins, nootropics.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplements..."
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-48 sm:w-64"
            />
          </div>

          {/* Filter */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Add Supplement */}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-900 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center space-x-1"
          >
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilter(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <select
                value={filters.visibility}
                onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">All Items</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Preference</label>
              <select
                value={filters.timePreference}
                onChange={(e) => setFilters(prev => ({ ...prev, timePreference: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">All Times</option>
                <option value="morning">Morning</option>
                <option value="midday">Midday</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear all filters
            </button>
            <button
              onClick={() => setShowFilter(false)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Supplements Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 break-words">{item.name}</h3>
              {/* Decision state badge placeholder (derived): show Testing/Complete where possible */}
              <div className="mb-1">
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                  {/* Since full decision data isn't loaded here, label as “Testing” by default; server can enhance later */}
                  Testing
                </span>
              </div>
              {item.dose && <p className="text-sm text-gray-600 break-words">Dose: {item.dose}</p>}
              {item.brand && <p className="text-sm text-gray-600 break-words">Brand: {item.brand}</p>}
              {item.timing && <p className="text-sm text-gray-600 break-words">Timing: {item.timing}</p>}
              
              {/* Visual Period Timeline + List */}
              <div className="mt-4">
                <SupplementTimeline
                  supplementId={String(item.id)}
                  supplementName={item.name}
                />
              </div>

              <div className="mt-4 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.public ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {item.public ? 'Public' : 'Private'}
                </span>
                <div className="flex items-center space-x-2">
                  {/* Retest button (visible on complete state; we’ll expose once decision state is wired) */}
                  {/* <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Retest</button> */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowKebab(showKebab === item.id ? null : item.id)
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {showKebab === item.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              handleDuplicate(item)
                              setShowKebab(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Copy className="w-4 h-4 inline mr-2" />
                            Duplicate
                          </button>
                          <button
                            onClick={() => {
                              handleTogglePublic(item)
                              setShowKebab(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {item.public ? (
                              <>
                                <EyeOff className="w-4 h-4 inline mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 inline mr-2" />
                                Make Public
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(item.id)
                              setShowKebab(null)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 inline mr-2" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredItems.length === 0 && stackItems.length > 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
          
          {stackItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements or medications yet</h3>
              <p className="text-gray-500 mb-6">Add supplements, medications, peptides, vitamins, or nootropics</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddSupplementModal
          open={true}
          onClose={() => {
            setShowAddForm(false)
            router.refresh()
          }}
          save={{
            onCreate: async ({ name, startDate, endDate, dose }) => {
              const createRes = await fetch('/api/stack-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name,
                  dose: dose || null,
                  item_type: 'supplements',
                  frequency: 'daily'
                })
              })
              const createJson = await createRes.json()
              if (!createRes.ok) throw new Error(createJson?.error || 'Failed to create supplement')
              const supplementId = createJson?.data?.id as string
              const periodRes = await fetch(`/api/supplements/${encodeURIComponent(supplementId)}/periods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ start_date: startDate, end_date: endDate })
              })
              const periodJson = await periodRes.json()
              if (!periodRes.ok) throw new Error(periodJson?.error || 'Failed to create period')
              const first = periodJson?.period
              return { supplementId, periods: first ? [{
                id: first.id,
                supplementId,
                startDate: first.start_date,
                endDate: first.end_date,
                dose: first.dose,
                notes: first.notes
              }] : [] }
            },
            onReplacePeriods: async (_supplementId, _periods) => {
              await Promise.resolve()
            }
          }}
        />
      )}

      {editingItem && (
        <EditStackItemForm 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}
        </div>
      </div>
    )
}
