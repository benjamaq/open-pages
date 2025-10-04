'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit3, MoreHorizontal, Eye, EyeOff, Copy, Trash2, X } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'
import { updateStackItem, deleteStackItem } from '../../../lib/actions/stack'

interface MovementItem {
  id: string
  name: string
  dose: string | null
  timing: string | null
  notes: string | null
  public: boolean
  created_at: string
  updated_at: string
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

  const router = useRouter()


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
                className="bg-gray-900 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Movement Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your movement activities and exercise routines
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            Add
          </button>
        </div>


        {/* Movement Items Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-6">
            {movementItems.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No movement activities yet</h3>
                <p className="text-gray-500 mb-6">
                  Add your first movement activity to get started with tracking your fitness routine.
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
                  {movementItems.map((movement) => (
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
            item={editingItem} 
            onClose={() => setEditingItem(null)} 
          />
        )}
      </div>
    </div>
  )
}
