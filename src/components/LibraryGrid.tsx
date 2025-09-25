'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, Grid3X3, List, Plus, SortAsc, SortDesc } from 'lucide-react'
import LibraryCard from './LibraryCard'
import { LibraryItem } from '../lib/actions/library'

interface LibraryGridProps {
  items: LibraryItem[]
  onEdit?: (item: LibraryItem) => void
  onDelete?: (item: LibraryItem) => void
  onView?: (item: LibraryItem) => void
  onAdd?: () => void
  isOwner?: boolean
  showAddButton?: boolean
  title?: string
  emptyMessage?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'date' | 'title' | 'category' | 'created_at'
type SortOrder = 'asc' | 'desc'

const CATEGORY_FILTERS = [
  { value: 'all', label: 'All Items', icon: '📚' },
  { value: 'lab', label: 'Lab Results', icon: '🧪' },
  { value: 'assessment', label: 'Assessments', icon: '📊' },
  { value: 'training_plan', label: 'Training Plans', icon: '🏋️' },
  { value: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { value: 'wearable_report', label: 'Wearable Data', icon: '⌚' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { value: 'recovery', label: 'Recovery', icon: '🛌' },
  { value: 'other', label: 'Other', icon: '📄' }
]

export default function LibraryGrid({
  items,
  onEdit,
  onDelete,
  onView,
  onAdd,
  isOwner = false,
  showAddButton = true,
  title = 'Library',
  emptyMessage = 'No items in your library yet'
}: LibraryGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.summary_public?.toLowerCase().includes(query) ||
        item.provider?.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        default:
          aValue = a.date
          bValue = b.date
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [items, searchQuery, selectedCategory, sortField, sortOrder])

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length }
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }, [items])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = sortOrder === 'asc' ? SortAsc : SortDesc

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAndSortedItems.length} of {items.length} items
            {selectedCategory !== 'all' && (
              <span className="ml-1">
                in {CATEGORY_FILTERS.find(f => f.value === selectedCategory)?.label}
              </span>
            )}
          </p>
        </div>
        
        {showAddButton && onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Search and View Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search library items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-gray-900 text-white border-gray-900' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Category</h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_FILTERS.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedCategory(filter.value)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === filter.value
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                    {categoryCounts[filter.value] > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selectedCategory === filter.value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {categoryCounts[filter.value]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Sort by</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { field: 'date' as SortField, label: 'Date' },
                  { field: 'title' as SortField, label: 'Title' },
                  { field: 'category' as SortField, label: 'Category' },
                  { field: 'created_at' as SortField, label: 'Added' }
                ].map(option => (
                  <button
                    key={option.field}
                    onClick={() => handleSort(option.field)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sortField === option.field
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortField === option.field && <SortIcon className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {filteredAndSortedItems.length > 0 ? (
        <div 
          className={`max-h-96 overflow-y-auto pr-2 ${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }`}
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent'
          }}
        >
          {filteredAndSortedItems.map(item => (
            <LibraryCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              isOwner={isOwner}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || selectedCategory !== 'all' 
              ? 'No items found' 
              : isOwner 
                ? emptyMessage 
                : 'No library items shared yet'
            }
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : isOwner 
                ? 'Upload and organize your health documents, lab results, training plans, and other important files in one place.'
                : 'This user hasn\'t shared any library items yet. Check back later to see their health documents, lab results, and training plans.'
            }
          </p>
          {showAddButton && onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Item</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
