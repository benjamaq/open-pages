'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Clock, TestTube, User, LogOut, Camera, Upload, Zap, Crown, Edit2 } from 'lucide-react'
import { 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  type NotificationPreferences 
} from '../../../lib/actions/notifications'
import { 
  getUserSubscription, 
  getUserUsage,
  type UserSubscription,
  type UsageInfo
} from '../../../lib/actions/subscriptions'
import BackgroundColorPicker from '../../../components/BackgroundColorPicker'

interface SettingsClientProps {
  profile: any
  userEmail: string
  trialInfo: {
    isInTrial: boolean
    trialStartedAt: string | null
    trialEndedAt: string | null
    tier: 'free' | 'pro' | 'creator'
  }
}

export default function SettingsClient({ profile, userEmail, trialInfo }: SettingsClientProps) {
  // Helper placed at top for VAPID key conversion
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    daily_reminder_enabled: true,
    reminder_time: '09:00',
    timezone: 'UTC',
    supplements_reminder: true,
    protocols_reminder: true,
    movement_reminder: true,
    mindfulness_reminder: true,
    missed_items_reminder: true,
    weekly_summary: false
  })
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<UsageInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [tempName, setTempName] = useState(profile.display_name || '')
  const [editingBio, setEditingBio] = useState(false)
  const [tempBio, setTempBio] = useState(profile.bio || '')
  const [isSaving, setIsSaving] = useState(false)
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
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  const [saveMessage, setSaveMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [allowFollowers, setAllowFollowers] = useState(profile.allow_stack_follow ?? true)
  const [followerCount, setFollowerCount] = useState(0)
  const [showPublicFollowers, setShowPublicFollowers] = useState(profile.show_public_followers ?? true)
  const [isPushLoading, setIsPushLoading] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isPushTesting, setIsPushTesting] = useState(false)
  const [reminderTime, setReminderTime] = useState('09:00')
  const [reminderEnabled, setReminderEnabled] = useState(false)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await Promise.allSettled([
        (async () => { if (!cancelled) await loadPreferences() })(),
        (async () => { if (!cancelled) await loadFollowerCount() })(),
        (async () => { if (!cancelled) loadFollowerSettings() })(),
        (async () => { if (!cancelled) await loadSubscriptionData() })(),
        (async () => { if (!cancelled) await checkBetaStatus() })(),
        // Detect existing push subscription so toggle persists across reloads
        (async () => {
          try {
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration()
              const existing = await reg?.pushManager.getSubscription()
              if (existing && !cancelled) setIsPushEnabled(true)
            }
            if (typeof Notification !== 'undefined' && !cancelled) {
              setPermission(Notification.permission)
            }
          } catch {}
        })(),
      ])
    }
    run()
    return () => { cancelled = true }
  }, [])

  const checkBetaStatus = async () => {
    try {
      const response = await fetch('/api/beta/status')
      if (response.ok) {
        const data = await response.json()
        setIsBetaUser(data.isBetaUser || false)
        setBetaExpiration({
          expiresAt: data.expiresAt,
          daysUntilExpiration: data.daysUntilExpiration,
          isExpired: data.isExpired || false
        })
      }
    } catch (error) {
      console.error('Failed to check beta status:', error)
    }
  }

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionData, usageData] = await Promise.all([
        getUserSubscription(),
        getUserUsage()
      ])
      setSubscription(subscriptionData)
      setUsage(usageData)
    } catch (error) {
      console.error('Error loading subscription data:', error)
      // Set defaults
      setSubscription({ id: '', user_id: '', plan_type: 'free', status: 'active' })
      setUsage([])
    }
  }

  const loadFollowerSettings = () => {
    // Use profile data from database as the source of truth
    setAllowFollowers(profile.allow_stack_follow ?? true)
    setShowPublicFollowers(profile.show_public_followers ?? true)
  }

  const loadFollowerCount = async () => {
    try {
      const response = await fetch('/api/stack-follow/followers')
      if (response.ok) {
        const data = await response.json()
        setFollowerCount(data.total || 0)
      } else {
        // If API fails (e.g., tables don't exist), just use 0
        console.warn('Failed to load follower count, using default')
        setFollowerCount(0)
      }
    } catch (error) {
      console.error('Error loading follower count:', error)
      setFollowerCount(0)
    }
  }

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences()
      if (prefs) {
        setPreferences(prefs)
        // Initialize local reminder UI state from saved prefs
        try {
          if (typeof prefs.reminder_time === 'string') {
            const t = (prefs.reminder_time || '09:00').slice(0, 5)
            setReminderTime(t)
          }
          if (typeof prefs.daily_reminder_enabled === 'boolean') {
            setReminderEnabled(!!prefs.daily_reminder_enabled)
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to save settings')
      }
      
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      setSaveMessage(`Failed to save settings: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const requestBrowserPermission = async () => {
    try {
      if (typeof Notification === 'undefined') return
      const result = await Notification.requestPermission()
      setPermission(result)
    } catch {}
  }

  const handleTestEmail = async () => {
    setIsSendingTest(true)
    setSaveMessage('')
    
    try {
      console.log('🧪 Attempting to send test email...')
      console.log('📧 User email:', userEmail)
      console.log('📧 User email type:', typeof userEmail)
      
      if (!userEmail) {
        throw new Error('User email is not available')
      }
      
      const response = await fetch(`/api/test-email?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'test',
          email: userEmail,
          ownerName: 'Test User'
        }),
        cache: 'no-cache'
      })

      console.log('📧 Response status:', response.status)
      
      const result = await response.json()
      console.log('📧 Response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send test email')
      }

      setSaveMessage('✅ Test email sent! Check your inbox.')
      setTimeout(() => setSaveMessage(''), 5000)
    } catch (error) {
      console.error('❌ Error sending test email:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        userEmail: userEmail
      })
      setSaveMessage(`Failed to send test email: ${error.message}`)
    } finally {
      setIsSendingTest(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleFollowersToggle = async (enabled: boolean) => {
    setSaveMessage('')
    
    try {
      const response = await fetch('/api/stack-follow/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allow: enabled })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update follower settings')
      }

      setAllowFollowers(enabled)
      
      setSaveMessage(enabled 
        ? '✅ Stack following enabled! Others can now follow your public stack.'
        : '✅ Stack following disabled. Existing followers will stop receiving updates.'
      )
      setTimeout(() => setSaveMessage(''), 5000)

    } catch (error) {
      console.error('Error updating follower settings:', error)
      
      setSaveMessage('Failed to update follower settings. Please try again.')
    }
  }

  const handlePublicFollowersToggle = async (enabled: boolean) => {
    setSaveMessage('')
    
    try {
      const response = await fetch('/api/stack-follow/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ showPublicFollowers: enabled })
      })

      if (!response.ok) {
        throw new Error('Failed to update public follower settings')
      }

      setShowPublicFollowers(enabled)
      
      setSaveMessage(enabled 
        ? '✅ Follower count will now be shown on your public profile.'
        : '✅ Follower count hidden from your public profile.'
      )
      setTimeout(() => setSaveMessage(''), 3000)

    } catch (error) {
      console.error('Error updating public follower settings:', error)
      setSaveMessage('Failed to update public follower settings. Please try again.')
    }
  }

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      window.location.href = '/auth/signout'
    }
  }

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    formData.append('userId', profile.user_id)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        alert(`Upload failed: ${response.status} - ${errorText}`)
        return
      }
      
      const data = await response.json()
      
      if (data.url) {
        const updateResponse = await fetch('/api/profile/update', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ avatar_url: data.url }),
          credentials: 'include'
        })
        
        if (updateResponse.ok) {
          window.location.reload()
        } else {
          const updateError = await updateResponse.text()
          alert(`Profile update failed: ${updateError}`)
        }
      } else {
        alert('Upload failed: No URL returned')
      }
    } catch (error) {
      alert(`Upload error: ${error.message}`)
    }
  }

  const handleNameEdit = () => {
    setEditingName(true)
    setTempName(profile.display_name || '')
  }

  const handleNameSave = async () => {
    if (tempName.trim() === (profile.display_name || '')) {
      setEditingName(false)
      return
    }

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ display_name: tempName.trim() })
      })

      if (response.ok) {
        setSaveMessage('✅ Name updated successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
        // Update the profile object
        profile.display_name = tempName.trim()
        setEditingName(false)
      } else {
        throw new Error('Failed to update name')
      }
    } catch (error) {
      console.error('Error updating name:', error)
      setSaveMessage('❌ Failed to update name. Please try again.')
    }
  }

  const handleBioEdit = () => {
    setEditingBio(true)
    setTempBio(profile.bio || '')
  }

  const handleBioSave = async () => {
    if (tempBio.trim() === (profile.bio || '')) {
      setEditingBio(false)
      return
    }

    setIsSaving(true)
    setSaveMessage('')

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bio: tempBio.trim() })
      })

      if (response.ok) {
        setSaveMessage('✅ Mission updated successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
        // Update the profile object
        profile.bio = tempBio.trim()
        setEditingBio(false)
      } else {
        throw new Error('Failed to update mission')
      }
    } catch (error) {
      console.error('Error updating mission:', error)
      setSaveMessage('❌ Failed to update mission. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBioCancel = () => {
    setTempBio(profile.bio || '')
    setEditingBio(false)
  }

  const handleNameCancel = () => {
    setTempName(profile.display_name || '')
    setEditingName(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Push + Daily Reminder unified section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Daily Push Reminder</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Enable push toggle */}
          <div>
            <p className="text-sm text-gray-700 font-medium mb-2">Enable push notifications</p>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  if (isPushLoading) return
                  setIsPushLoading(true)
                  setSaveMessage('')
                  try {
                    // Check existing
                    if ('serviceWorker' in navigator) {
                      const reg = await navigator.serviceWorker.getRegistration()
                      const existing = await reg?.pushManager.getSubscription()
                      if (existing) {
                        setIsPushEnabled(true)
                        setSaveMessage('✅ Push already enabled')
                        return
                      }
                    }
                    // Request permission if needed
                    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
                      const result = await Notification.requestPermission()
                      if (result !== 'granted') {
                        setSaveMessage('❌ Permission denied')
                        return
                      }
                    }
                    // Register + subscribe
                    if ('serviceWorker' in navigator) {
                      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js', { scope: '/' }))
                      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string | undefined
                      if (!vapidPublicKey) throw new Error('VAPID public key not configured')
                      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)
                      const subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
                      const response = await fetch('/api/push/subscribe', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: subscription.toJSON() })
                      })
                      if (!response.ok) throw new Error('Failed to save subscription')
                      setIsPushEnabled(true)
                      setSaveMessage('✅ Push enabled')
                      setTimeout(() => setSaveMessage(''), 2500)
                    }
                  } catch (error: any) {
                    console.error('Push enable error:', error)
                    setSaveMessage(`❌ Failed: ${error?.message || 'Unknown error'}`)
                  } finally {
                    setIsPushLoading(false)
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPushEnabled ? 'bg-gray-900' : 'bg-gray-200'
                }`}
                aria-pressed={isPushEnabled}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-xs text-gray-500">Permission: {typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'}</span>
            </div>
          </div>

          {/* Time picker */}
          <div className="opacity-100">
            <p className="text-sm text-gray-700 font-medium mb-2">Choose reminder time</p>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => {
                  setReminderTime(e.target.value)
                  setReminderEnabled(true)
                  fetch('/api/settings/notifications', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ reminder_time: e.target.value, daily_reminder_enabled: true })
                  }).catch(() => {})
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!isPushEnabled}
              />
              <span className="text-xs text-gray-500">Local time</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                if (isPushTesting) return
                setIsPushTesting(true)
                const resp = await fetch('/api/push/test', { method: 'POST' })
                if (!resp.ok) {
                  const data = await resp.json().catch(() => ({}))
                  alert(`Test push failed: ${data?.error || resp.status}`)
                } else {
                  alert('Test notification sent. Check your browser notifications.')
                }
              } catch (e: any) {
                alert(`Test push error: ${e?.message || 'Unknown error'}`)
              } finally {
                setIsPushTesting(false)
              }
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={!isPushEnabled || isPushLoading || isPushTesting}
          >
            {isPushTesting ? 'Sending…' : 'Send Test Notification'}
          </button>
          <p className="text-xs text-gray-500">You’ll get a reminder at {reminderTime} each day</p>
        </div>
      </div>
      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        </div>

        <div className="space-y-6">
          {/* Profile Photo */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Profile Photo</h3>
              <div className="flex items-center space-x-4">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0" style={{ aspectRatio: '1 / 1' }}>
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover block"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <span className="text-white font-bold text-base sm:text-lg">
                      {profile.display_name ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-xs font-medium">{uploadProgress}%</div>
                  </div>
                )}
              </div>
              <div>
                {/* Expert-recommended approach: sync file picker */}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProfilePhotoUpload}
                  disabled={isUploading}
                  className="sr-only"
                  id="avatar-file-input"
                />
                <label
                  htmlFor="avatar-file-input"
                  className="inline-flex items-center px-2 py-1.5 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {isUploading ? 'Uploading...' : 'Upload image'}
                </label>
                
                
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or WEBP. Max 5MB.
                </p>
                
                {/* Browser compatibility note (subtle) */}
                <p className="mt-2 text-xs text-gray-500">
                  Note for Chrome on localhost: if the file picker doesn’t open, try Safari or use HTTPS.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              {editingName ? (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Enter your name"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div 
                  onClick={handleNameEdit}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-700 flex justify-between items-center"
                >
                  <span>{profile.display_name || 'Click to set your name'}</span>
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                @{profile.slug || 'not-set'}
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mission
            </label>
            <p className="text-xs text-gray-500 mb-2">
              This will appear on your public profile page
            </p>
            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="Set your daily mission or health goal..."
                  rows={3}
                  maxLength={200}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{tempBio.length}/200 characters</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBioSave}
                      disabled={isSaving}
                      className="px-3 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleBioCancel}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleBioEdit}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-700 min-h-[80px] flex items-start"
              >
                <span>{profile.bio || 'Click to set your mission...'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Branding Section (Creator Only) */}
      {profile.tier === 'creator' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🎨</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Custom Branding</h2>
          </div>
          <div className="space-y-6">
            {/* Background Color */}
            <div>
              <BackgroundColorPicker 
                userTier={profile.tier || 'creator'}
                initialColor={profile.custom_background_color || '#FFFFFF'}
                isOwner={true}
              />
            </div>
            
            {/* Custom Logo */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Custom Logo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your own logo to replace the BioStackr branding on your public profile.
              </p>
              
              {profile.custom_logo_url && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.custom_logo_url}
                      alt="Custom logo"
                      className="h-10 w-auto"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Logo</p>
                      <p className="text-xs text-gray-500">This appears on your public profile</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-2">Upload your logo</p>
                <p className="text-xs text-gray-500 mb-4">PNG, JPG, or SVG up to 5MB</p>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                  Choose File
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                💡 <strong>Note:</strong> Custom branding settings can also be found at the bottom of your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Account</h2>
        </div>

        <div className="space-y-6">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              {userEmail}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is your account email address
            </p>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Sign Out</h3>
                <p className="text-sm text-gray-500">
                  Sign out of your Biostackr account
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1.5"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          {trialInfo.tier === 'creator' ? (
            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">⭐</span>
            </div>
          ) : trialInfo.tier === 'pro' && !isBetaUser ? (
            <Crown className="w-6 h-6 text-yellow-500" />
          ) : isBetaUser ? (
            <TestTube className="w-6 h-6 text-blue-500" />
          ) : (
            <Zap className="w-6 h-6 text-green-500" />
          )}
          <h2 className="text-xl font-semibold text-gray-900">
            {trialInfo.tier === 'creator' ? 'Biostackr Creator' : 
             trialInfo.tier === 'pro' && !isBetaUser ? 'Biostackr Pro' : 
             isBetaUser ? 'Beta Tester' : 'Subscription'}
          </h2>
          {trialInfo.tier === 'creator' && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              ⭐ CREATOR
            </span>
          )}
          {trialInfo.tier === 'pro' && !isBetaUser && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              PRO
            </span>
          )}
          {isBetaUser && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
              BETA
            </span>
          )}
        </div>

        {trialInfo.tier === 'free' && !isBetaUser ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Current Usage</h3>
              <div className="grid grid-cols-2 gap-4">
                {usage.map((item) => (
                  <div key={item.feature_name} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">
                      {item.feature_name}:
                    </span>
                    <span className="text-sm font-medium">
                      {item.current_count}/{item.is_unlimited ? '∞' : item.limit_value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Upgrade to Pro</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get unlimited supplements, protocols, movement, mindfulness, and more advanced features.
              </p>
              <div className="flex items-center space-x-4">
                <a
                  href="/pricing/pro"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  Upgrade to Pro - $9.99/month
                </a>
                <span className="text-xs text-gray-500">Cancel anytime</span>
              </div>
            </div>
          </div>
        ) : isBetaUser ? (
          <div className="space-y-4">
            {/* Expiration Warning */}
            {betaExpiration.daysUntilExpiration !== null && betaExpiration.daysUntilExpiration <= 30 && betaExpiration.daysUntilExpiration > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                      ⚠️ Beta Access Expiring Soon
                    </h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      Your beta access expires in {betaExpiration.daysUntilExpiration} days. 
                      After expiration, you'll return to the free tier.
                    </p>
                    <a
                      href="/pricing/pro"
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Upgrade to Pro - $9.99/month
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">🧪 Beta Access - Pro Features Active</h3>
              <p className="text-sm text-blue-800 mb-3">
                You have 6 months of free Pro access as a beta tester. Thank you for helping us improve BioStackr!
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>✓ Unlimited supplements</div>
                <div>✓ Unlimited protocols</div>
                <div>✓ Unlimited movement</div>
                <div>✓ Unlimited mindfulness</div>
                <div>✓ 1GB file storage</div>
                <div>✓ Unlimited followers</div>
                <div>✓ Advanced analytics</div>
                <div>✓ Beta feedback access</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Beta Tester</h3>
                  <p className="text-sm text-gray-600">
                    {betaExpiration.daysUntilExpiration !== null && betaExpiration.daysUntilExpiration > 0
                      ? `${betaExpiration.daysUntilExpiration} days remaining`
                      : '6 months free Pro access'
                    }
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  No billing required
                </div>
              </div>
            </div>
          </div>
        ) : trialInfo.tier === 'creator' ? (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Creator Features Active</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                <div>⭐ Everything in Pro</div>
                <div>⭐ Custom branding</div>
                <div>⭐ Background colors</div>
                <div>⭐ Affiliate links</div>
                <div>⭐ Creator dashboard</div>
                <div>⭐ Public profile</div>
                <div>⭐ Follower management</div>
                <div>⭐ Priority support</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Biostackr Creator</h3>
                  <p className="text-sm text-gray-600">$19.99/month</p>
                </div>
                <a
                  href="/dash/billing"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manage Billing
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Pro Features Active</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                <div>✓ Unlimited supplements</div>
                <div>✓ Unlimited protocols</div>
                <div>✓ Unlimited movement</div>
                <div>✓ Unlimited mindfulness</div>
                <div>✓ 1GB file storage</div>
                <div>✓ Unlimited followers</div>
                <div>✓ Advanced analytics</div>
                <div>✓ Priority support</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">Biostackr Pro</h3>
                  <p className="text-sm text-gray-600">$9.99/month</p>
                </div>
                <a
                  href="/dash/billing"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manage Billing
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Followers Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900">Stack Followers</h2>
        </div>

        <div className="space-y-6">
          {/* Allow Followers Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Allow people to follow your stack</h3>
              <p className="text-sm text-gray-500">
                Let others receive email updates when you change your public supplements, protocols, and routines (enabled by default)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowFollowers}
                onChange={(e) => handleFollowersToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          {/* Follower Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{followerCount}</div>
              <div className="text-sm text-gray-500">
                {followerCount === 1 ? 'Follower' : 'Followers'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {allowFollowers ? 'Open' : 'Closed'}
              </div>
              <div className="text-sm text-gray-500">
                Following Status
              </div>
            </div>
          </div>

          {/* Public Follower Count Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Show follower count on public profile</h3>
              <p className="text-sm text-gray-500">
                Display how many people follow your stack on your public profile (enabled by default)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showPublicFollowers}
                onChange={(e) => handlePublicFollowersToggle(e.target.checked)}
                disabled={!allowFollowers}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
            </label>
          </div>

          {/* Follower Management Link */}
          {followerCount > 0 && (
            <div>
              <button
                onClick={() => window.location.href = '/dash/followers'}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Manage Followers ({followerCount})
              </button>
              <p className="text-xs text-gray-500 mt-1">
                View and manage who follows your stack
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How Stack Following Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Followers receive weekly email digests of your public stack changes</li>
              <li>• You can notify followers once a day with special updates</li>
              <li>• Only public items are shared (private items never included)</li>
              <li>• All followers receive the same weekly digest format</li>
              <li>• You can disable following anytime to stop all notifications</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Email Settings Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Emails from Biostackr</h3>
              <p className="text-sm text-gray-500">Master switch - turn off to stop all emails from this app</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => updatePreference('email_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
              {userEmail}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All notifications will be sent to this address
            </p>
          </div>

          {/* Daily Emails Section - Only show if email enabled */}
          {preferences.email_enabled && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-5 h-5 text-green-500" />
                <h3 className="font-medium text-gray-900">Daily Emails</h3>
      </div>

              {/* Daily Email Toggle */}
              <div className="flex items-center justify-between mb-4">
            <div>
                  <h4 className="font-medium text-gray-900">Send me daily emails</h4>
                  <p className="text-sm text-gray-500">Get a daily email with your supplements, protocols, and tasks</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.daily_reminder_enabled}
                onChange={(e) => updatePreference('daily_reminder_enabled', e.target.checked)}
                className="sr-only peer"
              />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

              {/* Email Time & Content - Only show if daily emails enabled */}
              {preferences.daily_reminder_enabled && (
                <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                        Send Time
              </label>
              <input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) => updatePreference('reminder_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your local time</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
        </div>
      </div>

                  {/* What to Include */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">What to Include</h4>
          <p className="text-sm text-gray-600 mb-4">
                      Choose what to include in your daily emails:
          </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                <span className="text-lg">💊</span>
                <div>
                            <h5 className="font-medium text-gray-900">Supplements & Meds</h5>
                            <p className="text-xs text-gray-500">Daily supplements and medications</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.supplements_reminder}
                  onChange={(e) => updatePreference('supplements_reminder', e.target.checked)}
                  className="sr-only peer"
                />
                          <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                <div>
                            <h5 className="font-medium text-gray-900">Protocols & Recovery</h5>
                            <p className="text-xs text-gray-500">Recovery protocols</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.protocols_reminder}
                  onChange={(e) => updatePreference('protocols_reminder', e.target.checked)}
                  className="sr-only peer"
                />
                          <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                <span className="text-lg">🏃‍♂️</span>
                <div>
                            <h5 className="font-medium text-gray-900">Training & Rehab</h5>
                            <p className="text-xs text-gray-500">Training and rehab activities</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.movement_reminder}
                  onChange={(e) => updatePreference('movement_reminder', e.target.checked)}
                  className="sr-only peer"
                />
                          <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>

                      <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                <span className="text-lg">🧘‍♀️</span>
                <div>
                            <h5 className="font-medium text-gray-900">Mind & Stress</h5>
                            <p className="text-xs text-gray-500">Mind and stress support</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.mindfulness_reminder}
                  onChange={(e) => updatePreference('mindfulness_reminder', e.target.checked)}
                  className="sr-only peer"
                />
                          <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gray-900"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
              )}
            </div>
          )}

          {/* Test Email Button */}
          <div>
            <button
              onClick={handleTestEmail}
              disabled={!preferences.email_enabled || isSendingTest}
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isSendingTest ? 'Sending...' : 'Send Test Email'}
            </button>
            <p className="text-xs text-gray-500 mt-1">
              Send a test email to verify your setup is working
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {saveMessage && (
                <p className={`text-sm ${saveMessage.includes('successfully') || saveMessage.includes('✅') ? 'text-green-600' : saveMessage.includes('⚠️') ? 'text-yellow-600' : 'text-red-600'}`}>
                  {saveMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Email Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Other Email Types - Only show if emails enabled */}
      {preferences.email_enabled && (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Other Email Types</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
                <h4 className="font-medium text-gray-900">Missed Items Follow-ups</h4>
                <p className="text-sm text-gray-500">Get gentle reminders about items you haven't completed in 2+ days</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.missed_items_reminder}
                onChange={(e) => updatePreference('missed_items_reminder', e.target.checked)}
                className="sr-only peer"
              />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Weekly Summary</h4>
              <p className="text-sm text-gray-500">Get a weekly report of your progress and stats</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.weekly_summary}
                onChange={(e) => updatePreference('weekly_summary', e.target.checked)}
                className="sr-only peer"
              />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>
        </div>
      </div>
      )}

      {/* Contact Support Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Need Help?
        </h3>
        <p className="text-gray-600 mb-4">
          Having trouble with your account or have questions? Our support team is here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/contact"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Mail className="h-4 w-4 mr-2" />
            Contact Support
          </a>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          We typically respond within 24 hours. Pro users get priority support.
        </p>
      </div>


    </div>
  )
}

// Local helper for VAPID base64 → Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
