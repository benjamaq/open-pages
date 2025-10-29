'use client'

import { useState, useEffect } from 'react'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import Link from 'next/link'
import { fireMetaEvent } from '@/lib/analytics'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Edit3, Trash2, X, ExternalLink, Edit2, Check, X as Cancel, Paintbrush, Upload, Image as ImageIcon, Settings, Trash, Crop, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import DailyCheckinModal from '../../components/DailyCheckinModal'
// Import mood components
import TodaySnapshot from '../components/mood/TodaySnapshot'
import EnhancedDayDrawerV2 from '../components/mood/EnhancedDayDrawerV2'
import EditableName from '../../components/EditableName'
import EditableMission from '../../components/EditableMission'
import AddStackItemForm from '../../components/AddStackItemForm'
import AddProtocolForm from '../../components/AddProtocolForm'
import GearCard from '../../components/GearCard'
import AddGearForm from '../../components/AddGearForm'
import LibrarySection from '../../components/LibrarySection'
import LibraryUploadForm from '../../components/LibraryUploadForm'
import ShopMyGearSection from '../../components/ShopMyGearSection'
import TierManagement from '../../components/TierManagement'
import TrialNotification from '../../components/TrialNotification'
import TrialStatusBadge from '../../components/TrialStatusBadge'
import LimitChecker from '../../components/LimitChecker'
import DashboardHeaderEditor from '../../components/DashboardHeaderEditor'
import BetaFeedbackWidget from '../../components/BetaFeedbackWidget'
import OnboardingModal from '../../components/OnboardingModal'
import OnboardingBanner from '../../components/OnboardingBanner'
import WhatsNextCard from '../../components/WhatsNextCard'
import FirstTimeTooltip from '../../components/FirstTimeTooltip'
import PWAInstallButton from '../components/PWAInstallButton'
import { shouldShowOnboarding, getNextOnboardingStep, updateOnboardingStep, needsOrchestratedOnboarding } from '@/lib/onboarding'
import { ElliCard } from '../../components/elli/ElliCard'
import OnboardingOrchestrator from '../../components/onboarding/OnboardingOrchestrator'
import { PatternsCard } from './components/PatternsCard'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  slug: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  tier?: 'free' | 'pro' | 'creator'
  custom_logo_url?: string
  custom_branding_enabled?: boolean
  // Onboarding fields
  onboarding_completed?: boolean
  onboarding_step?: number
  first_checkin_completed?: boolean
  first_supplement_added?: boolean
  profile_created?: boolean
  public_page_viewed?: boolean
  tone_profile?: string
  condition_category?: string
  condition_specific?: string
}

interface Counts {
  stackItems: number
  protocols: number
  uploads: number
  followers: number
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'upload')
    formData.append('userId', userId) // Make sure userId variable exists in scope
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    const data = await response.json()
    if (data.url) {
      // Update header preferences with permanent URL
      onUpdate({
        bg_type: 'upload',
        bg_ref: data.url
      })
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

        <div className="p-6 overflow-y-auto max-h-[60vh] w-full" style={{ 
          scrollbarWidth: 'thin', 
          scrollbarColor: '#d1d5db #f3f4f6',
          boxSizing: 'border-box'
        }}>
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
      <h2 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>{title}</h2>
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
            <span>Add/Manage</span>
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


// Row 1 — Supplements Card (Full Width)
const SupplementsCard = ({ items, onToggleComplete, completedItems, onManage, onAdd }: {
  items: any[]
  onToggleComplete: (id: string, type: string) => void
  completedItems: Set<string>
  onManage: () => void
  onAdd: () => void
}) => {
  const [collapsed, setCollapsed] = useState(items.length === 0) // Collapse only if empty
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
                    className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gray-900 border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex items-center">
          <h2 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>Supplements & Meds</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full ml-2">
            {categoryFilteredItems.length}
          </span>
        </div>
        <div className="flex items-center">
          {/* Removed per request: using single global action above the module */}
          <button
            onClick={onAdd}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            style={{ marginRight: '-4px' }}
            aria-label="Add supplements & meds"
            title="Add supplements & meds"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage supplements & meds"
            title="Manage supplements & meds"
          >
            Manage
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
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={onAdd}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Supplements & Meds
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Supplements, medications, peptides, vitamins, or nootropics</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Protocols Card
const ProtocolsCard = ({ items, onToggleComplete, completedItems, onManage, onAdd }: {
  items: any[]
  onToggleComplete: (id: string, type: string) => void
  completedItems: Set<string>
  onManage: () => void
  onAdd: () => void
}) => {
  const [collapsed, setCollapsed] = useState(true) // Collapse by default

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
        <div className="flex items-center space-x-1 sm:space-x-2">
          <h2 className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#0F1115' }}>Protocols & Recovery</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          <button
            onClick={onAdd}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Add protocols & recovery"
            title="Add protocols & recovery"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-1.5 sm:px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage protocols & recovery"
            title="Manage protocols & recovery"
          >
            Manage
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
                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  onClick={onAdd}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Protocols & Recovery
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Sleep routines, ice baths, sauna, red light therapy, or rehabilitation exercises</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Movement Card
const MovementCard = ({ items = [], onToggleComplete, completedItems, onManage, onAdd }: { 
  items?: any[]; 
  onToggleComplete: (id: string, type: string) => void;
  completedItems: Set<string>;
  onManage: () => void; 
  onAdd: () => void 
}) => {
  const [collapsed, setCollapsed] = useState(true) // Collapse by default

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
        <div className="flex items-center space-x-1 sm:space-x-2">
          <h2 className="font-bold text-base sm:text-lg md:text-xl" style={{ color: '#0F1115' }}>Movement</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          <button
            onClick={onAdd}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Add movement"
            title="Add movement"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-1.5 sm:px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage movement"
            title="Manage movement"
          >
            Manage
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
                const itemKey = `movement-${item.id}`
                const isCompleted = completedItems.has(itemKey)
                
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <button
                      onClick={() => onToggleComplete(item.id, 'movement')}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-gray-900 border-gray-900' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {isCompleted && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span className={`text-base font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </span>
                      {item.dose && <div className="text-sm text-gray-500">{item.dose}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onAdd}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Movement
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Yoga, stretching, mobility work, strength training, or cardio</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 2 — Mindfulness Card
const MindfulnessCard = ({ items = [], onToggleComplete, completedItems, onManage, onAdd }: { 
  items?: any[]; 
  onToggleComplete: (id: string, type: string) => void;
  completedItems: Set<string>;
  onManage: () => void; 
  onAdd: () => void 
}) => {
  const [collapsed, setCollapsed] = useState(true) // Collapse by default

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
        <div className="flex items-center">
          <h2 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>Mind & Stress</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full ml-2">
            {items.length}
          </span>
        </div>
        <div className="flex items-center">
          <button
            onClick={onAdd}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            style={{ marginRight: '-4px' }}
            aria-label="Add mind & stress"
            title="Add mind & stress"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage mind & stress"
            title="Manage mind & stress"
          >
            Manage
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
                const itemKey = `mindfulness-${item.id}`
                const isCompleted = completedItems.has(itemKey)
                
                return (
                  <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <button
                      onClick={() => onToggleComplete(item.id, 'mindfulness')}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                        isCompleted 
                          ? 'bg-gray-900 border-gray-900' 
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {isCompleted && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span className={`text-base font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.name}
                      </span>
                      {item.dose && <div className="text-sm text-gray-500">{item.dose}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="flex flex-col items-center justify-center h-24">
                <button
                  onClick={onAdd}
                  className="bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors mb-3"
                >
                  Add Mind & Stress
                </button>
                <p className="text-sm leading-relaxed max-w-64" style={{ color: '#5C6370' }}>Meditation, breathing exercises, or stress techniques</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Row 3 — Food Card (Full Width)
const FoodCard = ({ onManage, onQuickAdd, foodItems = [], onAddFood }: { onManage: () => void, onQuickAdd: () => void, foodItems?: any[], onAddFood: () => void }) => {
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
        <h2 className="font-bold text-lg sm:text-xl" style={{ color: '#0F1115' }}>Today's Food</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${!collapsed ? 'rotate-180' : ''}`} style={{ color: '#A6AFBD' }} />
          </button>
          <button
            onClick={onAddFood}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Add food"
            title="Add food"
          >
            <Plus className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onManage}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium text-gray-600 hover:text-gray-900"
            aria-label="Manage food"
            title="Manage food"
          >
            Manage
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

interface PillarCardProps {
  title: string
  count: number
  maxCount: number
  items: any[]
  emptyMessage: string
  onToggleComplete: (itemId: string, type: string) => void
  completedItems: Set<string>
  type: string
  onManage: () => void
  viewAllLink: string
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
                    className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-gray-900 border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())
  
  // Lazy import to avoid large module diff; header button to install PWA
  // We'll render near the "My Health Profile" button row
  
  // Ensure PWA registration runs on dashboard
  useEffect(() => {
    try {
      console.log('🔵 PWA(dash): effect start');
      if (typeof window === 'undefined') return;
      if (!('serviceWorker' in navigator)) {
        console.log('❌ PWA(dash): SW unsupported');
        return;
      }
      navigator.serviceWorker.getRegistration().then((reg) => {
        console.log('🔵 PWA(dash): existing registration:', reg);
        if (!reg) {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then((r) => console.log('✅ PWA(dash): registered', r))
            .catch((e) => console.error('❌ PWA(dash): register failed', e));
        }
      });
    } catch (e) {
      console.warn('⚠️ PWA(dash): error', e);
    }
  }, [])
  
  
  // Debug today's items
  console.log('🔍 DashboardClient - todayItems:', {
    supplements: todayItems.supplements?.length || 0,
    protocols: todayItems.protocols?.length || 0,
    movement: todayItems.movement?.length || 0,
    mindfulness: todayItems.mindfulness?.length || 0
  });
  const [isBetaUser, setIsBetaUser] = useState(false)
  const [betaExpiration, setBetaExpiration] = useState<{
    expiresAt: string | null
    daysUntilExpiration: number | null
    isExpired: boolean
  }>({
    expiresAt: null,
    daysUntilExpiration: null,
    isExpired: false
  })

  // Load all dashboard data in one optimized call
  const loadDashboardData = async () => {
    try {
      // Try to load mood data from optimized API (graceful fallback if not available)
      try {
        const moodResponse = await fetch('/api/dashboard-optimized')
        if (moodResponse.ok) {
          const moodData = await moodResponse.json()
          if (moodData.success) {
            // Set mood data
            setTodayMoodEntry(moodData.data.todayMoodEntry)
            setMonthlyMoodData(moodData.data.monthlyMoodData)
            
            // Set beta status
            if (moodData.data.betaStatus) {
              setIsBetaUser(moodData.data.betaStatus.isBetaUser)
              setBetaExpiration({
                expiresAt: moodData.data.betaStatus.expiresAt,
                daysUntilExpiration: moodData.data.betaStatus.daysUntilExpiration,
                isExpired: moodData.data.betaStatus.isExpired
              })
            }
          }
        }
      } catch (moodError) {
        console.warn('Mood tracking API not available, skipping mood data:', moodError)
        // Set empty mood data to prevent errors
        setTodayMoodEntry(null)
        setMonthlyMoodData([])
      }

      // Load follower data from dashboard API (for real-time updates)
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/dashboard?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Update follower count from API (for real-time updates)
        setFollowerCount(data.followers.count || 0)
        console.log('🔄 Dashboard follower count updated:', data.followers.count)
        
        // Show toast if there are new followers (only if we haven't notified about them yet)
        if (data.followers.count > lastNotifiedFollowerCount) {
          const newFollowers = data.followers.count - lastNotifiedFollowerCount
          setNewFollowerCount(newFollowers)
          setShowNewFollowerToast(true)
          setLastNotifiedFollowerCount(data.followers.count)
          setTimeout(() => setShowNewFollowerToast(false), 5000)
        }
      } else {
        console.error('Failed to load dashboard data:', response.status)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  // Load completed items from localStorage on mount
  useEffect(() => {
    const today = new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD format in local timezone
    const storageKey = `completedItems-${userId}-${today}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const savedItems = JSON.parse(saved)
        setCompletedItems(new Set(savedItems))
        console.log('🔍 Loaded completed items from localStorage:', savedItems)
      } catch (error) {
        console.error('Failed to load completed items:', error)
      }
    }
  }, [userId])

  // Load dashboard data and check welcome parameter
  useEffect(() => {
    // Load all dashboard data
    loadDashboardData()
    
    // Check for welcome parameter
    const welcomeParam = searchParams.get('welcome')
    if (welcomeParam === 'pro' || welcomeParam === 'creator') {
      setWelcomeType(welcomeParam)
      setShowWelcomePopup(true)
      // Remove the welcome parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
    calculateStreak()
    
    // Set up periodic refresh for follower count (every 15 minutes) and only when tab is visible
    const refreshInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }, 900000) // 15 minutes
    
    return () => clearInterval(refreshInterval)
  }, [userId, searchParams])

  // Refresh immediately when the tab becomes visible
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])


  const loadDailyCheckIn = async () => {
    try {
      // Primary: Load from localStorage (user-specific and date-specific)
      const saved = localStorage.getItem(`biostackr_last_daily_checkin_${userId}`)
      if (saved) {
        const data = JSON.parse(saved)
        const today = new Date().toLocaleDateString('sv-SE')
        
      }
      
      // Fallback: Try API if localStorage is empty or old
      const response = await fetch('/api/daily-update/today')
      if (response.ok) {
      }
    } catch (error) {
      console.error('Error loading daily check-in:', error)
    }
  }
  

  const loadTodayMoodEntry = async () => {
    try {
      const response = await fetch('/api/mood/today')
      if (response.ok) {
        const data = await response.json()
        setTodayMoodEntry(data.entry)
      }
    } catch (error) {
      console.error('Error loading today mood entry:', error)
    }
  }

  const calculateStreak = async () => {
    try {
      // Get current month and previous month to ensure we don't miss entries
      const today = new Date()
      const currentMonth = today.toISOString().slice(0, 7)
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7)
      
      // Fetch both current and previous month data
      const [currentResponse, prevResponse] = await Promise.all([
        fetch(`/api/mood/month?month=${currentMonth}`),
        fetch(`/api/mood/month?month=${prevMonth}`)
      ])
      
      let entries: any[] = []
      
      if (currentResponse.ok) {
        const currentData = await currentResponse.json()
        entries = [...(currentData.data || [])]
      }
      
      if (prevResponse.ok) {
        const prevData = await prevResponse.json()
        entries = [...entries, ...(prevData.data || [])]
      }
      
      // Sort entries by date (newest first)
      const sortedEntries = entries.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      let currentStreak = 0
      today.setHours(0, 0, 0, 0)
      
      // Check if today has an entry
      const todayEntry = sortedEntries.find((entry: any) => {
        const entryDate = new Date(entry.date)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      
      if (todayEntry) {
        currentStreak = 1
        
        // Count consecutive days backwards
        for (let i = 1; i < sortedEntries.length; i++) {
          const entryDate = new Date(sortedEntries[i].date)
          entryDate.setHours(0, 0, 0, 0)
          
          const expectedDate = new Date(today)
          expectedDate.setDate(today.getDate() - i)
          expectedDate.setHours(0, 0, 0, 0)
          
          if (entryDate.getTime() === expectedDate.getTime()) {
            currentStreak++
          } else {
            break
          }
        }
      }
      
      setStreak(currentStreak)
    } catch (error) {
      console.error('Error calculating streak:', error)
    }
  }
  
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [mission, setMission] = useState('')
  const [isEditingMission, setIsEditingMission] = useState(false)
  const [tempMission, setTempMission] = useState('')
  const [showCustomizer, setShowCustomizer] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [showQuickAddFood, setShowQuickAddFood] = useState(false)
  const [showAddGear, setShowAddGear] = useState(false)
  const [showAddLibrary, setShowAddLibrary] = useState(false)
  const [showAddSupplement, setShowAddSupplement] = useState(false)
  const [showAddProtocol, setShowAddProtocol] = useState(false)
  const [showAddMovement, setShowAddMovement] = useState(false)
  const [showAddMindfulness, setShowAddMindfulness] = useState(false)
  const [showAddFood, setShowAddFood] = useState(false)
  // Removed manual Notify Followers UI from dashboard
  const [isHoveringHero, setIsHoveringHero] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [showDisplayName, setShowDisplayName] = useState(true)
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false)
  const [tempDisplayName, setTempDisplayName] = useState(profile.display_name)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [followerCount, setFollowerCount] = useState(counts.followers)
  const [showNewFollowerToast, setShowNewFollowerToast] = useState(false)
  const [newFollowerCount, setNewFollowerCount] = useState(0)
  const [lastNotifiedFollowerCount, setLastNotifiedFollowerCount] = useState(counts.followers)
  const [showEnhancedMoodDrawer, setShowEnhancedMoodDrawer] = useState(false)
  const [selectedMoodDate, setSelectedMoodDate] = useState<string | null>(null)
  const [todayMoodEntry, setTodayMoodEntry] = useState(null)
  const [monthlyMoodData, setMonthlyMoodData] = useState([])
  const [libraryCollapsed, setLibraryCollapsed] = useState(true) // Collapse by default
  const [showHeaderEditor, setShowHeaderEditor] = useState(false)
  const [profileMission, setProfileMission] = useState(profile.bio || '')
  const [showWelcomePopup, setShowWelcomePopup] = useState(false)
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined)
  const [welcomeType, setWelcomeType] = useState<'pro' | 'creator' | null>(null)
  const [streak, setStreak] = useState(0)
  
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
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [showOrchestratedOnboarding, setShowOrchestratedOnboarding] = useState(false) // NEW: For new flow

  // Check if user needs onboarding
  useEffect(() => {
    console.log('🔍 Onboarding check:', {
      profile: profile ? {
        id: profile.id,
        display_name: profile.display_name,
        onboarding_completed: profile.onboarding_completed,
        onboarding_step: profile.onboarding_step,
        first_checkin_completed: profile.first_checkin_completed,
        first_supplement_added: profile.first_supplement_added,
        profile_created: profile.profile_created,
        public_page_viewed: profile.public_page_viewed,
        tone_profile: profile.tone_profile // NEW
      } : null,
      shouldShow: profile ? shouldShowOnboarding(profile) : false,
      needsOrchestrated: profile ? needsOrchestratedOnboarding(profile) : false, // NEW
      nextStep: profile ? getNextOnboardingStep(profile) : null
    })
    
    // NEW: Check if user needs orchestrated onboarding (category before check-in)
    if (profile && needsOrchestratedOnboarding(profile)) {
      console.log('🎯 Showing NEW orchestrated onboarding flow');
      setShowOrchestratedOnboarding(true);
      return; // Don't show old onboarding
    }
    
    // OLD: Existing onboarding for users who already have tone_profile
    if (profile && shouldShowOnboarding(profile)) {
      const nextStep = getNextOnboardingStep(profile)
      console.log('🎯 Showing old onboarding modal for step:', nextStep)
      setOnboardingStep(nextStep)
      setShowOnboarding(true)
    }
  }, [profile])

  // Fetch user email for advanced matching
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) setUserEmail(user.email)
      } catch {}
    })()
  }, [])

  // ViewContent for dashboard page
  useEffect(() => {
    let fired = false
    if (!fired) {
      fired = true
      fireMetaEvent('ViewContent', { content_name: 'dashboard' }, { email: userEmail, externalId: userId }).catch(() => {})
    }
  }, [userId, userEmail])

  const handleOnboardingStepComplete = async (step: number) => {
    console.log('🎯 DashboardClient - handleOnboardingStepComplete called for step:', step)
    try {
      // Update database first
      await updateOnboardingStep(step, userId)
      console.log('✅ Database updated for step:', step)
      
      // Then update UI state
      setOnboardingStep(step + 1)
      console.log('✅ UI state updated to step:', step + 1)
    } catch (error) {
      console.error('Error updating onboarding step:', error)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Refresh profile data to update onboarding status
    try {
      fireMetaEvent('CompleteRegistration', {
        value: 0,
        currency: 'USD',
        content_name: 'onboarding_complete'
      }, {
        email: userEmail,
        externalId: userId
      }).catch(() => {})
    } finally {
      window.location.reload()
    }
  }

  // NEW: Handler for orchestrated onboarding completion
  const handleOrchestratedOnboardingComplete = async () => {
    console.log('🎯 DashboardClient - Orchestrated onboarding complete');
    
    // Update profile to mark first check-in and supplement as complete
    try {
      await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_checkin_completed: true,
          first_supplement_added: true, // Assuming they added supplement in orchestrator
          onboarding_step: 2
        })
      });
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
    
    setShowOrchestratedOnboarding(false);
    setShowOnboarding(false); // Prevent old onboarding modal from showing
    try {
      await fireMetaEvent('CompleteRegistration', {
        value: 0,
        currency: 'USD',
        content_name: 'onboarding_complete'
      }, {
        email: userEmail,
        externalId: userId
      })
    } catch {}
    window.location.reload(); // Refresh to show dashboard
  }

  const handleStartOnboarding = () => {
    setShowOnboarding(true)
  }

  const handleOnboardingSkip = async (step: number) => {
    try {
      if (step === 3) {
        // When skipping step 3, advance to step 4 (don't close modal)
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_created: false,
            onboarding_step: 3
          })
        })
        setOnboardingStep(4)
      } else if (step === 4) {
        // When skipping step 4, close modal
        await fetch('/api/profile/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            public_page_viewed: false
          })
        })
        setShowOnboarding(false)
      }
    } catch (error) {
      console.error('Error skipping onboarding step:', error)
    }
  }

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
      const today = new Date().toLocaleDateString('sv-SE')
      const storageKey = `completedItems-${userId}-${today}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)))
      
      return newSet
    })
  }

  // Build list of all today item keys for quick actions
  const getAllTodayKeys = (): string[] => {
    const keys: string[] = []
    try {
      ;(todayItems?.supplements || []).forEach((it: any) => keys.push(`supplement-${it.id}`))
      ;(todayItems?.protocols || []).forEach((it: any) => keys.push(`protocol-${it.id}`))
      ;(todayItems?.movement || []).forEach((it: any) => keys.push(`movement-${it.id}`))
      ;(todayItems?.mindfulness || []).forEach((it: any) => keys.push(`mindfulness-${it.id}`))
      // Food and gear are informational for now; include if present
      ;(todayItems?.food || []).forEach((it: any) => keys.push(`food-${it.id}`))
      ;(todayItems?.gear || []).forEach((it: any) => keys.push(`gear-${it.id}`))
    } catch {}
    return keys
  }

  const markAllForToday = () => {
    const all = new Set(getAllTodayKeys())
    setCompletedItems(all)
    try {
      const today = new Date().toLocaleDateString('sv-SE')
      const storageKey = `completedItems-${userId}-${today}`
      localStorage.setItem(storageKey, JSON.stringify(Array.from(all)))
    } catch {}
  }

  const clearAllForToday = () => {
    setCompletedItems(new Set())
    try {
      const today = new Date().toLocaleDateString('sv-SE')
      const storageKey = `completedItems-${userId}-${today}`
      localStorage.setItem(storageKey, JSON.stringify([]))
    } catch {}
  }

  const getGreeting = () => {
    try {
      const now = new Date()
      const hour = now.getHours()
      if (hour < 12) return 'Good morning'
      if (hour < 18) return 'Good afternoon'
      return 'Good evening'
    } catch {
      return 'Hello'
    }
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

  const firstName = displayName.split(' ')[0]
  const lastName = displayName.split(' ')[1] || ''

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

  const handleSaveMission = async () => {
    setMission(tempMission)
    setIsEditingMission(false)
    
    // Persist to backend
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bio: tempMission })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save mission')
      }
      
      console.log('Mission saved successfully')
    } catch (error) {
      console.error('Failed to save mission:', error)
      // Revert the mission if save failed
      setMission(mission)
    }
  }

  const handleCancelMission = () => {
    setTempMission(mission)
    setIsEditingMission(false)
  }

  const handleHeaderAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please select a JPG, PNG, or WEBP file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')
      formData.append('userId', userId)

      // Upload file
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      
      if (uploadResult.error) {
        throw new Error(uploadResult.error)
      }

      if (uploadResult.url) {
        // Update profile with new avatar URL
        const updateResponse = await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar_url: uploadResult.url }),
          credentials: 'include'
        })

        if (!updateResponse.ok) {
          const updateError = await updateResponse.text()
          throw new Error(`Failed to update profile: ${updateError}`)
        }

        // Update the avatar URL in state to show the new avatar immediately
        setAvatarUrl(uploadResult.url)
        
        // Also refresh the page to ensure all data is synced
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error('No URL returned from upload')
      }

    } catch (error) {
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
      if (updates.avatarUrl !== undefined) {
        setAvatarUrl(updates.avatarUrl)
      }
      
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  // Calculate completion stats for chips
  const totalTodayItems = todayItems.supplements.length + todayItems.mindfulness.length + todayItems.movement.length + todayItems.protocols.length + todayItems.food.length + todayItems.gear.length
  const completedTodayItems = Array.from(completedItems).length
  const completionPercentage = totalTodayItems > 0 ? Math.round((completedTodayItems / totalTodayItems) * 100) : 0

  const getOverlayColor = () => {
    if (headerPrefs.overlay_mode === 'dark') return 'rgba(0,0,0,'
    if (headerPrefs.overlay_mode === 'light') return 'rgba(255,255,255,'
    return 'rgba(0,0,0,' // Auto defaults to dark
  }

  // Fire Meta Pixel CompleteRegistration once after signup with attribution
  useEffect(() => {
    try {
      const flag = sessionStorage.getItem('justSignedUp')
      const cookieFlag = document.cookie.match(/(?:^|; )bs_cr=1/) ? true : false
      if (flag || cookieFlag) {
        try {
          const ft = (() => { try { return document.cookie.match(/(?:^|; )bs_ft=([^;]+)/)?.[1] } catch { return undefined } })()
          const lt = (() => { try { return document.cookie.match(/(?:^|; )bs_lt=([^;]+)/)?.[1] } catch { return undefined } })()
          const attribution = {
            first_touch: ft ? decodeURIComponent(ft) : undefined,
            last_touch: lt ? decodeURIComponent(lt) : undefined,
            value: 0,
            currency: 'EUR'
          }
          fireMetaEvent('CompleteRegistration', attribution, {
            firstName,
            lastName,
            externalId: userId
          }).then(method => {
            console.log('✅ Meta Pixel: CompleteRegistration SENT to Facebook via', method, 'with attribution', attribution)
          }).catch(() => {})
        } catch {}
        sessionStorage.removeItem('justSignedUp')
        try { document.cookie = 'bs_cr=; Max-Age=0; Path=/; SameSite=Lax' } catch {}
      }
    } catch {}
  }, [])

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
                  className="h-14 w-auto"
                />
                <span className="sr-only">Biostackr dashboard</span>
                </Link>
              </div>
              </div>

          {/* Row 2: Utility Toolbar */}
          <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-3 py-1 overflow-x-auto">
                {/* Install PWA Button (shows until installed) */}
                <PWAInstallButton />
                {/* My Health Button (Public page) */}
                <button
                  data-tour="public-profile"
                  onClick={() => window.location.href = `/u/${profile.slug}`}
                  className="bg-gray-900 text-white px-1 sm:px-2 lg:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0 h-8 flex items-center"
                >
                  <span className="hidden sm:inline">My Health Profile</span>
                  <span className="sm:hidden">My Health</span>
                </button>

                {/* Copy Public Link Button */}
                <FirstTimeTooltip
                  id="profile-link-hover"
                  message="This is your shareable link - send it to doctors, friends, or your community"
                  trigger="hover"
                  position="bottom"
                >
                  <button
                    onClick={async () => {
                      const linkText = `${window.location.origin}/biostackr/${profile.slug}?public=true`
                      
                      try {
                        // Check if clipboard API is available and secure context (HTTPS)
                        if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
                          await navigator.clipboard.writeText(linkText)
                          setShowCopyToast(true)
                          setTimeout(() => setShowCopyToast(false), 2000)
                        } else {
                          // Fallback for mobile Safari and other browsers without clipboard API
                          const textArea = document.createElement('textarea')
                          textArea.value = linkText
                          textArea.style.position = 'fixed'
                          textArea.style.left = '-999999px'
                          textArea.style.top = '-999999px'
                          textArea.style.opacity = '0'
                          textArea.style.pointerEvents = 'none'
                          textArea.setAttribute('readonly', '')
                          document.body.appendChild(textArea)
                          
                          // Focus and select for mobile compatibility
                          textArea.focus()
                          textArea.select()
                          textArea.setSelectionRange(0, 99999) // For mobile devices
                          
                          try {
                            const successful = document.execCommand('copy')
                            if (successful) {
                              setShowCopyToast(true)
                              setTimeout(() => setShowCopyToast(false), 2000)
                            } else {
                              throw new Error('execCommand failed')
                            }
                          } catch (fallbackErr) {
                            console.error('Fallback copy failed:', fallbackErr)
                            alert(`Your public link: ${linkText}\n\nPlease copy this link manually.`)
                          } finally {
                            document.body.removeChild(textArea)
                          }
                        }
                      } catch (err) {
                        console.error('Failed to copy: ', err)
                        alert(`Your public link: ${linkText}\n\nPlease copy this link manually.`)
                      }
                    }}
                    className="bg-gray-900 text-white px-1 sm:px-2 lg:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1 h-8"
                    title="Copy your public Biostackr link"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Share link</span>
                    <span className="sm:hidden">Link</span>
                  </button>
                </FirstTimeTooltip>


                {/* Journal Link */}
            <button
                  onClick={() => window.location.href = `/u/${profile.slug}#journal`}
                  className="bg-gray-900 text-white px-1 sm:px-2 lg:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0 h-8 flex items-center"
            >
                  <span className="hidden sm:inline">Journal & Notes</span>
                  <span className="sm:hidden">Journal</span>
            </button>

                {/* Settings Button */}
                <FirstTimeTooltip
                  id="settings-click"
                  message="Control privacy, email reminders, and what's visible on your public page"
                  trigger="click"
                  position="bottom"
                >
                  <button
                    data-tour="settings"
                    onClick={() => {
                      window.location.href = '/dash/settings'
                    }}
                    className="bg-gray-900 text-white px-1 sm:px-2 lg:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap flex-shrink-0 h-8 flex items-center"
                  >
                    Settings
                  </button>
                </FirstTimeTooltip>
              </div>
            </div>
          </div>
        </div>

      {/* Dashboard Header - Profile Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 sm:gap-8 py-4 sm:py-8">
            
            {/* Left: Profile Photo */}
            <div className="flex-shrink-0">
              <div className="relative group">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-cover rounded-2xl border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl border border-gray-200 flex items-center justify-center">
                    <span className="text-sm sm:text-lg md:text-xl lg:text-3xl font-bold text-white">
                      {showDisplayName ? `${firstName.charAt(0)}${lastName.charAt(0)}` : 'AS'}
                    </span>
                  </div>
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-2xl transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={() => document.getElementById('header-avatar-upload')?.click()}
                    className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Change Photo
                  </button>
                </div>
                
                {/* Hidden file input */}
                <input
                  id="header-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleHeaderAvatarUpload}
                />
              </div>
              {/* Mobile: Name to the right via overall flex; keep only avatar in this column */}
            </div>

            {/* Right of Photo: Text + Badges Stack */}
            <div className="flex-1 flex flex-col justify-between text-left">
              
              {/* Top: Display Name + Mission */}
              <div className="space-y-3">
                {/* Clickable Profile Area */}
                <div className="text-left group">
                  {/* Name row */}
                  <div className="flex items-center justify-start gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {displayName}
                    </h1>
                    <button
                      onClick={() => setShowHeaderEditor(true)}
                      title="Edit profile"
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label="Edit profile"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                    {isBetaUser && (
                      <div className="px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium">
                        BETA
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowHeaderEditor(true)}
                    className="text-left w-full"
                  >
                    <p className="text-sm text-black group-hover:text-gray-700 transition-colors">
                      {profileMission || 'Add your mission statement...'}
                    </p>
                  </button>
                </div>

                        </div>
                        
                        {/* Trial Status Badge - Small and positioned nicely */}
                        <div className="mt-4 flex justify-center sm:justify-end">
                          <div className="scale-75 origin-top-right">
                            <TrialStatusBadge userId={userId} currentTier={profile.tier || 'free'} />
                          </div>
                        </div>

              {/* Bottom: Badge Row - Inline */}
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4">
                  {/* Status Text Items */}
                  <div className="text-xs sm:text-sm font-medium" style={{ color: '#5C6370' }}>
                    ✅ Today's checklist {completionPercentage}%
                  </div>
                  <div className="text-xs sm:text-sm font-medium" style={{ color: '#5C6370' }}>
                    🔥 {streak}-day streak
                      </div>
                  
                  
                  {/* Follower Count Text - Always Show */}
                        <button
                    onClick={() => window.location.href = '/dash/settings#followers'}
                    className="text-xs sm:text-sm font-medium hover:opacity-75 transition-opacity"
                    style={{ color: '#5C6370' }}
                    title={`${followerCount} ${followerCount === 1 ? 'follower' : 'followers'}`}
                  >
                    <span className="flex items-center space-x-1">
                      <span>👥</span>
                      <span>{followerCount}</span>
                      <span>Followers</span>
                    </span>
                        </button>

                      </div>
                    </div>
            </div>
          </div>
                </div>
                
        {/* Onboarding Banner */}
        {profile && shouldShowOnboarding(profile) && (
          <OnboardingBanner 
            profile={profile} 
            onStartOnboarding={handleStartOnboarding}
          />
        )}
        

        {/* Main Content - Modular Cards */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {/* What's Next Card - Show after onboarding */}
          <WhatsNextCard profile={profile} />
          
          {/* Trial Notifications */}
          <TrialNotification userId={userId} currentTier={profile.tier || 'free'} />
          {/* Only show limit checker if not showing welcome popup */}
          {!showWelcomePopup && <LimitChecker userId={userId} currentTier={profile.tier || 'free'} />}
          
          {/* Beta Expiration Warning */}
          {isBetaUser && betaExpiration.daysUntilExpiration !== null && betaExpiration.daysUntilExpiration <= 30 && betaExpiration.daysUntilExpiration > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    ⚠️ Beta Access Expiring Soon
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Your beta access expires in {betaExpiration.daysUntilExpiration} days. 
                    After expiration, you'll return to the free tier with limited features.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="/upgrade/pro"
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Get Started with Premium
                    </a>
                    <a
                      href="/dash/settings"
                      className="inline-flex items-center px-3 py-1.5 border border-yellow-300 text-yellow-700 text-sm font-medium rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      View Settings
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-8">
            
            {/* Date and Helpful Note - Right above supplements module */}
            <div className="flex justify-between items-center -mb-6 relative z-10">
              <div className="text-sm text-gray-400">
                {getFormattedDate()}
              </div>
            </div>
            
            {/* Elli Card removed per design: summary lives within Mood Tracker */}

            {/* Row 1 — Today's Supplements (Full Width) */}
            {/* Today Snapshot */}
            {/* Mood Tracking Section */}
            {FEATURE_FLAGS.MOOD_TRACKING && (
              <div data-tour="mood-tracker">
                <TodaySnapshot
                  userId={userId}
                  key={`${(todayMoodEntry as any)?.id || 'no-entry'}-${(todayMoodEntry as any)?.mood || 0}-${(todayMoodEntry as any)?.sleep_quality || 0}-${(todayMoodEntry as any)?.pain || 0}`}
                  todayEntry={todayMoodEntry}
                  todayItems={todayItems}
                  onEditToday={() => {
                    fireMetaEvent('InitiateCheckout', { content_category: 'daily_checkin', content_name: 'check_in_start' }, { email: userEmail, externalId: userId }).catch(() => {})
                    setShowEnhancedMoodDrawer(true)
                  }}
                  onEditDay={(date: string) => {
                    console.log('🔍 DashboardClient - Day clicked:', date);
                    setSelectedMoodDate(date);
                    fireMetaEvent('InitiateCheckout', { content_category: 'daily_checkin', content_name: 'check_in_start' }, { email: userEmail, externalId: userId }).catch(() => {})
                    setShowEnhancedMoodDrawer(true);
                  }}
                  onRefresh={loadTodayMoodEntry}
                  streak={streak}
                  userName={firstName || 'there'}
                />
              </div>
            )}
            {/* Patterns (separate card, 24px gap below) */}
            <PatternsCard userId={userId} />

            {/* Helpful Note + Global Quick Action (outside module) */}
            <div className="mb-4">
              <div className="text-sm text-gray-400 text-center">
                Your dashboard only shows items scheduled for today. View your complete stack in your public profile.
              </div>
              <div className="mt-3 flex items-center justify-end">
                <button
                  onClick={markAllForToday}
                  className="px-3 py-1.5 text-sm rounded-lg bg-black text-white hover:opacity-90"
                >
                  Check everything done today
                </button>
              </div>
            </div>

            <div data-tour="add-items" data-section="supplements">
              <SupplementsCard
                items={todayItems.supplements}
                onToggleComplete={handleToggleComplete}
                completedItems={completedItems}
                onManage={() => router.push('/dash/stack')}
                onAdd={() => setShowAddSupplement(true)}
              />
            </div>

            {/* Row 2 — Three Equal Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ProtocolsCard
                items={todayItems.protocols}
                onToggleComplete={handleToggleComplete}
                completedItems={completedItems}
                onManage={() => router.push('/dash/protocols')}
                onAdd={() => setShowAddProtocol(true)}
              />
              <MovementCard
                items={todayItems.movement}
                onToggleComplete={handleToggleComplete}
                completedItems={completedItems}
                onManage={() => router.push('/dash/movement')}
                onAdd={() => setShowAddMovement(true)}
              />
              <MindfulnessCard
                items={todayItems.mindfulness}
                onToggleComplete={handleToggleComplete}
                completedItems={completedItems}
                onManage={() => router.push('/dash/mindfulness')}
                onAdd={() => setShowAddMindfulness(true)}
              />
                  </div>


            {/* Row 4 — Library (Full Width) */}
            <LibrarySection
              onAdd={() => setShowAddLibrary(true)}
              onManage={() => window.location.href = '/dash/library'}
              collapsed={libraryCollapsed}
              onToggleCollapse={() => setLibraryCollapsed(!libraryCollapsed)}
            />

            {/* Row 5 — Gear (Full Width) */}
            <GearCard
              items={todayItems.gear}
              onAdd={() => setShowAddGear(true)}
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


        {/* Enhanced Mood Tracking Drawer */}
        {FEATURE_FLAGS.MOOD_TRACKING && (
          <EnhancedDayDrawerV2
            isOpen={showEnhancedMoodDrawer}
            onClose={() => {
              console.log('🔍 DashboardClient - Closing mood drawer');
              setShowEnhancedMoodDrawer(false)
              loadTodayMoodEntry() // Refresh data after closing
              calculateStreak() // Recalculate streak
            }}
            date={selectedMoodDate || new Date().toLocaleDateString('sv-SE')}
            userId={userId}
            userName={firstName || 'there'}
            todayItems={todayItems}
            initialData={todayMoodEntry}
          />
        )}
        

        {/* Welcome Popup */}
        {showWelcomePopup && welcomeType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="mb-4">
                {welcomeType === 'creator' ? (
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to {welcomeType === 'creator' ? 'Creator' : 'Pro'}!
              </h2>
              <p className="text-gray-600 mb-6">
                {welcomeType === 'creator' 
                  ? "You're all set up with your Creator account. Start building your health empire with affiliate links, custom branding, and follower insights!"
                  : "You're now on the Pro plan! Enjoy unlimited tracking, priority support, and enhanced features."
                }
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowWelcomePopup(false)}
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Build My Stack
                </button>
                {welcomeType === 'creator' && (
                  <button
                    onClick={() => {
                      setShowWelcomePopup(false)
                      router.push('/dash/settings')
                    }}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Set Up Creator Features
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Add Gear Modal */}
        {showAddGear && (
          <AddGearForm onClose={() => setShowAddGear(false)} />
        )}

        {/* Add Library Modal */}
        {showAddLibrary && (
          <LibraryUploadForm onClose={() => setShowAddLibrary(false)} />
        )}

        {/* Add Supplement Modal */}
        {showAddSupplement && (
          <AddStackItemForm 
            onClose={() => setShowAddSupplement(false)} 
            itemType="supplements"
          />
        )}

        {/* Add Protocol Modal */}
        {showAddProtocol && (
          <AddProtocolForm 
            onClose={() => setShowAddProtocol(false)} 
          />
        )}

        {/* Add Movement Modal */}
        {showAddMovement && (
          <AddStackItemForm 
            onClose={() => setShowAddMovement(false)} 
            itemType="movement"
          />
        )}

        {/* Add Mindfulness Modal */}
        {showAddMindfulness && (
          <AddStackItemForm 
            onClose={() => setShowAddMindfulness(false)} 
            itemType="mindfulness"
          />
        )}

        {/* Add Food Modal */}
        {showAddFood && (
          <AddStackItemForm 
            onClose={() => setShowAddFood(false)} 
            itemType="food"
          />
        )}

        {/* Manual Notify Followers removed from dashboard */}

        {/* Dashboard Header Editor */}
        <DashboardHeaderEditor
          isOpen={showHeaderEditor}
          onClose={() => setShowHeaderEditor(false)}
          currentName={displayName}
          currentMission={profileMission}
          currentAvatarUrl={avatarUrl}
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

      {/* Beta Feedback Widget */}
      <BetaFeedbackWidget isBetaUser={isBetaUser} />

      {/* NEW: Orchestrated Onboarding (Category before check-in) */}
      {showOrchestratedOnboarding && (
        <OnboardingOrchestrator
          isOpen={true}
          onComplete={handleOrchestratedOnboardingComplete}
          userId={userId}
          userName={firstName || 'there'}
        />
      )}

      {/* OLD ONBOARDING REMOVED: Always use orchestrated flow */}
    </>
  )
}