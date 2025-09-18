'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Clock, TestTube, User, LogOut, Camera, Upload, Zap, Crown, Edit2 } from 'lucide-react'
import { 
  getNotificationPreferences, 
  updateNotificationPreferences, 
  sendTestEmail,
  type NotificationPreferences 
} from '../../../lib/actions/notifications'
import { 
  getUserSubscription, 
  getUserUsage,
  type UserSubscription,
  type UsageInfo
} from '../../../lib/actions/subscriptions'

interface SettingsClientProps {
  profile: any
  userEmail: string
}

export default function SettingsClient({ profile, userEmail }: SettingsClientProps) {
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
  const [tempName, setTempName] = useState(profile.name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [allowFollowers, setAllowFollowers] = useState(profile.allow_stack_follow || false)
  const [followerCount, setFollowerCount] = useState(0)
  const [showPublicFollowers, setShowPublicFollowers] = useState(profile.show_public_followers || false)

  useEffect(() => {
    loadPreferences()
    loadFollowerCount()
    loadFollowerSettings()
    loadSubscriptionData()
  }, [])

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
    // Load from localStorage as fallback
    const savedAllowFollowers = localStorage.getItem('biostackr_allow_followers')
    if (savedAllowFollowers !== null) {
      setAllowFollowers(savedAllowFollowers === 'true')
    }

    const savedShowPublicFollowers = localStorage.getItem('biostackr_show_public_followers')
    if (savedShowPublicFollowers !== null) {
      setShowPublicFollowers(savedShowPublicFollowers === 'true')
    }
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
      await updateNotificationPreferences(preferences)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage('Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setIsSendingTest(true)
    setSaveMessage('')
    
    try {
      await sendTestEmail()
      setSaveMessage('Test email sent! Check your inbox.')
      setTimeout(() => setSaveMessage(''), 5000)
    } catch (error) {
      console.error('Error sending test email:', error)
      setSaveMessage('Failed to send test email. Please check your email configuration.')
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
      
      // Store in localStorage as backup until database is migrated
      localStorage.setItem('biostackr_allow_followers', enabled.toString())
      
      setSaveMessage(enabled 
        ? '✅ Stack following enabled! Others can now follow your public stack.'
        : '✅ Stack following disabled. Existing followers will stop receiving updates.'
      )
      setTimeout(() => setSaveMessage(''), 5000)

    } catch (error) {
      console.error('Error updating follower settings:', error)
      
      // If it's a database issue, still update the UI and store locally
      if (error instanceof Error && error.message.includes('column')) {
        setAllowFollowers(enabled)
        localStorage.setItem('biostackr_allow_followers', enabled.toString())
        setSaveMessage(enabled 
          ? '⚠️ Following enabled locally. Run database migration to persist permanently.'
          : '⚠️ Following disabled locally. Run database migration to persist permanently.'
        )
        setTimeout(() => setSaveMessage(''), 8000)
      } else {
        setSaveMessage('Failed to update follower settings. Please try again.')
      }
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
      
      // Store in localStorage as backup until database is migrated
      localStorage.setItem('biostackr_show_public_followers', enabled.toString())
      
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

  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setSaveMessage('')

    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage('File size must be less than 5MB')
        setIsUploading(false)
        return
      }
      
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setSaveMessage('Please upload a JPG, PNG, or WEBP file')
        setIsUploading(false)
        return
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')

      // Upload with progress
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText)
          if (result.error) {
            setSaveMessage(`Upload failed: ${result.error}`)
          } else if (result.url) {
            setUploadProgress(100)
            
            // Update profile avatar
            try {
              const { updateProfileAvatar } = await import('../../../lib/actions/avatar')
              await updateProfileAvatar(result.url)
              
              setSaveMessage('✅ Profile photo updated successfully!')
              setTimeout(() => setSaveMessage(''), 3000)
              // Refresh the page to show new avatar
              setTimeout(() => window.location.reload(), 1000)
            } catch (updateError) {
              console.error('Failed to update profile:', updateError)
              setSaveMessage('⚠️ Photo uploaded but failed to update profile. Please refresh the page.')
            }
          }
        } else {
          setSaveMessage('❌ Upload failed. Please try again.')
        }
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.onerror = () => {
        setSaveMessage('❌ Upload failed. Please try again.')
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.open('POST', '/api/upload')
      xhr.send(formData)

    } catch (error) {
      console.error('Profile photo upload error:', error)
      setSaveMessage('❌ Upload failed. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleNameEdit = () => {
    setEditingName(true)
    setTempName(profile.name || '')
  }

  const handleNameSave = async () => {
    if (tempName.trim() === (profile.name || '')) {
      setEditingName(false)
      return
    }

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tempName.trim() })
      })

      if (response.ok) {
        setSaveMessage('✅ Name updated successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
        // Update the profile object
        profile.name = tempName.trim()
        setEditingName(false)
      } else {
        throw new Error('Failed to update name')
      }
    } catch (error) {
      console.error('Error updating name:', error)
      setSaveMessage('❌ Failed to update name. Please try again.')
    }
  }

  const handleNameCancel = () => {
    setTempName(profile.name || '')
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
              <div className="relative">
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name || 'User'}`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="text-white text-xs font-medium">{uploadProgress}%</div>
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 cursor-pointer disabled:opacity-50">
                  <Camera className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG or WEBP. Max 5MB.
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
                  <span>{profile.name || 'Click to set your name'}</span>
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
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          {subscription?.plan_type === 'pro' ? (
            <Crown className="w-6 h-6 text-yellow-500" />
          ) : (
            <Zap className="w-6 h-6 text-green-500" />
          )}
          <h2 className="text-xl font-semibold text-gray-900">
            {subscription?.plan_type === 'pro' ? 'Biostackr Pro' : 'Subscription'}
          </h2>
          {subscription?.plan_type === 'pro' && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              PRO
            </span>
          )}
        </div>

        {subscription?.plan_type === 'free' ? (
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
                  href="/pricing"
                  target="_blank"
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors"
                >
                  Upgrade to Pro - $9.99/month
                </a>
                <span className="text-xs text-gray-500">Cancel anytime</span>
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
                <button
                  onClick={() => alert('Billing management coming soon!')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Manage Billing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
        </div>
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
                Let others receive email updates when you change your public supplements, protocols, and routines
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
                Display how many people follow your stack on your public profile
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
              <li>• Only public items are shared (private items never included)</li>
              <li>• Followers can choose daily, weekly, or no emails</li>
              <li>• You can disable following anytime</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Email Notifications Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Email Setup</h2>
        </div>

        <div className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Enable Email System</h3>
              <p className="text-sm text-gray-500">Turn on email functionality (required for all email features)</p>
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
              All emails will be sent to this address
            </p>
          </div>

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
              Send a sample daily reminder to test your email setup
            </p>
          </div>
        </div>
      </div>

      {/* Daily Reminders Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900">Daily Reminders</h2>
        </div>

        <div className="space-y-6">
          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Daily Reminders</h3>
              <p className="text-sm text-gray-500">Send me daily reminders with my health routine</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.daily_reminder_enabled}
                onChange={(e) => updatePreference('daily_reminder_enabled', e.target.checked)}
                disabled={!preferences.email_enabled}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
            </label>
          </div>

          {/* Reminder Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Time
              </label>
              <input
                type="time"
                value={preferences.reminder_time}
                onChange={(e) => updatePreference('reminder_time', e.target.value)}
                disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
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
        </div>
      </div>

      {/* Content Preferences Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900">Reminder Content</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Choose what to include in your daily reminder emails:
          </p>

          {/* Content Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">💊</span>
                <div>
                  <h4 className="font-medium text-gray-900">Supplements</h4>
                  <p className="text-sm text-gray-500">Your daily supplement stack</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.supplements_reminder}
                  onChange={(e) => updatePreference('supplements_reminder', e.target.checked)}
                  disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">📋</span>
                <div>
                  <h4 className="font-medium text-gray-900">Protocols</h4>
                  <p className="text-sm text-gray-500">Your health protocols and routines</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.protocols_reminder}
                  onChange={(e) => updatePreference('protocols_reminder', e.target.checked)}
                  disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🏃‍♂️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Movement</h4>
                  <p className="text-sm text-gray-500">Exercise and physical activities</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.movement_reminder}
                  onChange={(e) => updatePreference('movement_reminder', e.target.checked)}
                  disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-lg">🧘‍♀️</span>
                <div>
                  <h4 className="font-medium text-gray-900">Mindfulness</h4>
                  <p className="text-sm text-gray-500">Meditation and mindfulness practices</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.mindfulness_reminder}
                  onChange={(e) => updatePreference('mindfulness_reminder', e.target.checked)}
                  disabled={!preferences.email_enabled || !preferences.daily_reminder_enabled}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Options</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Missed Items Reminders</h4>
              <p className="text-sm text-gray-500">Get reminded about items you haven't completed</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.missed_items_reminder}
                onChange={(e) => updatePreference('missed_items_reminder', e.target.checked)}
                disabled={!preferences.email_enabled}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Weekly Summary</h4>
              <p className="text-sm text-gray-500">Get a weekly report of your progress</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.weekly_summary}
                onChange={(e) => updatePreference('weekly_summary', e.target.checked)}
                disabled={!preferences.email_enabled}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {saveMessage && (
            <div className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {saveMessage}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Sign Out Section - At Bottom */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6 mt-8">
        <div className="flex items-center space-x-3 mb-4">
          <LogOut className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Sign Out</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sign out of your Biostackr account. You'll be redirected to the sign-in page.
          </p>
          
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
