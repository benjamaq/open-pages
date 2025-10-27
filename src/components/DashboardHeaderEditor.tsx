'use client'

import { useState, useRef } from 'react'
import { X, Upload, Trash2, User, Edit2 } from 'lucide-react'

interface DashboardHeaderEditorProps {
  isOpen: boolean
  onClose: () => void
  currentName: string
  currentMission: string
  currentAvatarUrl: string | null
  onUpdate: (updates: {
    name?: string
    mission?: string
    avatarUrl?: string | null
  }) => void
}

export default function DashboardHeaderEditor({
  isOpen,
  onClose,
  currentName,
  currentMission,
  currentAvatarUrl,
  onUpdate
}: DashboardHeaderEditorProps) {
  console.log('🔵 DashboardHeaderEditor LOADED')
  const [name, setName] = useState(currentName)
  const [mission, setMission] = useState(currentMission)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔴 UPLOAD CLICKED', e)
    console.log('🔴 fileInputRef:', fileInputRef.current)
    if (!fileInputRef.current) {
      console.error('❌ REF IS NULL')
      return
    }
    console.log('🔴 About to call .click()')
    try {
      fileInputRef.current.click()
      console.log('🔴 .click() executed successfully')
    } catch (error) {
      console.error('❌ Error calling .click():', error)
    }
  }

  const handleSave = () => {
    onUpdate({
      name: name.trim(),
      mission: mission.trim(),
      avatarUrl
    })
    onClose()
  }

  const handleCancel = () => {
    // Reset to original values
    setName(currentName)
    setMission(currentMission)
    setAvatarUrl(currentAvatarUrl)
    onClose()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ DashboardHeaderEditor FILE SELECTED:', event.target.files?.[0])
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      setIsUploading(false)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP file')
      setIsUploading(false)
      return
    }

    try {
      // Prefer avatar bucket for profile photos
      const [{ uploadAvatarDirect }, { createClient }] = await Promise.all([
        import('../lib/storage-direct'),
        import('../lib/supabase/client')
      ])

      setUploadProgress(30)

      // Get user id for a stable filename
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || 'anon'

      const result = await uploadAvatarDirect(file, userId, (progress) => {
        setUploadProgress(30 + (progress * 0.7))
      })

      if (result.error) {
        alert(`❌ Upload failed: ${result.error}`)
      } else if (result.url) {
        setUploadProgress(100)
        setAvatarUrl(result.url)
        // Persist immediately so closing the modal doesn't lose it
        try { onUpdate({ avatarUrl: result.url }) } catch {}
        alert('✅ Profile photo updated successfully!')
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('❌ Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemovePhoto = () => {
    setAvatarUrl(null)
  }

  if (!isOpen) return null

  const firstName = name.split(' ')[0] || ''
  const lastName = name.split(' ')[1] || ''

  return (
    console.log('🔵 DashboardHeaderEditor RENDER'),
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <p className="text-sm text-gray-600">Update your name, mission, and profile photo</p>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Photo Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Photo
              </label>
              
              <div className="flex items-center gap-6">
                {/* Current Photo */}
                <div className="flex-shrink-0">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile photo"
                      className="w-20 h-20 object-cover rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border border-gray-200 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="header-avatar-upload"
                      onClick={(e) => { console.log('🔴 DashboardHeaderEditor LABEL CLICK'); try { const el = document.getElementById('header-avatar-upload') as HTMLInputElement | null; if (el && (el as any).showPicker) { (el as any).showPicker(); } } catch (err) { console.warn('showPicker not available:', err); } }}
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </label>
                    
                    {avatarUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {isUploading && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, or WEBP up to 5MB
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onClick={() => console.log('🟦 header-avatar-upload input CLICK')}
                onChange={handleImageUpload}
                id="header-avatar-upload"
                style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 as any, opacity: 0.01 }}
              />
            </div>

            {/* Name Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Your display name"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/100 characters • This appears on your profile and public page
              </p>
            </div>

            {/* Mission Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mission Statement
              </label>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                placeholder="What drives your health journey? (e.g., 'Clarity & longevity', 'Optimize performance', 'Feel amazing daily')"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {mission.length}/200 characters • Your health mission or goal
              </p>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg border border-gray-200 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {firstName.charAt(0)}{lastName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {name || 'Your Name'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {mission || 'Your mission statement'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-gray-700 bg-gray-100 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
