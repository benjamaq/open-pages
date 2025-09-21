'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit3, Trash2, X, ExternalLink, Edit2, Check, X as Cancel, Share, Paintbrush, Upload, Image as ImageIcon, Settings, Trash, Crop, ChevronDown, ChevronUp } from 'lucide-react'
import DailyCheckinModal from '../../components/DailyCheckinModal'
import EditableName from '../../components/EditableName'
import EditableMission from '../../components/EditableMission'
import AddStackItemForm from '../../components/AddStackItemForm'
import GearCard from '../../components/GearCard'
import AddGearForm from '../../components/AddGearForm'
import LibrarySection from '../../components/LibrarySection'
import ShopMyGearSection from '../../components/ShopMyGearSection'
import TierManagement from '../../components/TierManagement'
import TrialNotification from '../../components/TrialNotification'
import TrialStatusBadge from '../../components/TrialStatusBadge'
import LimitChecker from '../../components/LimitChecker'
import DashboardHeaderEditor from '../../components/DashboardHeaderEditor'

interface Profile {
  id: string
  slug: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  tier?: 'free' | 'pro' | 'creator'
  custom_logo_url?: string
  custom_branding_enabled?: boolean
}

interface Counts {
  stackItems: number
  protocols: number
  uploads: number
}

interface DashboardClientProps {
  profile: Profile
  counts: Counts
  todayItems: {
    supplements: any[]
    mindfulness: any[]
    movement: any[]
    protocols: any[]
    food: any[]
    gear: any[]
  }
  userId: string
}

interface HeaderPrefs {
  bg_type: 'upload' | 'preset' | 'none'
  bg_ref: string
  overlay: number
  overlay_mode: 'auto' | 'dark' | 'light'
  blur: number
  grain: boolean
  focal: { x: number, y: number }
  crop: { w: number, h: number, x: number, y: number, ratio: string }
  show_hero_avatar: boolean
}

const BatteryVisual = ({ level }: { level: number }) => {
  const batteryPercentage = level * 10
  const batteryWidth = 320 // Much larger as specified
  const batteryHeight = 48
  const bodyWidth = 300
  const fillWidth = Math.max(0, Math.min(bodyWidth - 4, Math.round((bodyWidth - 4) * (batteryPercentage / 100))))
  
  const getBatteryColor = (level: number) => {
    if (level <= 3) return '#919191' // Gray
    if (level <= 6) return '#9AD15A' // Soft lime
    if (level <= 8) return '#2FAE58' // Rich green  
    return '#22A447' // Deep green
  }

  const batteryColor = getBatteryColor(level)

  return (
    <div className="flex justify-center mb-6">
      <svg width={batteryWidth} height={batteryHeight} viewBox={`0 0 ${batteryWidth} ${batteryHeight}`} className="battery-svg">
        <defs>
          {/* Battery gradient fill */}
          <linearGradient id={`batteryFill-${level}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={batteryColor} />
            <stop offset="50%" stopColor={batteryColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={batteryColor} stopOpacity="0.8" />
          </linearGradient>
          
          {/* Fine grain pattern */}
          <pattern id="batteryGrain" patternUnits="userSpaceOnUse" width="2" height="2">
            <rect width="2" height="2" fill={batteryColor} />
            <circle cx="0.5" cy="0.5" r="0.2" fill="rgba(255,255,255,0.3)" />
            <circle cx="1.5" cy="1.5" r="0.15" fill="rgba(255,255,255,0.2)" />
          </pattern>
          
          {/* Gloss highlight */}
          <linearGradient id="batteryGloss" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        
        {/* Battery Body Background */}
        <rect 
          x="2" 
          y="8" 
          width={bodyWidth} 
          height="32" 
          rx="10" 
          ry="10" 
          fill="#F3F4F6"
          stroke="#D1D5DB" 
          strokeWidth="1"
        />
        
        {/* Battery Cap */}
        <rect 
          x={bodyWidth + 2} 
          y="16" 
          width="10" 
          height="16" 
          rx="5" 
          ry="5" 
          fill="#D1D5DB"
        />
        
        {/* Battery Fill */}
        <rect 
          x="4" 
          y="10" 
          width={fillWidth}
          height="28" 
          rx="8" 
          ry="8" 
          fill={`url(#batteryFill-${level})`}
          className="transition-all duration-300 ease-out"
        />
        
        {/* Grain Texture Overlay */}
        <rect 
          x="4" 
          y="10" 
          width={fillWidth}
          height="28" 
          rx="8" 
          ry="8" 
          fill="url(#batteryGrain)"
          opacity="0.4"
        />
        
        {/* Gloss Highlight */}
        <rect 
          x="4" 
          y="10" 
          width={fillWidth}
          height="28" 
          rx="8" 
          ry="8" 
          fill="url(#batteryGloss)"
        />
      </svg>
    </div>
  )
}

const HeaderCustomizer = ({ 
  isOpen, 
  onClose, 
  headerPrefs, 
  onUpdate,
  userId,
  displayName,
  setDisplayName,
  showDisplayName,
  setShowDisplayName
}: {
  isOpen: boolean
  onClose: () => void
  headerPrefs: HeaderPrefs
  onUpdate: (prefs: Partial<HeaderPrefs>) => void
  userId: string
  displayName: string
  setDisplayName: (name: string) => void
  showDisplayName: boolean
  setShowDisplayName: (show: boolean) => void
}) => {
  const [activeTab, setActiveTab] = useState('background')
  const [tempPrefs, setTempPrefs] = useState(headerPrefs)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const presetTextures = [
    { id: 'granite', name: 'Digital Granite', url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><pattern id='granite' patternUnits='userSpaceOnUse' width='20' height='20'><rect width='20' height='20' fill='%23f8f9fa'/><circle cx='5' cy='5' r='0.5' fill='%23e9ecef'/><circle cx='15' cy='15' r='0.3' fill='%23dee2e6'/></pattern></defs><rect width='100%' height='100%' fill='url(%23granite)'/></svg>" },
    { id: 'grid', name: 'Tech Grid', url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><pattern id='grid' patternUnits='userSpaceOnUse' width='40' height='40'><path d='M 40 0 L 0 0 0 40' fill='none' stroke='%23e5e7eb' stroke-width='1'/></pattern></defs><rect width='100%' height='100%' fill='%23f9fafb'/><rect width='100%' height='100%' fill='url(%23grid)'/></svg>" },
    { id: 'wave', name: 'Wave Pattern', url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f8f9fa'/><path d='M0,150 Q100,100 200,150 T400,150 L400,300 L0,300 Z' fill='%23f1f3f4' opacity='0.5'/><path d='M0,180 Q100,130 200,180 T400,180 L400,300 L0,300 Z' fill='%23e8eaed' opacity='0.3'/></svg>" },
    { id: 'circuit', name: 'Circuit Board', url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23f8f9fa'/><circle cx='100' cy='80' r='20' fill='none' stroke='%23e5e7eb' stroke-width='2'/><circle cx='300' cy='220' r='30' fill='none' stroke='%23e5e7eb' stroke-width='2'/><path d='M50,150 L350,150' stroke='%23e5e7eb' stroke-width='2'/><path d='M200,50 L200,250' stroke='%23e5e7eb' stroke-width='2'/></svg>" },
  ]

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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
        // Import the direct upload function for debugging
        const { uploadFileDirect } = await import('../../lib/storage-direct')
        
        setUploadProgress(30)
        
        // Upload to storage (direct method)
        const result = await uploadFileDirect(file, (progress) => {
          setUploadProgress(30 + (progress * 0.7))
        })
        
        if (result.error) {
          alert(`❌ Upload failed: ${result.error}`)
        } else if (result.url) {
          setUploadProgress(100)
          // Update header preferences with permanent URL
          onUpdate({
            bg_type: 'upload',
            bg_ref: result.url
          })
          alert('✅ Background image updated successfully!')
          console.log('Background image uploaded successfully:', result.url)
        }
      } catch (error) {
        console.error('Background upload error:', error)
        alert('❌ Upload failed. Please try again.')
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }

  const applyPreset = (preset: typeof presetTextures[0]) => {
    setTempPrefs(prev => ({
      ...prev,
      bg_type: 'preset',
      bg_ref: preset.url
    }))
    onUpdate({
      bg_type: 'preset',
      bg_ref: preset.url
    })
  }

  const removeImage = () => {
    setTempPrefs(prev => ({
      ...prev,
      bg_type: 'none',
      bg_ref: ''
    }))
    onUpdate({
      bg_type: 'none',
      bg_ref: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Customize Header</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs - Reorganized */}
        <div className="border-b border-gray-100">
          <nav className="flex">
            {[
              { id: 'background', label: 'Background', icon: ImageIcon },
              { id: 'identity', label: 'Identity', icon: Edit2 },
              { id: 'style', label: 'Style', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'background' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Image</h3>
                <p className="text-gray-600 mb-4">JPG, PNG, or WEBP up to 5MB, min 1600×900</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                {isUploading && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                
                <label
                  htmlFor="image-upload"
                  className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    isUploading 
                      ? 'bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                </label>
              </div>

              {headerPrefs.bg_type === 'upload' && (
                <div className="flex justify-center">
                  <button
                    onClick={removeImage}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                    <span>Remove Image</span>
                  </button>
            </div>
          )}

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Choose a Preset</h3>
              <div className="grid grid-cols-2 gap-4">
                {presetTextures.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                      headerPrefs.bg_ref === preset.url
                        ? 'border-gray-900 ring-2 ring-gray-900 ring-opacity-20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url('${preset.url}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{preset.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

              <div className="border-t border-gray-200 pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Overlay Strength: {tempPrefs.overlay}%
                </label>
                <input
                  type="range"
                  min="0"
                    max="40"
                  value={tempPrefs.overlay}
                  onChange={(e) => {
                    const newOverlay = Number(e.target.value)
                    setTempPrefs(prev => ({ ...prev, overlay: newOverlay }))
                    onUpdate({ overlay: newOverlay })
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              </div>
            </div>
          )}


          {activeTab === 'style' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Status Row Style</label>
                <div className="flex space-x-3">
                  {[
                    { id: 'compact', label: 'Compact' },
                    { id: 'standard', label: 'Standard' }
                  ].map((option) => (
                    <button
                      key={option.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        option.id === 'compact'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Show Streak Chips</label>
                <button
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-900 transition-colors"
                >
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Digital Granite Theme</h4>
                <p className="text-xs text-gray-600">Clean, monochrome design with functional beauty</p>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Display Name</label>
                <input
                  type="text"
                  placeholder="Your display name"
                  maxLength={140}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">{displayName.length}/140 characters</p>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Show name on header</label>
                <button
                  onClick={() => setShowDisplayName(!showDisplayName)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showDisplayName ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                  aria-label="Show name on header"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showDisplayName ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <p className="text-xs text-gray-600">Changes will update the header in real-time</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Digital Granite Card Design System
const DashboardCard = ({ children, title, onManage, collapsed = false, onToggleCollapse, secondary = false }: {
  children: React.ReactNode
  title: string
  onManage?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  secondary?: boolean
}) => (
  <div 
    className={`bg-white border transition-all duration-200 ${
      secondary 
        ? 'border-gray-100 shadow-sm' 
        : 'border-gray-200 shadow-sm hover:shadow-md'
    }`} 
    style={{ 
      borderRadius: '16px',
      boxShadow: secondary ? '0 1px 3px rgba(0,0,0,0.05)' : '0 1px 4px rgba(0,0,0,0.06)'
    }}
  >
    <div className="flex items-center justify-between p-6 pb-4">
      <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>{title}</h2>
      <div className="flex items-center space-x-2">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        )}
        {onManage && (
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage items"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
        )}
      </div>
    </div>
    {!collapsed && (
      <div className="px-6 pb-6">
        {children}
      </div>
    )}
  </div>
)

// Row 0 — Today's Check-in Card (Compact)
const CheckinCard = ({ 
  energyLevel, 
  setEnergyLevel, 
  mission, 
  isEditingMission,
  tempMission,
  setTempMission,
  handleEditMission,
  handleSaveMission,
  handleCancelMission,
  handleShareCheckIn,
  completionPercentage
}: {
  energyLevel: number
  setEnergyLevel: (level: number) => void
  mission: string
  isEditingMission: boolean
  tempMission: string
  setTempMission: (mission: string) => void
  handleEditMission: () => void
  handleSaveMission: () => void
  handleCancelMission: () => void
  handleShareCheckIn: () => void
  completionPercentage: number
}) => {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: showDetails ? '260px' : '160px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Today's Check-in</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm font-medium hover:text-gray-700 transition-colors"
          style={{ color: '#5C6370' }}
        >
          Details {showDetails ? '▴' : '▾'}
        </button>
      </div>

      {/* Compact Row - Single Line Centered */}
      <div className="px-6 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          
          {/* Mission - Inline Editable */}
          <div className="flex items-center">
            {isEditingMission ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempMission}
                  onChange={(e) => setTempMission(e.target.value)}
                  placeholder="Set your daily mission…"
                  maxLength={80}
                  className="text-lg font-bold bg-transparent border-b-2 border-gray-300 focus:border-gray-900 focus:outline-none placeholder-gray-500 pb-1"
                  style={{ color: '#0F1115' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMission()
                    if (e.key === 'Escape') handleCancelMission()
                  }}
                />
                <button onClick={handleSaveMission} className="p-1 text-green-600 hover:text-green-700">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={handleCancelMission} className="p-1 text-gray-500 hover:text-gray-700">
                  <Cancel className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditMission}
                className="text-lg font-bold hover:text-gray-700 transition-colors"
                style={{ color: '#0F1115' }}
              >
                {mission || "Set your daily mission…"}
              </button>
            )}
          </div>

          {/* Battery Pill - Compact */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
            <span>🔋</span>
            <span className="text-sm font-medium" style={{ color: '#0F1115' }}>
              {energyLevel}/10
            </span>
            <span className="text-sm" style={{ color: '#5C6370' }}>
              {energyLevel <= 2 ? "Empty" :
               energyLevel <= 4 ? "Low" :
               energyLevel <= 6 ? "Stable" :
               energyLevel <= 8 ? "Charged" :
               "Full"}
            </span>
          </div>

          {/* Optional Chips */}
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium" style={{ color: '#5C6370' }}>
            🔥 0-day streak
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium" style={{ color: '#5C6370' }}>
            ✅ {completionPercentage}% complete
          </div>

          {/* Share Button */}
          <button
            onClick={handleShareCheckIn}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Share Check-in
          </button>
        </div>

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-4">
              {/* Apple-Style Battery Bar */}
              <div className="flex justify-center">
                <div className="relative">
                  <div 
                    className="bg-gray-200 rounded-full relative overflow-hidden shadow-inner border border-gray-300"
                    style={{ width: '280px', height: '40px' }}
                  >
                    <div 
                      className="h-full rounded-full transition-all ease-out relative"
                      style={{
                        width: `${energyLevel * 10}%`,
                        background: energyLevel <= 3 ? 'linear-gradient(180deg, #A6AFBD 0%, #5C6370 100%)' :
                                  energyLevel <= 6 ? 'linear-gradient(180deg, #9AD15A 0%, #6BB95E 100%)' :
                                  'linear-gradient(180deg, #2FAE58 0%, #22A447 100%)',
                        transitionDuration: '250ms'
                      }}
                    >
                      {/* Fine Grain Texture */}
                      <div 
                        className="absolute inset-0 rounded-full opacity-30"
                        style={{
                          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
                          backgroundSize: '3px 3px'
                        }}
                      />
                      {/* Subtle Gloss */}
                      <div 
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)'
                        }}
                      />
                    </div>
                  </div>
                  {/* Battery Cap */}
                  <div 
                    className="absolute bg-gray-400 rounded-r-md border border-gray-500"
                    style={{ 
                      right: '-6px', 
                      top: '12px', 
                      width: '8px', 
                      height: '16px' 
                    }}
                  />
                </div>
              </div>

              {/* Feedback Text */}
              <p className="text-center italic font-medium" style={{ fontSize: '14px', color: '#5C6370' }}>
                {energyLevel <= 2 ? "Running on empty. Be gentle today." :
                 energyLevel <= 4 ? "Low power. Focus on essentials." :
                 energyLevel <= 6 ? "Stable. Stay consistent." :
                 energyLevel <= 8 ? "Charged. You've got momentum." :
                 "Full power. Unstoppable."}
              </p>

              {/* Slider */}
              <div className="px-8">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #A6AFBD 0%, #9AD15A 50%, #22A447 100%)',
                    outline: 'none'
                  }}
                  aria-label="Energy level 1 to 10"
                  aria-valuenow={energyLevel}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: '#A6AFBD' }}>
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Row 1 — Supplements Card (Full Width)
const SupplementsCard = ({ items, onToggleComplete, completedItems, onManage }: {
  items: any[]
  onToggleComplete: (id: string, type: string) => void
  completedItems: Set<string>
  onManage: () => void
}) => {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['morning']))
  // Use all items directly (no category filtering)
  const categoryFilteredItems = items

  // Group supplements by time of day
  const groupedSupplements = {
    morning: categoryFilteredItems.filter(item => item.time_preference === 'morning'),
    midday: categoryFilteredItems.filter(item => item.time_preference === 'midday'),
    evening: categoryFilteredItems.filter(item => item.time_preference === 'evening'),
    anytime: categoryFilteredItems.filter(item => item.time_preference === 'afternoon' || item.time_preference === 'anytime' || !item.time_preference)
  }

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  const renderSupplementGroup = (groupName: string, supplements: any[], icon: string) => {
    if (supplements.length === 0) return null
    
    const isExpanded = expandedGroups.has(groupName)
    const displayItems = isExpanded ? supplements : supplements.slice(0, 5)
    const hasMore = supplements.length > 5

    return (
      <div key={groupName} className="mb-6 last:mb-0">
        <button
          onClick={() => toggleGroup(groupName)}
          className="flex items-center justify-between w-full text-left mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <h4 className="font-medium text-gray-900 flex items-center space-x-2">
            <span>{icon}</span>
            <span className="capitalize">{groupName}</span>
            <span className="text-sm text-gray-500">({supplements.length})</span>
          </h4>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${!isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isExpanded && (
          <div className="space-y-2 ml-4">
            {displayItems.map((item) => {
              const itemKey = `supplement-${item.id}`
              const isCompleted = completedItems.has(itemKey)
              
              return (
                <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <button
                    onClick={() => onToggleComplete(item.id, 'supplement')}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gray-900 border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.name}
                        {item.dose && (
                          <span className="text-gray-500 ml-1">({item.dose})</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {hasMore && !isExpanded && (
              <button
                onClick={() => toggleGroup(groupName)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors ml-2"
              >
                +{supplements.length - 5} more
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: collapsed ? '80px' : '560px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Today's Supplements</h2>
        <div className="flex items-center space-x-2">
          {categoryFilteredItems.length > 0 && (
            <button
              onClick={() => {
                const allSupplementIds = categoryFilteredItems.map(item => `supplement-${item.id}`)
                const allCompleted = allSupplementIds.every(id => completedItems.has(id))
                
                if (allCompleted) {
                  // Uncheck all
                  allSupplementIds.forEach(id => onToggleComplete(id.replace('supplement-', ''), 'supplement'))
                } else {
                  // Check all
                  allSupplementIds.forEach(id => {
                    if (!completedItems.has(id)) {
                      onToggleComplete(id.replace('supplement-', ''), 'supplement')
                    }
                  })
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
              aria-label="Check all supplements"
            >
              <span className="text-xs">
                {categoryFilteredItems.every(item => completedItems.has(`supplement-${item.id}`)) ? '↶' : '✓'}
              </span>
              <span>{categoryFilteredItems.every(item => completedItems.has(`supplement-${item.id}`)) ? 'Uncheck All' : 'Check All'}</span>
            </button>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage supplements"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>
      </div>


      {!collapsed && (
        <div className="px-6 pb-6">
          {categoryFilteredItems.length > 0 ? (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Morning Column */}
                <div className="space-y-2">
                  <h4 className="sticky top-0 bg-white z-10 font-medium text-gray-900 flex items-center space-x-2 mb-3 py-2 -mt-2">
                    <span>🌅</span>
                    <span>Morning</span>
                    <span className="text-sm text-gray-500">({groupedSupplements.morning.length})</span>
                  </h4>
                  <div className="space-y-2">
                  {groupedSupplements.morning.map((item) => {
                    const itemKey = `supplement-${item.id}`
                    const isCompleted = completedItems.has(itemKey)
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                        <button
                          onClick={() => onToggleComplete(item.id, 'supplement')}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isCompleted
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          <div className="text-sm font-medium">
                            {item.name}
                            {item.dose && (
                              <div className="text-xs text-gray-500">{item.dose}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {groupedSupplements.morning.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No morning supplements</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Midday Column */}
                <div className="space-y-2">
                  <h4 className="sticky top-0 bg-white z-10 font-medium text-gray-900 flex items-center space-x-2 mb-3 py-2 -mt-2">
                    <span>☀️</span>
                    <span>Midday</span>
                    <span className="text-sm text-gray-500">({groupedSupplements.midday.length})</span>
                  </h4>
                  <div className="space-y-2">
                  {groupedSupplements.midday.map((item) => {
                    const itemKey = `supplement-${item.id}`
                    const isCompleted = completedItems.has(itemKey)
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                        <button
                          onClick={() => onToggleComplete(item.id, 'supplement')}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isCompleted
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          <div className="text-sm font-medium">
                            {item.name}
                            {item.dose && (
                              <div className="text-xs text-gray-500">{item.dose}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {groupedSupplements.midday.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No midday supplements</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Evening Column */}
                <div className="space-y-2">
                  <h4 className="sticky top-0 bg-white z-10 font-medium text-gray-900 flex items-center space-x-2 mb-3 py-2 -mt-2">
                    <span>🌙</span>
                    <span>Evening</span>
                    <span className="text-sm text-gray-500">({groupedSupplements.evening.length})</span>
                  </h4>
                  <div className="space-y-2">
                  {groupedSupplements.evening.map((item) => {
                    const itemKey = `supplement-${item.id}`
                    const isCompleted = completedItems.has(itemKey)
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                        <button
                          onClick={() => onToggleComplete(item.id, 'supplement')}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isCompleted
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          <div className="text-sm font-medium">
                            {item.name}
                            {item.dose && (
                              <div className="text-xs text-gray-500">{item.dose}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {groupedSupplements.evening.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No evening supplements</p>
                    </div>
                  )}
                  </div>
                </div>

                {/* Anytime Column */}
                <div className="space-y-2">
                  <h4 className="sticky top-0 bg-white z-10 font-medium text-gray-900 flex items-center space-x-2 mb-3 py-2 -mt-2">
                    <span>🕐</span>
                    <span>Anytime</span>
                    <span className="text-sm text-gray-500">({groupedSupplements.anytime.length})</span>
                  </h4>
                  <div className="space-y-2">
                  {groupedSupplements.anytime.map((item) => {
                    const itemKey = `supplement-${item.id}`
                    const isCompleted = completedItems.has(itemKey)
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                        <button
                          onClick={() => onToggleComplete(item.id, 'supplement')}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isCompleted
                              ? 'bg-gray-900 border-gray-900'
                              : 'border-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {isCompleted && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          <div className="text-sm font-medium">
                            {item.name}
                            {item.dose && (
                              <div className="text-xs text-gray-500">{item.dose}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {groupedSupplements.anytime.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No anytime supplements</p>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onManage}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Supplement
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Vitamins, minerals, nootropics—organize by timing and dosage.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Protocols Card
const ProtocolsCard = ({ items, onToggleComplete, completedItems, onManage }: {
  items: any[]
  onToggleComplete: (id: string, type: string) => void
  completedItems: Set<string>
  onManage: () => void
}) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: collapsed ? '80px' : '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>
          Today's<br />
          Protocols
        </h2>
        <div className="flex items-center space-x-2">
          {items.length > 0 && (
            <button
              onClick={() => {
                const allProtocolIds = items.map(item => `protocol-${item.id}`)
                const allCompleted = allProtocolIds.every(id => completedItems.has(id))
                
                if (allCompleted) {
                  // Uncheck all
                  allProtocolIds.forEach(id => onToggleComplete(id.replace('protocol-', ''), 'protocol'))
                } else {
                  // Check all
                  allProtocolIds.forEach(id => {
                    if (!completedItems.has(id)) {
                      onToggleComplete(id.replace('protocol-', ''), 'protocol')
                    }
                  })
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
              aria-label="Check all protocols"
            >
              <span className="text-xs">
                {items.every(item => completedItems.has(`protocol-${item.id}`)) ? '↶' : '✓'}
              </span>
              <span>{items.every(item => completedItems.has(`protocol-${item.id}`)) ? 'Uncheck All' : 'Check All'}</span>
            </button>
          )}
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage protocols"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 max-h-72 overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => {
                const itemKey = `protocol-${item.id}`
                const isCompleted = completedItems.has(itemKey)
                
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <button
                      onClick={() => onToggleComplete(item.id, 'protocol')}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted
                          ? 'bg-gray-900 border-gray-900 scale-110'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    
                    <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      <span className="text-base font-medium">{item.name}</span>
                      {item.notes && (
                        <p className="text-sm mt-1" style={{ color: '#5C6370' }}>{item.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onManage}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Protocol
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Sauna, cold, red light, sleep routine—anything you do regularly.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Movement Card
const MovementCard = ({ items = [], onManage }: { items?: any[]; onManage: () => void }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: collapsed ? '80px' : '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>
          Today's<br />
          Movement
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage movement"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 max-h-72 overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <button
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 border-gray-300 hover:border-gray-500"
                  >
                  </button>
                  <div className="flex-1">
                    <span className="text-base font-medium text-gray-900">{item.name}</span>
                    {item.dose && <div className="text-sm text-gray-500">{item.dose}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onManage}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Movement
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Gym, run, walk, yoga, surfing—whatever keeps you moving.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Mindfulness Card
const MindfulnessCard = ({ items = [], onManage }: { items?: any[]; onManage: () => void }) => {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        maxHeight: collapsed ? '80px' : '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>
          Today's<br />
          Mindfulness
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage mindfulness"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6 max-h-72 overflow-y-auto">
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <button
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 border-gray-300 hover:border-gray-500"
                  >
                  </button>
                  <div className="flex-1">
                    <span className="text-base font-medium text-gray-900">{item.name}</span>
                    {item.dose && <div className="text-sm text-gray-500">{item.dose}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onManage}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Mindfulness
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Meditation, breathwork, journaling—keep habits simple for consistency.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 3 — Food Card (Full Width)
const FoodCard = ({ onManage, onQuickAdd, foodItems = [] }: { onManage: () => void, onQuickAdd: () => void, foodItems?: any[] }) => {
  const [collapsed, setCollapsed] = useState(false)

  const mealSections = [
    {
      name: 'Morning',
      time: 'AM',
      items: foodItems.filter(item => item.time_preference === 'morning')
    },
    {
      name: 'Midday', 
      time: 'Midday',
      items: foodItems.filter(item => item.time_preference === 'midday')
    },
    {
      name: 'Evening',
      time: 'PM', 
      items: foodItems.filter(item => item.time_preference === 'evening')
    }
  ]

  return (
    <div 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-200"
      style={{ 
        borderRadius: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h2 className="font-bold text-xl" style={{ color: '#0F1115' }}>Today's Food</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
          <button
            onClick={onManage}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage food"
          >
            <Plus className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mealSections.map((section) => (
              <div key={section.name} className="space-y-3">
                <h4 className="font-semibold flex items-center space-x-2" style={{ color: '#0F1115' }}>
                  <span>{section.name}</span>
                  <span className="text-xs" style={{ color: '#A6AFBD' }}>({section.time})</span>
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, index) => (
                    <div key={item.id || index} className="text-sm p-2 rounded-lg bg-gray-50" style={{ color: '#5C6370' }}>
                      <div className="font-medium">{typeof item === 'string' ? item : item.name}</div>
                      {typeof item === 'object' && item.dose && (
                        <div className="text-xs text-gray-400 mt-1">{item.dose}</div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={onQuickAdd}
                    className="w-full text-center text-sm p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium"
                  >
                    Quick Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


const PillarCard = ({ 
  title, 
  count, 
  maxCount, 
  items, 
  emptyMessage, 
  onToggleComplete, 
  completedItems, 
  type, 
  onManage,
  viewAllLink
}: PillarCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const completedToday = items.filter(item => completedItems.has(`${type}-${item.id}`)).length
  const displayItems = isExpanded ? items : items.slice(0, 5)
  const hasMoreItems = items.length > 5
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      {/* Header Row */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {title} {count > 0 && `(${count} of ${maxCount})`}
          </h3>
        </div>
        <button
          onClick={onManage}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 pb-4">
        {items.length > 0 ? (
          <div className={`space-y-3 ${items.length > 5 && isExpanded ? 'max-h-80 overflow-y-auto' : ''}`}>
            {displayItems.map((item) => {
              const itemKey = `${type}-${item.id}`
              const isCompleted = completedItems.has(itemKey)
              
              return (
                <div key={item.id} className="flex items-center space-x-3">
                  <button
                    onClick={() => onToggleComplete(item.id, type)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gray-900 border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <div className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.name}
                        {item.dose && (
                          <span className="text-gray-500 ml-1">({item.dose})</span>
                        )}
                      </span>
                      {item.time_preference && item.time_preference !== 'anytime' && (
                        <span className="text-xs text-gray-400 capitalize">
                          {item.time_preference}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {hasMoreItems && !isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                +{items.length - 5} more
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm mb-1">{emptyMessage}</p>
            <p className="text-gray-400 text-xs">Add one with +</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm mb-3">
          {items.length > 0 ? (
            <span className="text-gray-900 font-medium">
              Progress: {completedToday} of {items.length} completed today ✅
            </span>
          ) : (
            <span></span>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">·</span>
            <Link 
              href={viewAllLink}
              className="inline-flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
        
        {items.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gray-900 bg-opacity-50 h-2 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${items.length > 0 ? (completedToday / items.length) * 100 : 0}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardClient({ profile, counts, todayItems, userId }: DashboardClientProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  // Load completed items from localStorage on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const storageKey = `completedItems-${userId}-${today}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const savedItems = JSON.parse(saved)
        setCompletedItems(new Set(savedItems))
      } catch (error) {
        console.error('Failed to load completed items:', error)
      }
    }
    
    // Load dashboard data including follower count
    loadDashboardData()
    loadDailyCheckIn()
  }, [userId])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setFollowerCount(data.followers.count || 0)
        
        // Show toast if there are new followers
        if (data.followers.newSinceLastCheck > 0) {
          setNewFollowerCount(data.followers.newSinceLastCheck)
          setShowNewFollowerToast(true)
          setTimeout(() => setShowNewFollowerToast(false), 5000)
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const loadDailyCheckIn = async () => {
    try {
      // Primary: Load from localStorage (user-specific and date-specific)
      const saved = localStorage.getItem(`biostackr_last_daily_checkin_${userId}`)
      if (saved) {
        const data = JSON.parse(saved)
        const today = new Date().toISOString().split('T')[0]
        
        // Only use if it's from today and for this user
        if (data.date === today && data.userId === userId) {
          setDailyCheckIn({
            energy: data.energy,
            mood: data.mood
          })
          setEnergyLevel(data.energy) // Also update the energy level
          return
        }
      }
      
      // Fallback: Try API if localStorage is empty or old
      const response = await fetch('/api/daily-update/today')
      if (response.ok) {
        const data = await response.json()
        if (data.dailyUpdate) {
          setDailyCheckIn({
            energy: data.dailyUpdate.energy_score || 1,
            mood: data.dailyUpdate.mood_label || ''
          })
          setEnergyLevel(data.dailyUpdate.energy_score || 1)
        }
      }
    } catch (error) {
      console.error('Error loading daily check-in:', error)
    }
  }
  
  const handleEnergyUpdate = (newEnergy: number) => {
    setEnergyLevel(newEnergy)
    // Update daily check-in when energy is updated
    setDailyCheckIn(prev => ({
      energy: newEnergy,
      mood: prev?.mood || ''
    }))
  }
  
  const [energyLevel, setEnergyLevel] = useState(1)
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [mission, setMission] = useState('')
  const [isEditingMission, setIsEditingMission] = useState(false)
  const [tempMission, setTempMission] = useState('')
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showBatteryModal, setShowBatteryModal] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [showQuickAddFood, setShowQuickAddFood] = useState(false)
  const [showAddGear, setShowAddGear] = useState(false)
  const [isHoveringHero, setIsHoveringHero] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [showDisplayName, setShowDisplayName] = useState(true)
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false)
  const [tempDisplayName, setTempDisplayName] = useState(profile.display_name)
  const [followerCount, setFollowerCount] = useState(0)
  const [showNewFollowerToast, setShowNewFollowerToast] = useState(false)
  const [newFollowerCount, setNewFollowerCount] = useState(0)
  const [showShareTodayModal, setShowShareTodayModal] = useState(false)
  const [dailyCheckIn, setDailyCheckIn] = useState<{energy: number, mood: string} | null>(null)
  const [libraryCollapsed, setLibraryCollapsed] = useState(false)
  const [showHeaderEditor, setShowHeaderEditor] = useState(false)
  const [profileMission, setProfileMission] = useState(profile.bio || '')
  
  const [headerPrefs, setHeaderPrefs] = useState<HeaderPrefs>({
    bg_type: 'preset', // Start with a preset background
    bg_ref: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><pattern id='granite' patternUnits='userSpaceOnUse' width='20' height='20'><rect width='20' height='20' fill='%23f8f9fa'/><circle cx='5' cy='5' r='0.5' fill='%23e9ecef'/><circle cx='15' cy='15' r='0.3' fill='%23dee2e6'/></pattern></defs><rect width='100%' height='100%' fill='url(%23granite)'/></svg>",
    overlay: 35,
    overlay_mode: 'auto',
    blur: 2,
    grain: false,
    focal: { x: 50, y: 50 },
    crop: { w: 100, h: 100, x: 0, y: 0, ratio: '16:9' },
    show_hero_avatar: true
  })

  // Helper functions
  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }
  
  const [showHeroAvatar, setShowHeroAvatar] = useState(true)

  const handleToggleComplete = (itemId: string, type: string) => {
    const key = `${type}-${itemId}`
    setCompletedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      
      // Save to localStorage
      const today = new Date().toISOString().split('T')[0]
      const storageKey = `completedItems-${userId}-${today}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)))
      
      return newSet
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getFormattedDate = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    }
    return today.toLocaleDateString('en-US', options)
  }

  const firstName = profile.display_name.split(' ')[0]
  const lastName = profile.display_name.split(' ')[1] || ''

  const handleManageModal = (type: string) => {
    setActiveModal(type)
  }

  const handleEdit = (item: any) => {
    console.log('Edit item:', item)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      console.log('Delete item:', id)
    }
  }

  const handleAdd = (type: string) => {
    if (type === 'supplements') {
      window.location.href = '/dash/stack'
    } else if (type === 'protocols') {
      window.location.href = '/dash/protocols'
    } else if (type === 'uploads') {
      window.location.href = '/dash/uploads'
    }
  }

  const handleEditMission = () => {
    setTempMission(mission)
    setIsEditingMission(true)
  }

  const handleSaveMission = () => {
    setMission(tempMission)
    setIsEditingMission(false)
    // TODO: Persist to backend
  }

  const handleCancelMission = () => {
    setTempMission(mission)
    setIsEditingMission(false)
  }

  const handleEditDisplayName = () => {
    setTempDisplayName(displayName)
    setIsEditingDisplayName(true)
  }

  const handleSaveDisplayName = () => {
    setDisplayName(tempDisplayName)
    setIsEditingDisplayName(false)
  }

  const handleCancelDisplayName = () => {
    setTempDisplayName(displayName)
    setIsEditingDisplayName(false)
  }

  const handleShareCheckIn = () => {
    // TODO: Implement PNG export
    console.log('Share check-in:', { energyLevel, mission, profile })
  }

  const updateHeaderPrefs = (updates: Partial<HeaderPrefs>) => {
    setHeaderPrefs(prev => ({ ...prev, ...updates }))
    // TODO: Persist to backend
  }

  const handleProfileUpdate = async (updates: {
    name?: string
    mission?: string
    avatarUrl?: string | null
  }) => {
    try {
      // Import the server action
      const { updateDashboardProfile } = await import('../../lib/actions/dashboard-profile')
      
      await updateDashboardProfile(updates)
      
      // Update local state
      if (updates.name !== undefined) {
        setDisplayName(updates.name)
      }
      if (updates.mission !== undefined) {
        setProfileMission(updates.mission)
      }
      
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  // Calculate completion stats for chips
  const totalTodayItems = todayItems.supplements.length + todayItems.protocols.length
  const completedTodayItems = Array.from(completedItems).length
  const completionPercentage = totalTodayItems > 0 ? Math.round((completedTodayItems / totalTodayItems) * 100) : 0

  const getOverlayColor = () => {
    if (headerPrefs.overlay_mode === 'dark') return 'rgba(0,0,0,'
    if (headerPrefs.overlay_mode === 'light') return 'rgba(255,255,255,'
    return 'rgba(0,0,0,' // Auto defaults to dark
  }

  return (
    <>
      <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        {/* Header - Brand First Design */}
        <div className="bg-white shadow-sm">
          {/* Row 1: Brand Only */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-3 sm:py-4">
              <Link href="/dash" className="inline-flex items-center">
                <img
                  src="/BIOSTACKR LOGO 2.png"
                  alt="Biostackr"
                  className="h-12 w-auto"
                />
                <span className="sr-only">Biostackr dashboard</span>
                </Link>
              </div>
              </div>

          {/* Row 2: Utility Toolbar */}
          <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-end gap-3 py-2">
                {/* Public Profile Button */}
                <button
                  onClick={() => window.location.href = `/u/${profile.slug}`}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Public Profile
                </button>

                {/* Copy Public Link Button */}
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.slug}`)
                      setShowCopyToast(true)
                      setTimeout(() => setShowCopyToast(false), 2000)
                    } catch (err) {
                      console.error('Failed to copy: ', err)
                      alert('Failed to copy link. Please try again.')
                    }
                  }}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  title="Copy your public Biostackr link"
                >
                  Copy Public Link
                </button>

                {/* Journal Link */}
            <button
                  onClick={() => window.location.href = `/u/${profile.slug}#journal`}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
                  Journal
            </button>

                {/* Settings Button */}
                <button
                  onClick={() => window.location.href = '/dash/settings'}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Dashboard Header - Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-8 py-8">
            
            {/* Left: Profile Photo */}
            <div className="flex-shrink-0">
              <div className="relative group">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName}
                    className="w-32 h-32 object-cover rounded-2xl border border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl border border-gray-200 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {showDisplayName ? `${firstName.charAt(0)}${lastName.charAt(0)}` : 'AS'}
                    </span>
                  </div>
                )}
              </div>
              </div>

            {/* Right of Photo: Text + Badges Stack */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Top: Display Name + Mission */}
              <div className="space-y-3">
                {/* Clickable Profile Area */}
                <button
                  onClick={() => setShowHeaderEditor(true)}
                  className="text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {displayName}
                    </h1>
                    <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <p className="text-base text-gray-600 group-hover:text-gray-700 transition-colors">
                    {profileMission || 'Add your mission statement...'}
                  </p>
                </button>

                {/* Daily Check-in Results */}
                {dailyCheckIn && (
                  <button
                    onClick={() => setShowShareTodayModal(true)}
                    className="text-left text-base text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <span className="font-medium">Energy {dailyCheckIn.energy}/10</span>
                    {dailyCheckIn.mood && (
                      <span className="text-gray-500"> • {dailyCheckIn.mood}</span>
                    )}
                  </button>
                )}
              </div>

              {/* Bottom: Badge Row - Inline */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Trial Status Badge */}
                  <TrialStatusBadge userId={userId} currentTier={profile.tier || 'free'} />
                  
                  {/* Status Text Items */}
                  <div className="text-sm font-medium" style={{ color: '#5C6370' }}>
                    🔥 0-day streak
                      </div>
                  <div className="text-sm font-medium" style={{ color: '#5C6370' }}>
                    ✅ {completionPercentage}% complete
                  </div>
                  
                  {/* Follower Count Text - Always Show */}
                        <button
                    onClick={() => window.location.href = '/dash/settings#followers'}
                    className="text-sm font-medium hover:opacity-75 transition-opacity"
                    style={{ color: '#5C6370' }}
                    title={`${followerCount} ${followerCount === 1 ? 'follower' : 'followers'}`}
                  >
                    <span className="flex items-center space-x-1">
                      <span>👥</span>
                      <span>{followerCount}</span>
                      <span>Followers</span>
                    </span>
                        </button>

                  {/* My Daily Check-in Button */}
                        <button
                    onClick={() => setShowShareTodayModal(true)}
                    className="group px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Share today's health update"
                        >
                    <span className="flex items-center space-x-1.5">
                      <Share className="w-3.5 h-3.5 group-hover:translate-y-[-1px] transition-transform duration-200" />
                      <span>My daily check-in</span>
                    </span>
                        </button>
                      </div>
                    </div>
            </div>
          </div>
                </div>
                
        {/* Main Content - Modular Cards */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* Trial Notifications */}
          <TrialNotification userId={userId} currentTier={profile.tier || 'free'} />
          <LimitChecker userId={userId} currentTier={profile.tier || 'free'} />
          
          {/* Date Label - Subtle, above first module */}
          <div className="text-sm text-gray-400 mb-2">
            {getFormattedDate()}
                  </div>
          
          <div className="space-y-8">
            
            {/* Row 1 — Today's Supplements (Full Width) */}
            <SupplementsCard
              items={todayItems.supplements}
              onToggleComplete={handleToggleComplete}
              completedItems={completedItems}
              onManage={() => window.location.href = '/dash/stack'}
            />

            {/* Row 2 — Three Equal Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProtocolsCard
                items={todayItems.protocols}
                onToggleComplete={handleToggleComplete}
                completedItems={completedItems}
                onManage={() => window.location.href = '/dash/protocols'}
              />
              <MovementCard
                items={todayItems.movement}
                onManage={() => window.location.href = '/dash/movement'}
              />
              <MindfulnessCard
                items={todayItems.mindfulness}
                onManage={() => window.location.href = '/dash/mindfulness'}
              />
                  </div>


            {/* Row 4 — Library (Full Width) */}
            <LibrarySection
              onManage={() => window.location.href = '/dash/library'}
              collapsed={libraryCollapsed}
              onToggleCollapse={() => setLibraryCollapsed(!libraryCollapsed)}
            />

            {/* Row 5 — Gear (Full Width) */}
            <GearCard
              items={todayItems.gear}
              onManage={() => window.location.href = '/dash/gear'}
            />

            {/* Row 6 — Creator Tier Modules */}
            {profile.tier === 'creator' && (
              <div className="space-y-8">
                {/* Shop My Gear (Creator Only) */}
                <ShopMyGearSection
                  profileId={profile.id}
                  userTier={profile.tier || 'free'}
                  isOwner={true}
                  initialItems={[]}
                />


                {/* Tier Management */}
                <TierManagement
                  currentTier={profile.tier || 'free'}
                  isOwner={true}
                />
              </div>
            )}

                </div>
              </div>

        {/* Powered by BioStackr */}
        <div className="mt-16 text-center py-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/BIOSTACKR LOGO 2.png" 
                alt="BioStackr" 
                className="h-6 w-auto"
              />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Building your health optimization platform
          </p>
        </div>

        {/* Header Customizer */}
        <HeaderCustomizer
          isOpen={showCustomizer}
          onClose={() => setShowCustomizer(false)}
          headerPrefs={headerPrefs}
          onUpdate={updateHeaderPrefs}
          userId={userId}
          displayName={displayName}
          setDisplayName={setDisplayName}
          showDisplayName={showDisplayName}
          setShowDisplayName={setShowDisplayName}
        />

        {/* Check-in Modal */}
        {showBatteryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#0F1115' }}>Today's Check-in</h2>
                <button
                  onClick={() => setShowBatteryModal(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Apple-Style Battery Bar */}
                    <div className="flex justify-center">
                      <div className="relative">
                        <div 
                      className="bg-gray-200 rounded-full relative overflow-hidden shadow-inner border border-gray-300"
                      style={{ width: '280px', height: '48px' }}
                        >
                          <div 
                            className="h-full rounded-full transition-all ease-out relative"
                            style={{
                              width: `${energyLevel * 10}%`,
                          background: energyLevel <= 3 ? 'linear-gradient(180deg, #A6AFBD 0%, #5C6370 100%)' :
                                    energyLevel <= 6 ? 'linear-gradient(180deg, #9AD15A 0%, #6BB95E 100%)' :
                                    'linear-gradient(180deg, #2FAE58 0%, #22A447 100%)',
                          transitionDuration: '250ms'
                            }}
                          >
                            {/* Fine Grain Texture */}
                            <div 
                              className="absolute inset-0 rounded-full opacity-30"
                              style={{
                                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
                                backgroundSize: '3px 3px'
                              }}
                            />
                            {/* Subtle Gloss */}
                            <div 
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)'
                              }}
                            />
                          </div>
                        </div>
                    {/* Battery Cap */}
                        <div 
                      className="absolute bg-gray-400 rounded-r-md border border-gray-500"
                          style={{ 
                        right: '-8px', 
                            top: '14px', 
                        width: '10px', 
                            height: '20px' 
                          }}
                        />
                      </div>
                    </div>
                    
                {/* Feedback Text */}
                <p className="text-center italic font-medium" style={{ fontSize: '16px', color: '#5C6370' }}>
                      {energyLevel <= 2 ? "Running on empty. Be gentle today." :
                       energyLevel <= 4 ? "Low power. Focus on essentials." :
                       energyLevel <= 6 ? "Stable. Stay consistent." :
                       energyLevel <= 8 ? "Charged. You've got momentum." :
                       "Full power. Unstoppable."}
                    </p>
                    
                {/* Score */}
                    <div className="text-center">
                  <span className="text-3xl font-bold" style={{ color: '#0F1115' }}>{energyLevel}</span>
                  <span className="text-xl" style={{ color: '#5C6370' }}>/10</span>
                    </div>
                    
                {/* Slider */}
                    <div className="px-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                      background: 'linear-gradient(90deg, #A6AFBD 0%, #9AD15A 50%, #22A447 100%)',
                          outline: 'none'
                        }}
                        aria-label="Energy level 1 to 10"
                    aria-valuenow={energyLevel}
                      />
                  <div className="flex justify-between text-sm mt-2" style={{ color: '#A6AFBD' }}>
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>

                {/* Share Button */}
                <div className="text-center">
                  <button
                    onClick={handleShareCheckIn}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    Share Check-in
                  </button>
                  </div>
                </div>
              </div>
                    </div>
                  )}



        {/* Copy Toast */}
        {showCopyToast && (
          <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Link copied!
                    </div>
        )}

        {/* New Follower Toast */}
        {showNewFollowerToast && (
          <div className="fixed top-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-center space-x-2">
              <span>🎉</span>
              <div>
                <div className="font-medium">
                  You have {newFollowerCount} new follower{newFollowerCount > 1 ? 's' : ''}!
                          </div>
                <div className="text-sm opacity-90">
                  Total followers: {followerCount}
                        </div>
                      </div>
            </div>
          </div>
        )}
        
        {/* Quick Add Food Modal */}
        {showQuickAddFood && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Quick Add Food</h2>
                <button
                  onClick={() => setShowQuickAddFood(false)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <AddStackItemForm 
                onClose={() => {
                  setShowQuickAddFood(false)
                  window.location.reload() // Refresh to show new food items
                }} 
                itemType="food"
              />
            </div>
          </div>
        )}

        {/* Daily Check-in Modal */}
        <DailyCheckinModal
          isOpen={showShareTodayModal}
          onClose={() => setShowShareTodayModal(false)}
          onEnergyUpdate={handleEnergyUpdate}
          currentEnergy={energyLevel}
          todayItems={todayItems}
          userId={userId}
          profileSlug={profile.slug}
        />

        {/* Add Gear Modal */}
        {showAddGear && (
          <AddGearForm onClose={() => setShowAddGear(false)} />
        )}

        {/* Dashboard Header Editor */}
        <DashboardHeaderEditor
          isOpen={showHeaderEditor}
          onClose={() => setShowHeaderEditor(false)}
          currentName={displayName}
          currentMission={profileMission}
          currentAvatarUrl={profile.avatar_url}
          onUpdate={handleProfileUpdate}
        />

      </div>

      <style jsx global>{`
        .slider {
          background: #E5E7EB;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #111827;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
      `}</style>
    </>
  )
}