'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AddUploadForm from '../../../components/AddUploadForm'
import EditUploadForm from '../../../components/EditUploadForm'
import { updateUpload, deleteUpload } from '../../../lib/actions/uploads'

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

interface Profile {
  id: string
  slug: string
  display_name: string
}

interface UploadsPageClientProps {
  uploads: Upload[]
  profile: Profile
}

export default function UploadsPageClient({ uploads, profile }: UploadsPageClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingUpload, setEditingUpload] = useState<Upload | null>(null)
  const router = useRouter()

  const handleTogglePublic = async (upload: Upload) => {
    try {
      await updateUpload(upload.id, {
        name: upload.name,
        description: upload.description || undefined,
        public: !upload.public
      })
      router.refresh()
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  const handleDelete = async (uploadId: string) => {
    if (confirm('Are you sure you want to delete this file? This will also remove it from storage.')) {
      try {
        await deleteUpload(uploadId)
        router.refresh()
        setOpenMenuId(null)
      } catch (error) {
        console.error('Failed to delete upload:', error)
      }
    }
  }

  const handleEdit = (upload: Upload) => {
    setEditingUpload(upload)
    setOpenMenuId(null)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

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
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

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
                    className="h-14 w-auto"
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
              <span className="text-gray-900 font-medium">Files &amp; Labs Management</span>
            </nav>
          </div>

          {/* Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">Files &amp; Labs Management</h1>
              <p className="text-gray-600 mt-2">
                Upload and manage your health files, lab results, and progress photos.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Add Upload */}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Upload File</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          {uploads && uploads.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {uploads.map((upload) => (
                <div key={upload.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getFileIcon(upload.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate" title={upload.name}>
                          {upload.name}
                        </h3>
                      </div>
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      upload.public 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {upload.public ? 'Public' : 'Private'}
                    </span>
                  </div>

                  {/* Body - Key Attributes */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Type:</span>
                      <span className="text-sm text-gray-900 font-medium">{upload.file_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Size:</span>
                      <span className="text-sm text-gray-900 font-medium">{formatFileSize(upload.file_size)}</span>
                    </div>
                    {upload.description && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Description:</span>
                        <span className="text-sm text-gray-900 leading-relaxed">{upload.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <a
                      href={upload.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-gray-700 text-sm font-medium"
                    >
                      View File
                    </a>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(upload)}
                        className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        Edit
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenMenuId(openMenuId === upload.id ? null : upload.id)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {openMenuId === upload.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleTogglePublic(upload)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={upload.public ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12l2.122-2.122M6.732 6.732l10.536 10.536" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                                </svg>
                                Make {upload.public ? 'Private' : 'Public'}
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(upload.id)
                                  setOpenMenuId(null)
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Files uploaded yet</h3>
              <p className="text-gray-600 mb-6">Upload your first file to get started with sharing your health journey.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                + Upload File
              </button>
            </div>
          )}

          {/* Upload Count */}
          {uploads && uploads.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Showing {uploads.length} file{uploads.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddUploadForm onClose={() => setShowAddForm(false)} />
      )}

      {editingUpload && (
        <EditUploadForm 
          upload={editingUpload} 
          onClose={() => setEditingUpload(null)} 
        />
      )}
    </>
  )
}
