'use client'

import { useState } from 'react'
import { addUpload } from '../lib/actions/uploads'
import { uploadFile } from '../lib/storage'
import { useRouter } from 'next/navigation'

interface AddUploadFormProps {
  onClose: () => void
}

export default function AddUploadForm({ onClose }: AddUploadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    public: true
  })
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Upload file to storage
      const { url, error: uploadError } = await uploadFile(
        file,
        (progress) => setUploadProgress(progress)
      )

      if (uploadError) {
        throw new Error(uploadError)
      }

      // Create upload record
      await addUpload({
        name: formData.name,
        description: formData.description || undefined,
        file_type: file.type,
        file_url: url,
        file_size: file.size,
        public: formData.public
      })

      onClose()
      router.refresh() // Refresh the page to update counts
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Basic file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a valid file (JPEG, PNG, GIF, WebP, or PDF)')
        return
      }

      if (selectedFile.size > maxSize) {
        setError('File size must be less than 10MB')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                File Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                placeholder="e.g., Lab Results Jan 2024, Progress Photo"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
                Select File *
              </label>
              <input
                type="file"
                id="file"
                name="file"
                required
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
              />
              {file && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Supported formats: JPEG, PNG, GIF, WebP, PDF. Max size: 10MB
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                placeholder="Add a description or notes about this file..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="public"
                name="public"
                checked={formData.public}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="public" className="ml-2 block text-sm text-gray-900">
                Make this file public on my profile
              </label>
            </div>

            {isLoading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gray-900 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !file}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
