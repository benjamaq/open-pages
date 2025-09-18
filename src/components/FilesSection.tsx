'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Upload {
  id: string
  name: string
  description: string | null
  file_type: string
  file_url: string
  file_size: number
  public: boolean
  created_at: string
}

interface FilesSectionProps {
  uploads: Upload[]
}

export default function FilesSection({ uploads }: FilesSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAll, setShowAll] = useState(false)

  if (!uploads || uploads.length === 0) return null

  const displayUploads = showAll ? uploads : uploads.slice(0, 6)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'Image'
    if (fileType === 'application/pdf') return 'PDF'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'Spreadsheet'
    if (fileType.includes('document') || fileType.includes('word')) return 'Document'
    return 'File'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900">Files & Labs</h3>
            <p className="text-sm text-gray-500">{uploads.length} {uploads.length === 1 ? 'file' : 'files'}</p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${!collapsed ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {displayUploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(upload.file_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{upload.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{getFileTypeLabel(upload.file_type)}</span>
                      <span>•</span>
                      <span>{formatFileSize(upload.file_size)}</span>
                    </div>
                    {upload.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{upload.description}</p>
                    )}
                  </div>
                </div>
                <a
                  href={upload.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-gray-900 hover:text-gray-700 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-white transition-colors"
                >
                  View
                </a>
              </div>
            ))}
          </div>

          {/* Show more/less button */}
          {uploads.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              {showAll ? 'Show less' : `View all ${uploads.length} files`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
