'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react'
import AddProtocolForm from '../../../components/AddProtocolForm'
import EditProtocolForm from '../../../components/EditProtocolForm'
import { updateProtocol, deleteProtocol } from '../../../lib/actions/protocols'

interface Protocol {
  id: string
  name: string
  description: string | null
  frequency: string | null
  public: boolean
  created_at: string
}

interface Profile {
  id: string
  slug: string
  display_name: string
}

interface ProtocolsPageClientProps {
  protocols: Protocol[]
  profile: Profile
}

const ProtocolCard = ({ 
  protocol, 
  onEdit, 
  onTogglePublic, 
  onDuplicate, 
  onDelete 
}: { 
  protocol: Protocol
  onEdit: (protocol: Protocol) => void
  onTogglePublic: (protocol: Protocol) => void
  onDuplicate: (protocol: Protocol) => void
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
          <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate" title={protocol.name}>
            {protocol.name}
          </h3>
        </div>
        <button
          onClick={() => onTogglePublic(protocol)}
          className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            protocol.public 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {protocol.public ? 'Public' : 'Private'}
        </button>
      </div>

      {/* Body - Key Attributes */}
      <div className="space-y-2 mb-4">
        {protocol.frequency && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Frequency:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{protocol.frequency}</span>
          </div>
        )}
        {protocol.description && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Description:</span>
            <span className="text-sm text-gray-900 leading-relaxed">{protocol.description}</span>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Last edited: {getRelativeTime(protocol.created_at)}
        </span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(protocol)}
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
                      onDuplicate(protocol)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4 inline mr-2" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onTogglePublic(protocol)
                      setShowKebab(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {protocol.public ? (
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
                      onDelete(protocol.id)
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

export default function ProtocolsPageClient({ protocols, profile }: ProtocolsPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<Protocol | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState({
    frequency: '',
    visibility: ''
  })
  const router = useRouter()

  const handleTogglePublic = async (protocol: Protocol) => {
    try {
      await updateProtocol(protocol.id, {
        name: protocol.name,
        description: protocol.description || undefined,
        frequency: protocol.frequency || undefined,
        public: !protocol.public
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleDelete = async (protocolId: string) => {
    if (confirm('Are you sure you want to delete this protocol?')) {
      try {
        await deleteProtocol(protocolId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete protocol:', error)
      }
    }
  }

  const handleEdit = (protocol: Protocol) => {
    setEditingProtocol(protocol)
  }

  const handleDuplicate = async (protocol: Protocol) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate protocol:', protocol)
  }

  // Filter protocols based on search and filters
  const filteredProtocols = protocols.filter(protocol => {
    // Search filter
    if (searchQuery && !protocol.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !protocol.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    // Apply other filters
    if (filters.frequency && protocol.frequency !== filters.frequency) return false
    if (filters.visibility === 'public' && !protocol.public) return false
    if (filters.visibility === 'private' && protocol.public) return false
    
    return true
  })

  const clearFilters = () => {
    setFilters({
      frequency: '',
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
                    className="h-16 w-auto"
                    style={{ width: '280px' }}
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
              <span className="text-gray-900 font-medium">Protocols Management</span>
            </nav>
          </div>

          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Protocols Management</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search protocols..."
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

              {/* Add Protocol */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Protocol</span>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select
                    value={filters.frequency}
                    onChange={(e) => setFilters(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All frequencies</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={filters.visibility}
                    onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">All protocols</option>
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
          {filteredProtocols.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProtocols.map((protocol) => (
                <ProtocolCard
                  key={protocol.id}
                  protocol={protocol}
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Protocols yet</h3>
              <p className="text-gray-600 mb-6">Add your first protocol to build your wellness routine.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Protocol
              </button>
            </div>
          )}

          {/* Protocol Count */}
          {filteredProtocols.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Showing {filteredProtocols.length} of {protocols.length} protocols
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddProtocolForm onClose={() => setShowAddForm(false)} />
      )}

      {editingProtocol && (
        <EditProtocolForm 
          protocol={editingProtocol} 
          onClose={() => setEditingProtocol(null)} 
        />
      )}
    </>
  )
}
