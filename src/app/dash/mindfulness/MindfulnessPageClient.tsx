'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2 } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'
import { updateStackItem, deleteStackItem } from '../../../lib/actions/stack'

interface MindfulnessItem {
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

interface MindfulnessPageClientProps {
  mindfulnessItems: MindfulnessItem[]
  profile: Profile
}

const MindfulnessCard = ({ 
  item, 
  onEdit, 
  onTogglePublic, 
  onDuplicate, 
  onDelete 
}: { 
  item: MindfulnessItem
  onEdit: (item: MindfulnessItem) => void
  onTogglePublic: (item: MindfulnessItem) => void
  onDuplicate: (item: MindfulnessItem) => void
  onDelete: (id: string) => void
}) => {
  const [showKebab, setShowKebab] = useState(false)

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.public 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {item.public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </div>

      {/* Body - Key Attributes */}
      <div className="space-y-2 mb-4">
        {item.timing && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Timing:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{item.timing}</span>
          </div>
        )}
        {item.frequency && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Frequency:</span>
            <span className="text-sm text-gray-900 font-medium capitalize">{item.frequency}</span>
          </div>
        )}
        {item.notes && (
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 mb-1">Notes:</span>
            <span className="text-sm text-gray-900 leading-relaxed">{item.notes}</span>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Last edited: {getRelativeTime(item.created_at)}
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

export default function MindfulnessPageClient({ mindfulnessItems, profile }: MindfulnessPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MindfulnessItem | null>(null)
  const router = useRouter()

  const handleTogglePublic = async (item: MindfulnessItem) => {
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
    if (confirm('Are you sure you want to delete this mindfulness practice?')) {
      try {
        await deleteStackItem(itemId)
        router.refresh()
      } catch (error) {
        console.error('Failed to delete item:', error)
      }
    }
  }

  const handleDuplicate = async (item: MindfulnessItem) => {
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
        itemType: 'mindfulness',
        frequency: item.frequency || 'daily',
        time_preference: item.time_preference || 'anytime',
        schedule_days: item.schedule_days || [0, 1, 2, 3, 4, 5, 6]
      }
      
      await addStackItem(duplicateData)
      router.refresh()
    } catch (error) {
      console.error('Failed to duplicate mindfulness practice:', error)
      alert('Failed to duplicate mindfulness practice. Please try again.')
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
            <span className="text-gray-900 font-medium">Mind & Stress Management</span>
          </nav>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Mind & Stress Management</h1>
            <p className="text-gray-600 mt-1">Manage your meditation, breathwork, CBT drills, NSDR, gratitude, and mental skills.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-900 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-1 sm:space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Practice</span>
          </button>
        </div>

        {/* Mindfulness Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {mindfulnessItems.map((item) => (
              <MindfulnessCard
                key={item.id}
                item={item}
                onEdit={setEditingItem}
                onTogglePublic={handleTogglePublic}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}

            {/* Empty State */}
            {mindfulnessItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mindfulness practices yet</h3>
                <p className="text-gray-500 mb-6">Add your first mindfulness practice to get started</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors"
                >
                  + Add Practice
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddForm && (
        <AddStackItemForm 
          onClose={() => setShowAddForm(false)} 
          itemType="mindfulness"
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
