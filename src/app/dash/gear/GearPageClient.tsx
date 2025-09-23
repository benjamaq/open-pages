'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react'
import AddGearForm from '../../../components/AddGearForm'
import EditGearForm from '../../../components/EditGearForm'
import { updateGear, deleteGear } from '../../../lib/actions/gear'

interface GearItem {
  id: string
  name: string
  brand: string | null
  model: string | null
  category: string
  description: string | null
  buy_link: string | null
  public: boolean
  created_at: string
}

interface Profile {
  id: string
  slug: string
  display_name: string
}

interface GearPageClientProps {
  gear: GearItem[]
  profile: Profile
}

const GearCard = ({ 
  gearItem, 
  onEdit, 
  onTogglePublic, 
  onDuplicate, 
  onDelete 
}: { 
  gearItem: GearItem
  onEdit: (gear: GearItem) => void
  onTogglePublic: (gear: GearItem) => void
  onDuplicate: (gear: GearItem) => void
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
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate" title={gearItem.name}>
              {gearItem.name}
            </h3>
            {gearItem.brand && (
              <p className="text-sm text-gray-500">
                {gearItem.brand}{gearItem.model && ` ${gearItem.model}`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onTogglePublic(gearItem)}
          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            gearItem.public 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {gearItem.public ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Body - Key Attributes */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Category:</span>
          <span className="text-sm text-gray-900 font-medium">{gearItem.category}</span>
        </div>
        {gearItem.description && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Description:</span>
            <span className="text-sm text-gray-900 leading-relaxed">{gearItem.description}</span>
          </div>
        )}
        {gearItem.buy_link && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Affiliate:</span>
            <a
              href={gearItem.buy_link}
              target="_blank"
              rel="nofollow sponsored noopener"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Buy Link →
            </a>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Added: {getRelativeTime(gearItem.created_at)}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(gearItem)}
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
                      onDuplicate(gearItem)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onTogglePublic(gearItem)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {gearItem.public ? (
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
                      onDelete(gearItem.id)
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

export default function GearPageClient({ gear, profile }: GearPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGear, setEditingGear] = useState<GearItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    visibility: ''
  })
  const router = useRouter()

  const handleTogglePublic = async (gearItem: GearItem) => {
    try {
      await updateGear(gearItem.id, {
        name: gearItem.name,
        brand: gearItem.brand || undefined,
        model: gearItem.model || undefined,
        category: gearItem.category,
        description: gearItem.description || undefined,
        buy_link: gearItem.buy_link || undefined,
        public: !gearItem.public
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleDelete = async (gearId: string) => {
    if (confirm('Are you sure you want to delete this gear item?')) {
      try {
        await deleteGear(gearId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete gear:', error)
      }
    }
  }

  const handleEdit = (gearItem: GearItem) => {
    setEditingGear(gearItem)
  }

  const handleDuplicate = async (gearItem: GearItem) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate gear:', gearItem)
  }

  // Filter gear based on search and filters
  const filteredGear = gear.filter(item => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Apply other filters
    if (filters.category && item.category !== filters.category) return false
    if (filters.visibility === 'public' && !item.public) return false
    if (filters.visibility === 'private' && item.public) return false
    
    return true
  })

  const clearFilters = () => {
    setFilters({
      category: '',
      visibility: ''
    })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Navigation */}
        <nav className="border-b border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {/* Dashboard Button */}
                <Link 
                  href="/dash" 
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/dash" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
              <span className="text-gray-300">&gt;</span>
              <span className="text-gray-900 font-medium">Gear Management</span>
            </nav>
          </div>

          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Gear Management</h1>
              <p className="text-gray-600 mt-2">
                Showcase your equipment, wearables, and tools
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gear..."
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

              {/* Add Gear */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Gear</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All categories</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Recovery">Recovery</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={filters.visibility}
                    onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All gear</option>
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
          {filteredGear.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGear.map((gearItem) => (
                <GearCard
                  key={gearItem.id}
                  gearItem={gearItem}
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
                <span className="text-2xl">🎧</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Gear yet</h3>
              <p className="text-gray-600 mb-6">Add your first gear item to showcase your equipment.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Gear
              </button>
            </div>
          )}

          {/* Gear Count */}
          {filteredGear.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Showing {filteredGear.length} of {gear.length} gear items
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddGearForm onClose={() => setShowAddForm(false)} />
      )}

      {editingGear && (
        <EditGearForm 
          gear={editingGear} 
          onClose={() => setEditingGear(null)} 
        />
      )}
    </>
  )
}
