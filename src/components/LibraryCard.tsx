'use client'

import { useState } from 'react'
import { Eye, Download, Edit, Trash2, Calendar, User, Tag, Globe, Lock } from 'lucide-react'
import { LibraryItem } from '../lib/actions/library'

interface LibraryCardProps {
  item: LibraryItem
  onEdit?: (item: LibraryItem) => void
  onDelete?: (item: LibraryItem) => void
  onView?: (item: LibraryItem) => void
  isOwner?: boolean
  showActions?: boolean
}

export default function LibraryCard({ 
  item, 
  onEdit, 
  onDelete, 
  onView,
  isOwner = false,
  showActions = true 
}: LibraryCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'lab': '🧪',
      'assessment': '📊',
      'training_plan': '🏋️',
      'nutrition': '🥗',
      'wearable_report': '⌚',
      'mindfulness': '🧘',
      'recovery': '🛌',
      'other': '📄'
    }
    return icons[category] || '📄'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'lab': 'Lab Results',
      'assessment': 'Assessment',
      'training_plan': 'Training Plan',
      'nutrition': 'Nutrition',
      'wearable_report': 'Wearable Data',
      'mindfulness': 'Mindfulness',
      'recovery': 'Recovery',
      'other': 'Other'
    }
    return labels[category] || 'Other'
  }

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return '🖼️'
    } else if (fileType === 'application/pdf') {
      return '📄'
    } else if (fileType.includes('spreadsheet') || fileType.includes('csv')) {
      return '📊'
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return '📝'
    }
    return '📎'
  }

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const handleView = () => {
    if (onView) {
      onView(item)
    } else {
      // Fallback to direct file access for public items
      if (item.is_public || isOwner) {
        window.open(`/api/library/${item.id}/preview`, '_blank')
      }
    }
  }

  const handleDownload = () => {
    if (item.allow_download || isOwner) {
      // Create a temporary link element for better mobile compatibility
      const link = document.createElement('a')
      link.href = `/api/library/${item.id}/download`
      link.download = item.title || 'download'
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      
      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Category and Privacy */}
      <div className="p-4 pb-3 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getCategoryIcon(item.category)}</span>
            <div>
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {getCategoryLabel(item.category)}
              </span>
              {item.is_featured && item.category === 'training_plan' && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ⭐ Current Plan
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Privacy indicator */}
            {item.is_public ? (
              <Globe className="w-4 h-4 text-green-600" title="Public" />
            ) : (
              <Lock className="w-4 h-4 text-gray-400" title="Private" />
            )}
            
            {/* File type */}
            <span className="text-sm" title={item.file_type}>
              {getFileTypeIcon(item.file_type)}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 leading-tight">
            {item.title}
          </h3>

          {/* Metadata */}
          <div className="space-y-2">
            <div className="flex items-center text-xs text-gray-500 space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(item.date)}</span>
              </div>
              {item.provider && (
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-20">{item.provider}</span>
                </div>
              )}
              {item.file_size && (
                <span>{formatFileSize(item.file_size)}</span>
              )}
            </div>

            {/* Public summary */}
            {item.summary_public && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {item.summary_public}
              </p>
            )}

            {/* Private notes (owner only) */}
            {isOwner && item.notes_private && (
              <p className="text-sm text-gray-500 italic line-clamp-1 border-l-2 border-gray-200 pl-2">
                {item.notes_private}
              </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center space-x-1 flex-wrap">
                <Tag className="w-3 h-3 text-gray-400" />
                {item.tags.slice(0, 3).map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-gray-400">
                    +{item.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      {showActions && (isOwner || item.is_public) && (
        <div className={`px-4 py-3 bg-gray-50 border-t border-gray-100 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-60'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* View button */}
              <button
                onClick={handleView}
                className="flex items-center space-x-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>

              {/* Download button (if allowed) */}
              {(item.allow_download || isOwner) && (
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              )}
            </div>

            {/* Owner actions */}
            {isOwner && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit?.(item)}
                  className="flex items-center space-x-1 text-xs font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDelete?.(item)}
                  className="flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
