'use client'

import { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Calendar, User, Tag, Globe, Lock, Star } from 'lucide-react'
import { LibraryItem } from '../lib/actions/library'

interface LibraryViewerProps {
  item: LibraryItem | null
  isOpen: boolean
  onClose: () => void
  isOwner?: boolean
}

export default function LibraryViewer({ item, isOpen, onClose, isOwner = false }: LibraryViewerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && item) {
      setLoading(false)
      setError(null)
    }
  }, [isOpen, item])

  if (!isOpen || !item) return null

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
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    })
  }

  const handleDownload = () => {
    if (item.allow_download || isOwner) {
      window.open(`/api/library/${item.id}/download`, '_blank')
    }
  }

  const handleOpenExternal = () => {
    window.open(`/api/library/${item.id}/preview`, '_blank')
  }

  const canPreviewInline = () => {
    return item.file_type.startsWith('image/') || item.file_type === 'application/pdf'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex">
        
        {/* Sidebar - Item Details */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getCategoryLabel(item.category)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Featured Badge */}
            {item.is_featured && item.category === 'training_plan' && (
              <div className="mt-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Star className="w-4 h-4 mr-1" />
                  Current Plan
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(item.date)}</span>
                </div>
                
                {item.provider && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>{item.provider}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="text-base">{getFileTypeIcon(item.file_type)}</span>
                  <span>{item.file_type}</span>
                  {item.file_size && (
                    <>
                      <span>•</span>
                      <span>{formatFileSize(item.file_size)}</span>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  {item.is_public ? (
                    <>
                      <Globe className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Public</span>
                      {item.allow_download && (
                        <span className="text-green-600">• Downloads allowed</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Private</span>
                    </>
                  )}
                </div>
              </div>

              {/* Public Summary */}
              {item.summary_public && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.summary_public}
                  </p>
                </div>
              )}

              {/* Private Notes (owner only) */}
              {isOwner && item.notes_private && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Private Notes</h4>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    {item.notes_private}
                  </p>
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="space-y-2">
              <button
                onClick={handleOpenExternal}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab</span>
              </button>
              
              {(item.allow_download || isOwner) && (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - File Preview */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 flex items-center justify-center p-8">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading preview...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={handleOpenExternal}
                  className="text-gray-600 hover:text-gray-900 underline"
                >
                  Open file directly
                </button>
              </div>
            ) : canPreviewInline() ? (
              <div className="w-full h-full flex items-center justify-center">
                {item.file_type.startsWith('image/') ? (
                  <img
                    src={`/api/library/${item.id}/preview`}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onError={() => setError('Failed to load image')}
                  />
                ) : item.file_type === 'application/pdf' ? (
                  <iframe
                    src={`/api/library/${item.id}/preview`}
                    className="w-full h-full border-0 rounded-lg shadow-lg"
                    title={item.title}
                    onError={() => setError('Failed to load PDF')}
                  />
                ) : null}
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">{getFileTypeIcon(item.file_type)}</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 mb-4">
                  This file type cannot be previewed inline.
                </p>
                <button
                  onClick={handleOpenExternal}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
