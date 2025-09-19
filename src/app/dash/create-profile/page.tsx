'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { generateSlugPreview, generateUniqueSlug } from '../../../lib/slug'
import { uploadAvatar, checkAvatarsBucket, createAvatarsBucket } from '../../../lib/storage'
import { createProfile } from '../../../lib/actions/profile'
import AuthButton from '../../../components/AuthButton'
import Link from 'next/link'

export default function CreateProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    avatar: null as File | null
  })
  const [slugPreview, setSlugPreview] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Generate slug preview when display name changes
  useEffect(() => {
    if (formData.display_name.trim()) {
      const preview = generateSlugPreview(formData.display_name)
      setSlugPreview(preview)
    } else {
      setSlugPreview('')
    }
  }, [formData.display_name])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
        return
      }
      
      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setError('File size must be less than 10MB')
        return
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      setError('') // Clear any previous errors
    } else {
      setAvatarPreview(null)
    }
    
    setFormData(prev => ({
      ...prev,
      avatar: file
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('You must be signed in to create a profile')
      }

      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingProfile) {
        router.push('/dash')
        return
      }

      // Generate unique slug
      let slug = generateUniqueSlug(formData.display_name)
      
      // Check if slug exists and regenerate if needed
      let attempts = 0
      const maxAttempts = 10
      
      while (attempts < maxAttempts) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('slug')
          .eq('slug', slug)
          .single()
        
        if (!existingProfile) {
          break // Slug is available
        }
        
        slug = generateUniqueSlug(formData.display_name)
        attempts++
      }
      
      // If we've exhausted attempts, add timestamp to ensure uniqueness
      if (attempts >= maxAttempts) {
        const { generateSlug } = await import('../../../lib/slug')
        const baseSlug = generateSlug(formData.display_name)
        const timestamp = Date.now().toString().slice(-6)
        slug = `${baseSlug}-${timestamp}`
      }

      // Check if avatars bucket exists, create if not
      const bucketExists = await checkAvatarsBucket()
      if (!bucketExists) {
        console.log('Avatars bucket does not exist, creating...')
        const created = await createAvatarsBucket()
        if (!created) {
          console.warn('Failed to create avatars bucket, continuing without avatar upload')
        }
      }

      // Upload avatar if provided
      let avatarUrl = null
      if (formData.avatar) {
        setIsUploading(true)
        setUploadProgress(0)
        
        try {
          // Check if avatars bucket exists, create if not
          const bucketExists = await checkAvatarsBucket()
          if (!bucketExists) {
            console.log('Avatars bucket does not exist, creating...')
            const created = await createAvatarsBucket()
            if (!created) {
              throw new Error('Failed to create avatars bucket')
            }
          }
          
          const { url, error: uploadError } = await uploadAvatar(
            formData.avatar, 
            user.id,
            (progress) => setUploadProgress(progress)
          )

          if (uploadError) {
            console.error('Avatar upload error:', uploadError)
            setError(`Avatar upload failed: ${uploadError}. Profile will be created without avatar.`)
          } else {
            avatarUrl = url
            setUploadProgress(100)
          }
        } catch (error) {
          console.error('Avatar upload error:', error)
          setError('Avatar upload failed, but profile will be created without avatar')
        } finally {
          setIsUploading(false)
        }
      }

      // Create profile using server action
      await createProfile({
        display_name: formData.display_name,
        bio: formData.bio || undefined,
        slug,
        avatar_url: avatarUrl || undefined
      })

      setSuccess(`Profile created! Your profile will be available at: mystack.co/${slug}`)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dash')
      }, 2000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Navigation */}
      <nav className="border-b border-gray-200" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                <img 
                  src="/BIOSTACKR LOGO 2.png" 
                  alt="Biostackr" 
                  className="h-16 w-auto"
                  style={{ width: '280px' }}
                />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border border-gray-200 p-8" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Your Profile</h1>
            <p className="text-gray-600 mt-2">
              Set up your health profile to start sharing your journey with the community.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                id="display_name"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-gray-900"
                placeholder="Enter your display name"
              />
            </div>

            {/* Slug Preview */}
            {slugPreview && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Your profile will be:</span> mystack.co/{slugPreview}
                </p>
              </div>
            )}

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-gray-900"
                placeholder="Tell us about your health journey..."
              />
            </div>

            {/* Avatar Upload */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                Avatar (Optional)
              </label>
              
              {/* Avatar Preview */}
              {avatarPreview && (
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview(null)
                        setFormData(prev => ({ ...prev, avatar: null }))
                        // Reset file input
                        const fileInput = document.getElementById('avatar') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Upload Area */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="w-8 h-8 mx-auto border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="avatar" className="relative cursor-pointer bg-white rounded-md font-medium text-gray-900 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-900">
                          <span>Upload a file</span>
                          <input
                            id="avatar"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="sr-only"
                            disabled={isUploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">JPEG, PNG, GIF, WebP up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              
              {formData.avatar && !avatarPreview && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {formData.avatar.name} ({(formData.avatar.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/dash"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading || isUploading || !formData.display_name.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : isUploading ? 'Uploading...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
