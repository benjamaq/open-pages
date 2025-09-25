'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MoreHorizontal, Eye, EyeOff, Copy, Trash2 } from 'lucide-react'
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
  const [showKebab, setShowKebab] = useState<string | null>(null)
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
                  className="bg-gray-900 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
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
          <span className="text-gray-900 font-medium">Supplements Management</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Supplements Management</h1>
          <p className="text-gray-600 mt-1">Manage your supplements and vitamins.</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gray-900 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-1 sm:space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplement</span>
        </button>
      </div>

      {/* Supplements Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stackItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.dose && <p className="text-sm text-gray-600">Dose: {item.dose}</p>}
              {item.brand && <p className="text-sm text-gray-600">Brand: {item.brand}</p>}
              {item.timing && <p className="text-sm text-gray-600">Timing: {item.timing}</p>}
              
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.public ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {item.public ? 'Public' : 'Private'}
                </span>
                <div className="flex items-center space-x-2">
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
          {stackItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements yet</h3>
              <p className="text-gray-500 mb-6">Add your first supplement to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Supplement
              </button>
            </div>
          )}
        </div>
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
      </div>
    )
}
