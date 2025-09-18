'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    timing: '',
    public: '',
    frequency: ''
  })
  const router = useRouter()

  const handleTogglePublic = async (item: StackItem) => {
    try {
      await updateStackItem(item.id, {
        name: item.name,
        dose: item.dose || undefined,
        timing: item.timing || undefined,
        brand: item.brand || undefined,
        notes: item.notes || undefined,
        public: !item.public,
        frequency: item.frequency || undefined,
        time_preference: item.time_preference || undefined,
        schedule_days: item.schedule_days || [],
        category: item.categories?.[0] || 'General'
      })
      router.refresh()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplement?')) {
      try {
        await deleteStackItem(id)
        router.refresh()
        setOpenMenuId(null)
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const handleEdit = (item: StackItem) => {
    setEditingItem(item)
    setOpenMenuId(null)
  }

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.slug}`)
      alert('Public link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy: ', err)
      alert('Failed to copy link. Please try again.')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  // Filter logic
  const filteredItems = stackItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTiming = !filters.timing || item.timing === filters.timing
    const matchesPublic = !filters.public || 
                         (filters.public === 'public' && item.public) ||
                         (filters.public === 'private' && !item.public)
    const matchesFrequency = !filters.frequency || item.frequency === filters.frequency

    return matchesSearch && matchesTiming && matchesPublic && matchesFrequency
  })

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm">
          <Link href="/dash" className="text-gray-500 hover:text-gray-700">
            Dashboard
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900 font-medium">Supplements Management</span>
        </nav>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-gray-900">Supplements Management</h1>
          <p className="text-gray-600 mt-1">Manage your supplements and vitamins.</p>
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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-64"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilter || activeFilterCount > 0
                ? 'bg-gray-900 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-gray-900 px-2 py-0.5 rounded-full text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Add Supplement */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplement</span>
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
              <select
                value={filters.timing}
                onChange={(e) => setFilters(prev => ({ ...prev, timing: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">All Times</option>
                <option value="morning">Morning</option>
                <option value="midday">Midday</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <select
                value={filters.public}
                onChange={(e) => setFilters(prev => ({ ...prev, public: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">All Items</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={filters.frequency}
                onChange={(e) => setFilters(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">All Frequencies</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setFilters({ timing: '', public: '', frequency: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Clear All
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                {item.dose && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Dose:</span> {item.dose}
                  </p>
                )}
                {item.brand && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Brand:</span> {item.brand}
                  </p>
                )}
                {item.timing && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Timing:</span> {item.timing}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {item.frequency && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frequency</span>
                  <span className="text-sm font-medium text-gray-900">{item.frequency}</span>
                </div>
              )}
              {item.time_preference && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time</span>
                  <span className="text-sm font-medium text-gray-900">{item.time_preference}</span>
                </div>
              )}
              {item.notes && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notes</span>
                  <span className="text-sm font-medium text-gray-900">{item.notes}</span>
                </div>
              )}
              {item.categories && item.categories.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium text-gray-900">{item.categories[0]}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {item.public ? 'Public' : 'Private'}
              </span>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyPublicLink()}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  title="Copy public link"
                >
                  <Copy className="w-4 h-4" />
                </button>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === item.id ? null : item.id)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  
                  {openMenuId === item.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublic(item)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Make {item.public ? 'Private' : 'Public'}
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
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
        {filteredItems.length === 0 && (
          <div className="col-span-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || activeFilterCount > 0 ? 'No supplements found' : 'No supplements yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first supplement to get started'
                }
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Supplement
              </button>
            </div>
          )}
        </div>

        {/* Item Count */}
        {filteredItems.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Showing {filteredItems.length} of {stackItems.length} supplements
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddStackItemForm 
          onClose={() => setShowAddForm(false)} 
          itemType="supplements"
        />
      )}

      {editingItem && (
        <EditStackItemForm 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
        />
      )}
    </div>
  )
}
