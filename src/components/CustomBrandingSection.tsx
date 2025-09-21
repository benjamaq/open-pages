'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { uploadCustomLogo, deleteCustomLogo, updateCustomBranding } from '../lib/actions/custom-branding'

interface CustomBrandingSectionProps {
  userTier: 'free' | 'pro' | 'creator'
  isOwner: boolean
  initialBranding?: {
    custom_logo_url?: string
    custom_branding_enabled: boolean
  }
}

export default function CustomBrandingSection({ 
  userTier, 
  isOwner, 
  initialBranding = { custom_branding_enabled: false }
}: CustomBrandingSectionProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [branding, setBranding] = useState(initialBranding)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Don't show for non-creator tiers or if user is not owner
  if (userTier !== 'creator' || !isOwner) {
    return null
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const logoUrl = await uploadCustomLogo(file)
      setBranding({
        custom_logo_url: logoUrl,
        custom_branding_enabled: true
      })
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete your custom logo?')) return

    setLoading(true)
    try {
      await deleteCustomLogo()
      setBranding({
        custom_logo_url: undefined,
        custom_branding_enabled: false
      })
    } catch (error) {
      console.error('Error deleting logo:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete logo')
    } finally {
      setLoading(false)
    }
  }

  const toggleBranding = async (enabled: boolean) => {
    setLoading(true)
    try {
      await updateCustomBranding({
        custom_branding_enabled: enabled
      })
      setBranding(prev => ({ ...prev, custom_branding_enabled: enabled }))
    } catch (error) {
      console.error('Error updating branding:', error)
      alert(error instanceof Error ? error.message : 'Failed to update branding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎨</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Custom Branding</h3>
            <p className="text-sm text-gray-600">Upload your own logo for your public profile</p>
          </div>
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-6">
          {/* Current Logo Display */}
          {branding.custom_logo_url && (
            <div className="border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Current Logo</h4>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={branding.custom_logo_url}
                    alt="Custom logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Your custom logo will appear on your public profile</p>
                  <div className="flex gap-2">
                    <a
                      href={branding.custom_logo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                    <button
                      onClick={handleDeleteLogo}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Upload New Logo</h4>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your logo here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG, or SVG up to 5MB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Choose File'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Branding Toggle */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Enable Custom Branding</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Show your custom logo instead of BioStackr branding on your public profile
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.custom_branding_enabled}
                  onChange={(e) => toggleBranding(e.target.checked)}
                  disabled={loading || !branding.custom_logo_url}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            {!branding.custom_logo_url && (
              <p className="text-xs text-amber-600 mt-2">
                Upload a logo first to enable custom branding
              </p>
            )}
          </div>

          {/* Preview */}
          {branding.custom_logo_url && branding.custom_branding_enabled && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Preview</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <img
                    src={branding.custom_logo_url}
                    alt="Custom logo preview"
                    className="h-8 w-auto"
                  />
                  <span className="text-sm text-gray-600">Your Public Profile</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
