'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, File, Calendar, User, Tag, Globe, Lock, Star, AlertCircle } from 'lucide-react'
import { createLibraryItem, updateLibraryItem, LibraryItem, LibraryItemFormData } from '../lib/actions/library'

interface LibraryUploadFormProps {
  onClose: () => void
  onSuccess?: (item: LibraryItem) => void
  editItem?: LibraryItem | null
  mode?: 'create' | 'edit'
}

const CATEGORY_OPTIONS = [
  { value: 'lab', label: 'Lab Results', icon: '🧪', description: 'Blood work, urine tests, genetic reports' },
  { value: 'assessment', label: 'Assessment', icon: '📊', description: 'Health assessments, body composition' },
  { value: 'training_plan', label: 'Training Plan', icon: '🏋️', description: 'Workout routines, exercise programs' },
  { value: 'nutrition', label: 'Nutrition', icon: '🥗', description: 'Meal plans, diet protocols' },
  { value: 'wearable_report', label: 'Wearable Data', icon: '⌚', description: 'Fitness tracker exports, sleep data' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧘', description: 'Meditation guides, breathing exercises' },
  { value: 'recovery', label: 'Recovery', icon: '🛌', description: 'Recovery protocols, therapy notes' },
  { value: 'other', label: 'Other', icon: '📄', description: 'Other health-related documents' }
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export default function LibraryUploadForm({ 
  onClose, 
  onSuccess, 
  editItem = null, 
  mode = editItem ? 'edit' : 'create' 
}: LibraryUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<LibraryItemFormData>({
    title: editItem?.title || '',
    category: editItem?.category || 'lab',
    date: editItem?.date || new Date().toISOString().split('T')[0],
    provider: editItem?.provider || '',
    summary_public: editItem?.summary_public || '',
    notes_private: editItem?.notes_private || '',
    tags: editItem?.tags || [],
    file_url: editItem?.file_url || '',
    file_type: editItem?.file_type || '',
    file_size: editItem?.file_size || 0,
    is_public: editItem?.is_public || false,
    allow_download: editItem?.allow_download || false,
    is_featured: editItem?.is_featured || false
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [tagInput, setTagInput] = useState('')

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload PDF, images, CSV, or DOCX files.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 20MB.'
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Auto-fill form based on file
    const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
    
    // Smart category detection
    let detectedCategory = formData.category
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('lab') || lowerName.includes('blood') || lowerName.includes('test')) {
      detectedCategory = 'lab'
    } else if (lowerName.includes('plan') || lowerName.includes('workout') || lowerName.includes('training')) {
      detectedCategory = 'training_plan'
    } else if (lowerName.includes('oura') || lowerName.includes('fitbit') || lowerName.includes('garmin')) {
      detectedCategory = 'wearable_report'
    }

    setFormData(prev => ({
      ...prev,
      title: prev.title || fileName,
      category: detectedCategory,
      file_type: file.type,
      file_size: file.size
    }))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const uploadFile = async (file: File): Promise<string> => {
    // Import the Supabase client
    const { createClient } = await import('../lib/supabase/client')
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }
    
    setUploadProgress(10)
    
    // Check if library bucket exists, but don't be too strict
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.warn('Could not list buckets, proceeding with upload attempt:', bucketsError)
      } else if (buckets) {
        const libraryBucket = buckets.find(bucket => bucket.id === 'library')
        if (!libraryBucket) {
          console.warn('Library bucket not found in bucket list, but attempting upload anyway')
        } else {
          console.log('Library bucket found successfully')
        }
      }
    } catch (error) {
      console.warn('Bucket validation failed, proceeding with upload attempt:', error)
    }
    
    setUploadProgress(20)
    
    // Create file path with user ID and timestamp
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `${user.id}/${fileName}`
    
    setUploadProgress(40)
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('library')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    setUploadProgress(80)
    
    if (error) {
      console.error('Storage upload error:', error)
      if (error.message?.includes('Bucket not found')) {
        throw new Error('Library storage bucket not found. Please run the database setup scripts to enable file uploads.')
      }
      if (error.message?.includes('not allowed')) {
        throw new Error('File type not allowed or file too large. Please check file requirements.')
      }
      if (error.message?.includes('policy')) {
        throw new Error('Upload permission denied. Please check your authentication.')
      }
      throw new Error(`Upload failed: ${error.message}`)
    }
    
    if (!data?.path) {
      throw new Error('Upload completed but no file path returned')
    }
    
    setUploadProgress(100)
    return data.path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      let fileUrl = formData.file_url

      // Upload new file if provided
      if (selectedFile) {
        fileUrl = await uploadFile(selectedFile)
      }

      const submitData: LibraryItemFormData = {
        ...formData,
        file_url: fileUrl,
        title: formData.title.trim(),
        provider: formData.provider?.trim() || undefined,
        summary_public: formData.summary_public?.trim() || undefined,
        notes_private: formData.notes_private?.trim() || undefined
      }

      let result: LibraryItem
      if (mode === 'edit' && editItem) {
        result = await updateLibraryItem(editItem.id, submitData)
      } else {
        result = await createLibraryItem(submitData)
      }

      onSuccess?.(result)
      onClose()
    } catch (err) {
      console.error('Failed to save library item:', err)
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const selectedCategory = CATEGORY_OPTIONS.find(cat => cat.value === formData.category)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Record' : 'Records and Plans'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'edit' ? 'Update your library item' : 'Upload and organize your health documents'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* File Upload (only for create mode or if editing without existing file) */}
            {(mode === 'create' || !editItem?.file_url) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <File className="w-12 h-12 text-green-600 mx-auto" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          PDF, images, CSV, or DOCX up to 20MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORY_OPTIONS.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value as any }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.category === category.value
                        ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-gray-900">{category.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Give your document a descriptive title"
              />
            </div>

            {/* Date and Provider */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Provider
                </label>
                <input
                  type="text"
                  value={formData.provider || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Lab, doctor, app name..."
                />
              </div>
            </div>

            {/* Public Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Summary
              </label>
              <textarea
                value={formData.summary_public || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, summary_public: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Brief description visible on your public profile (1-2 lines)"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.summary_public || '').length}/200 characters
              </p>
            </div>

            {/* Private Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Private Notes
              </label>
              <textarea
                value={formData.notes_private || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes_private: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Personal notes only you can see"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.notes_private || '').length}/500 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Add tags (press Enter)"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Privacy Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Make Public</span>
                      <p className="text-xs text-gray-500">Show on your public profile</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: !prev.is_public }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_public ? 'bg-gray-900' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_public ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.is_public && (
                  <div className="flex items-center justify-between ml-6">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Allow Downloads</span>
                      <p className="text-xs text-gray-500">Let visitors download this file</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, allow_download: !prev.allow_download }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.allow_download ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.allow_download ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}

                {formData.category === 'training_plan' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Feature as Current Plan</span>
                        <p className="text-xs text-gray-500">Show "Current Plan" badge</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.is_featured ? 'bg-gray-900' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    {(error.includes('Library storage not set up') || error.includes('bucket not found')) && (
                      <div className="mt-3">
                        <p className="text-xs text-red-600 mb-2">
                          To enable file uploads, run these SQL scripts in your Supabase SQL Editor:
                        </p>
                        <div className="space-y-1">
                          <code className="block text-xs bg-red-100 px-2 py-1 rounded">
                            1. database/library-schema.sql
                          </code>
                          <code className="block text-xs bg-red-100 px-2 py-1 rounded">
                            2. database/library-storage-setup.sql
                          </code>
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                          See LIBRARY_SETUP_GUIDE.md for detailed instructions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {mode === 'edit' ? 'Updating...' : 'Uploading...'}
                  </span>
                  <span className="text-gray-500">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || (!selectedFile && mode === 'create') || !formData.title.trim()}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading 
                ? (mode === 'edit' ? 'Updating...' : 'Uploading...') 
                : (mode === 'edit' ? 'Update' : 'Add')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
