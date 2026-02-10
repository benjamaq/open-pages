'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X, Search, Filter } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'
import { updateStackItem, deleteStackItem } from '../../../lib/actions/stack'

interface MovementItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  brand?: string | null
  notes: string | null
  public: boolean
  created_at: string
  updated_at: string
  time_preference?: string | null
}

interface MovementPageClientProps {
  movementItems: MovementItem[]
  profile: {
    id: string
    slug: string
    display_name: string
  }
}

const MovementCard = ({ 
  movement, 
  onEdit, 
  onTogglePublic, 
  onDuplicate, 
  onDelete 
}: { 
  movement: MovementItem
  onEdit: (movement: MovementItem) => void
  onTogglePublic: (movement: MovementItem) => void
  onDuplicate: (movement: MovementItem) => void
  onDelete: (id: string) => void
}) => {
  const [showKebab, setShowKebab] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showKebab) {
        setShowKebab(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showKebab])

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate" title={movement.name}>
            {movement.name}
          </h3>
        </div>
        <button
          onClick={() => onTogglePublic(movement)}
          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            movement.public 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {movement.public ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Body - Key Attributes */}
      <div className="space-y-2 mb-4">
        {movement.dose && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Duration:</span>
            <span className="text-sm text-gray-900 font-medium">{movement.dose}</span>
          </div>
        )}
        {movement.timing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Timing:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{movement.timing}</span>
          </div>
        )}
        {movement.notes && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Notes:</span>
            <span className="text-sm text-gray-900 leading-relaxed">{movement.notes}</span>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Last edited: {getRelativeTime(movement.created_at)}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(movement)}
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
                      onDuplicate(movement)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onTogglePublic(movement)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {movement.public ? (
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
                      onDelete(movement.id)
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

export default function MovementPageClient({ movementItems, profile }: MovementPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MovementItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    time_preference: '',
    visibility: ''
  })

  const router = useRouter()

  // Filter movement items based on search and filters
  const filteredItems = movementItems.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.notes?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Apply other filters
    if (filters.time_preference && item.time_preference !== filters.time_preference) return false
    if (filters.visibility === 'public' && !item.public) return false
    if (filters.visibility === 'private' && item.public) return false
    
    return true
  })

  const clearFilters = () => {
    setFilters({
      time_preference: '',
      visibility: ''
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const handleEdit = (movement: MovementItem) => {
    setEditingItem(movement)
  }

  const handleTogglePublic = async (movement: MovementItem) => {
    try {
      await updateStackItem(movement.id, {
        name: movement.name,
        dose: movement.dose || '',
        timing: movement.timing || '',
        notes: movement.notes || '',
        public: !movement.public,
        category: 'General' // Default category for movement
      })
      router.refresh()
    } catch (error) {
      console.error('Error updating movement:', error)
      alert('Failed to update movement. Please try again.')
    }
  }

  const handleDuplicate = async (movement: MovementItem) => {
    try {
      // Import the addStackItem function
      const { addStackItem } = await import('../../../lib/actions/stack')
      
      // Create a duplicate with "Copy of" prefix
      const duplicateData = {
        name: `Copy of ${movement.name}`,
        dose: movement.dose || '',
        timing: movement.timing || '',
        notes: movement.notes || '',
        public: movement.public,
        itemType: 'movement',
        frequency: 'daily', // Default frequency
        time_preference: 'anytime', // Default time preference
        schedule_days: [0, 1, 2, 3, 4, 5, 6], // Default to all days
        category: 'General' // Default category
      }
      
      await addStackItem(duplicateData)
      router.refresh()
    } catch (error) {
      console.error('Failed to duplicate movement:', error)
      alert('Failed to duplicate movement. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this movement item?')) {
      try {
        await deleteStackItem(id)
        router.refresh()
      } catch (error) {
        console.error('Error deleting movement:', error)
        alert('Failed to delete movement. Please try again.')
      }
    }
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header - Brand First Design */}
      <div className="bg-white shadow-sm">
        {/* Row 1: Brand Only */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
            <Link href="/dash" className="inline-flex items-center">
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/dash" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <span className="text-gray-300">&gt;</span>
            <span className="text-gray-900 font-medium">Movement Management</span>
          </nav>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Movement Management</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Manage your physical activities - yoga, stretching, mobility work, strength training, cardio.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movement..."
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

            {/* Add Movement */}
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-1 bg-gray-900 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
            >
              <span>Add</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Preference Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time Preference</label>
                  <select
                    value={filters.time_preference}
                    onChange={(e) => setFilters(prev => ({ ...prev, time_preference: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="">All Times</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>

                {/* Visibility Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Visibility</label>
                  <select
                    value={filters.visibility}
                    onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="">All Items</option>
                    <option value="public">Public Only</option>
                    <option value="private">Private Only</option>
                  </select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Movement Items Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-6">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No physical activities yet</h3>
                <p className="text-gray-500 mb-6">
                  Add yoga, stretching, mobility work, strength training, or cardio
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((movement) => (
                    <MovementCard
                      key={movement.id}
                      movement={movement}
                      onEdit={handleEdit}
                      onTogglePublic={handleTogglePublic}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        {showAddForm && (
          <AddStackItemForm 
            onClose={() => setShowAddForm(false)} 
            itemType="movement"
          />
        )}

        {editingItem && (
          <EditStackItemForm 
            item={editingItem as any} 
            onClose={() => setEditingItem(null)} 
          />
        )}
      </div>
    </div>
  )
}
