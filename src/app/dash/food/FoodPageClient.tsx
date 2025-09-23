'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'
import { updateStackItem, deleteStackItem } from '../../../lib/actions/stack'

interface FoodItem {
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
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  slug: string
}

interface FoodPageClientProps {
  foodItems: FoodItem[]
  profile: Profile
}

const FoodItemCard = ({ 
  item, 
  onEdit, 
  onTogglePublic, 
  onDuplicate, 
  onDelete 
}: { 
  item: FoodItem
  onEdit: (item: FoodItem) => void
  onTogglePublic: (item: FoodItem) => void
  onDuplicate: (item: FoodItem) => void
  onDelete: (id: string) => void
}) => {
  const [showKebab, setShowKebab] = useState(false)

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  useEffect(() => {
    const handleClickOutside = () => setShowKebab(false)
    if (showKebab) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showKebab])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate" title={item.name}>
            {item.name}
          </h3>
        </div>
        <button
          onClick={() => onTogglePublic(item)}
          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            item.public 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {item.public ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Body - Key Attributes */}
      <div className="space-y-2 mb-4">
        {item.dose && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Portion:</span>
            <span className="text-sm text-gray-900 font-medium">{item.dose}</span>
          </div>
        )}
        {item.timing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Timing:</span>
            <span className="text-sm text-gray-900 font-medium">{item.timing}</span>
          </div>
        )}
        {item.time_preference && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Meal Time:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{item.time_preference}</span>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Last edited: {getRelativeTime(item.updated_at)}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(item)}
            className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowKebab(!showKebab)
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
            
            {showKebab && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onDuplicate(item)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onTogglePublic(item)
                      setShowKebab(false)
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
                      onDelete(item.id)
                      setShowKebab(false)
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
  )
}

export default function FoodPageClient({ foodItems, profile }: FoodPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    mealTime: '',
    visibility: ''
  })
  const router = useRouter()

  // Filter food items
  const filteredItems = foodItems.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.notes?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Apply other filters
    if (filters.mealTime && item.time_preference !== filters.mealTime) return false
    if (filters.visibility === 'public' && !item.public) return false
    if (filters.visibility === 'private' && item.public) return false
    
    return true
  })

  const handleTogglePublic = async (item: FoodItem) => {
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
    if (confirm('Are you sure you want to delete this food item?')) {
      try {
        await deleteStackItem(itemId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item)
  }

  const handleDuplicate = async (item: FoodItem) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate food item:', item)
  }

  const clearFilters = () => {
    setFilters({
      mealTime: '',
      visibility: ''
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Navigation */}
        <nav className="border-b border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <Link href="/dash" className="hover:opacity-90 transition-opacity">
                  <img 
                    src="/BIOSTACKR LOGO 2.png" 
                    alt="Biostackr" 
                    className="h-14 w-auto"
                  />
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                
                <button 
                  onClick={async () => {
                    const { createClient } = await import('../../../lib/supabase/client')
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="text-sm font-medium hover:text-gray-700 transition-colors"
                  style={{ color: '#5C6370' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/dash" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
              <span className="text-gray-300">›</span>
              <span className="text-gray-900 font-medium">Food Management</span>
            </nav>
          </div>

          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Food Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search food items..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-64"
                />
              </div>

              {/* Filter */}
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="relative flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Add Food Item */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Food Item</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meal Time</label>
                  <select
                    value={filters.mealTime}
                    onChange={(e) => setFilters(prev => ({ ...prev, mealTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All meal times</option>
                    <option value="morning">Morning</option>
                    <option value="midday">Midday</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={filters.visibility}
                    onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All items</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onTogglePublic={handleTogglePublic}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Food Items yet</h3>
              <p className="text-gray-600 mb-6">Add your first food item to track your nutrition.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Food Item
              </button>
            </div>
          )}

          {/* Item Count */}
          {filteredItems.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Showing {filteredItems.length} of {foodItems.length} food items
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddStackItemForm 
          onClose={() => setShowAddForm(false)} 
          itemType="food"
        />
      )}

      {editingItem && (
        <EditStackItemForm 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}
    </>
  )
}
