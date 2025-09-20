'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { LibraryItem } from '../lib/actions/library'
import LibraryGrid from './LibraryGrid'
import LibraryViewer from './LibraryViewer'

interface PublicLibrarySectionProps {
  libraryItems: LibraryItem[]
  profileSlug?: string
}

export default function PublicLibrarySection({ 
  libraryItems,
  profileSlug 
}: PublicLibrarySectionProps) {
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleView = (item: LibraryItem) => {
    setSelectedItem(item)
    setShowViewer(true)
  }

  const handleCloseViewer = () => {
    setShowViewer(false)
    setSelectedItem(null)
  }

  return (
    <>
      <section className="mb-8" id="library">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Header with collapse button */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Library ({libraryItems.length})
            </h2>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
            </button>
          </div>
          
          {/* Content */}
          {!collapsed && (
            <div className="px-6 pb-6">
              <LibraryGrid
                items={libraryItems}
                onView={handleView}
                isOwner={false}
                showAddButton={false}
                title=""
                emptyMessage="No library items shared yet"
              />
            </div>
          )}
        </div>
      </section>

      {/* Library Viewer Modal */}
      <LibraryViewer
        item={selectedItem}
        isOpen={showViewer}
        onClose={handleCloseViewer}
        isOwner={false}
      />
    </>
  )
}
