'use client'

import { useState } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { LibraryItem, deleteLibraryItem } from '../../../lib/actions/library'
import LibraryGrid from '../../../components/LibraryGrid'
import LibraryUploadForm from '../../../components/LibraryUploadForm'
import Link from 'next/link'

interface LibraryClientProps {
  profile: {
    id: string
    slug: string
    display_name: string
  }
  initialItems: LibraryItem[]
}

export default function LibraryClient({ profile, initialItems }: LibraryClientProps) {
  const [items, setItems] = useState<LibraryItem[]>(initialItems)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)

  const handleAdd = () => {
    setEditingItem(null)
    setShowUploadForm(true)
  }

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item)
    setShowUploadForm(true)
  }

  const handleDelete = async (item: LibraryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteLibraryItem(item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch (error) {
      console.error('Failed to delete item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  const handleUploadSuccess = (newItem: LibraryItem) => {
    if (editingItem) {
      // Update existing item
      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? newItem : item
      ))
    } else {
      // Add new item
      setItems(prev => [newItem, ...prev])
    }
    setShowUploadForm(false)
    setEditingItem(null)
  }

  const handleView = (item: LibraryItem) => {
    window.open(`/api/library/${item.id}/preview`, '_blank')
  }

  const handleCloseForm = () => {
    setShowUploadForm(false)
    setEditingItem(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

        {/* Row 2: Navigation */}
        <div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dash"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <span className="text-gray-300">•</span>
                <span className="text-gray-900 font-medium">Library</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link
                  href={`/u/${profile.slug}#library`}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  View Public Library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LibraryGrid
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onAdd={handleAdd}
          isOwner={true}
          showAddButton={true}
          title="My Library"
          emptyMessage="Your library is empty"
        />
      </div>

      {/* Upload/Edit Form Modal */}
      {showUploadForm && (
        <LibraryUploadForm
          onClose={handleCloseForm}
          onSuccess={handleUploadSuccess}
          editItem={editingItem}
          mode={editingItem ? 'edit' : 'create'}
        />
      )}
    </div>
  )
}
