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
      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Uploads</h1>
          <p className="text-gray-600 mt-2">
            Upload and manage your health files, lab results, and progress photos.
          </p>
        </div>

        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm">
            <Link
              href="/dash"
              className="text-gray-500 hover:text-gray-700"
            >
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Uploads Management</span>
          </nav>
        </div>

        {/* Uploads Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Files</h2>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Upload File
              </button>
            </div>
          </div>

          <div className="p-6">
            {uploads && uploads.length > 0 ? (
              <div className="space-y-4">
                {uploads.map((upload) => (
                  <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0">
                            {getFileIcon(upload.file_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 truncate">{upload.name}</h3>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Type:</span> {upload.file_type}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Size:</span> {formatFileSize(upload.file_size)}
                              </p>
                              {upload.description && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Description:</span> {upload.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            upload.public 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {upload.public ? 'Public' : 'Private'}
                          </span>
                          <a
                            href={upload.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-900 hover:text-gray-700 text-sm font-medium"
                          >
                            View
                          </a>
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuId(openMenuId === upload.id ? null : upload.id)
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                            
                            {openMenuId === upload.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEdit(upload)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleTogglePublic(upload)}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    Make {upload.public ? 'Private' : 'Public'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(upload.id)}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
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
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Upload your first file to get started with sharing your health journey.</p>
                  <div className="mt-6">
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Upload your first file
                    </button>
                  </div>
                </div>
              )}
            </div>
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
