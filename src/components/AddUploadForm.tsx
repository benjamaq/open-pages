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
      console.log('Starting file upload to storage...')
      // Upload file to storage
      const { url, error: uploadError } = await uploadFile(
        file,
        (progress) => {
          console.log('Upload progress:', progress + '%')
          setUploadProgress(progress)
        }
      )

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(uploadError)
      }
      
      console.log('File uploaded successfully, URL:', url)

      // Create upload record
      await addUpload({
        name: formData.name,
        description: formData.description || undefined,
        file_type: file.type,
        file_url: url!,
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
    console.log('File input change triggered for Files and Labs')
    const selectedFile = e.target.files?.[0]
    console.log('Selected file:', selectedFile?.name, selectedFile?.size, selectedFile?.type)
    
    if (selectedFile) {
      // Basic file validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(selectedFile.type)) {
        console.error('Invalid file type:', selectedFile.type)
        setError('Please upload a valid file (JPEG, PNG, GIF, WebP, or PDF)')
        return
      }

      if (selectedFile.size > maxSize) {
        console.error('File too large:', selectedFile.size)
        setError('File size must be less than 10MB')
        return
      }

      console.log('File validation passed')
      setFile(selectedFile)
      setError(null)
    } else {
      console.log('No file selected')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Upload File</h2>
                <p className="text-sm text-gray-500">Add a new file to your collection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
                File Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                placeholder="Enter a descriptive name for your file"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Select File *
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-xl hover:border-gray-300 transition-colors">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  {file ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, WebP, PDF up to 10MB
                    </p>
                  )}
                </div>
              </div>
              
              {/* Browser compatibility notice */}
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-xs text-yellow-800">
                  ⚠️ <strong>Chrome users:</strong> If file picker doesn't open, try Safari or use HTTPS. 
                  Chrome blocks file uploads on HTTP localhost for security.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                placeholder="Add details about this file..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Visibility
              </label>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="public"
                  name="public"
                  checked={formData.public}
                  onChange={handleChange}
                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label htmlFor="public" className="block text-sm font-medium text-gray-900">
                    Make this file visible on my public profile
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Others will be able to see this file when they visit your profile
                  </p>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">Uploading... {uploadProgress}%</p>
              </div>
            )}

            {/* Test button for debugging */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  console.log('Test file upload clicked')
                  const testFile = new File(['test document content'], 'test-document.pdf', { type: 'application/pdf' })
                  
                  setFile(testFile)
                  setError(null)
                  
                  // Simulate form submission with test file
                  setIsLoading(true)
                  try {
                    console.log('Testing upload with mock PDF file')
                    const { url, error: uploadError } = await uploadFile(
                      testFile,
                      (progress) => setUploadProgress(progress)
                    )
                    
                    if (uploadError) {
                      throw new Error(uploadError)
                    }
                    
                    console.log('Test upload successful:', url)
                    alert('Test upload successful! URL: ' + url)
                  } catch (err) {
                    console.error('Test upload failed:', err)
                    alert('Test upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                  } finally {
                    setIsLoading(false)
                    setUploadProgress(0)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                🧪 Test Upload (Mock PDF)
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 p-6 pt-4">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="upload-form"
              disabled={isLoading || !file}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async (e) => {
                e.preventDefault()
                const form = document.getElementById('upload-form') as HTMLFormElement
                if (form) {
                  const formEvent = new Event('submit', { bubbles: true, cancelable: true })
                  form.dispatchEvent(formEvent)
                }
              }}
            >
              {isLoading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
