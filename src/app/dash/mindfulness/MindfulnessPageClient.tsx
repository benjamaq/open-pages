'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import AddStackItemForm from '../../../components/AddStackItemForm'
import EditStackItemForm from '../../../components/EditStackItemForm'

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

export default function MindfulnessPageClient({ mindfulnessItems, profile }: MindfulnessPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MindfulnessItem | null>(null)

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
                className="h-16 w-auto"
                style={{ height: '80px', width: 'auto' }}
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
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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
            <span className="text-gray-900 font-medium">Mindfulness Management</span>
          </nav>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mindfulness Management</h1>
            <p className="text-gray-600 mt-1">Manage your mindfulness practices and meditation routines.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Practice</span>
          </button>
        </div>

        {/* Mindfulness Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mindfulnessItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              {item.timing && <p className="text-sm text-gray-600">Timing: {item.timing}</p>}
              {item.frequency && <p className="text-sm text-gray-600">Frequency: {item.frequency}</p>}
              {item.notes && <p className="text-sm text-gray-600">Notes: {item.notes}</p>}
              
              <div className="mt-4 flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.public ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {item.public ? 'Public' : 'Private'}
                </span>
                <button
                  onClick={() => setEditingItem(item)}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {mindfulnessItems.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mindfulness practices yet</h3>
              <p className="text-gray-500 mb-6">Add your first mindfulness practice to get started</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Add Practice
              </button>
            </div>
          )}
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
