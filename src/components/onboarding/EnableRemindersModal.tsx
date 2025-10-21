'use client'

import { useEffect, useMemo, useState } from 'react'

type EnableRemindersModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function EnableRemindersModal({ isOpen, onClose }: EnableRemindersModalProps) {
  const [time, setTime] = useState<string>('09:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [permission, setPermission] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default')

  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission)
      }
    } catch {}
  }, [isOpen])

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      return 'UTC'
    }
  }, [])

  if (!isOpen) return null

  const handleEnable = async () => {
    setError('')
    setSaving(true)
    try {
      // Ask permission only after explicit user action
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        setPermission(result)
      }

      // Save preference regardless of push support; we'll use email or client notifications as fallback
      const resp = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_reminder_enabled: true,
          reminder_time: time,
          timezone
        })
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data?.details || data?.error || 'Failed to save reminder settings')
      }

      // Fire a local test notification if allowed
      try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Reminder enabled', {
            body: `We will nudge you daily at ${time}`,
          })
        }
      } catch {}

      try { localStorage.setItem('pushPromptShown', '1') } catch {}
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to enable reminders')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-x-0 top-16 mx-auto max-w-md w-[92%] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🔔</span>
            <h3 className="text-lg font-semibold text-gray-900">Get a reminder to check in</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            20 seconds a day. We’ll nudge you at the time you choose.
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reminder time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Timezone: {timezone}</p>
          </div>

          {permission === 'denied' && (
            <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
              Notifications are blocked in your browser settings. You can still save reminders; we’ll email you if enabled.
            </div>
          )}

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              onClick={handleEnable}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Enable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


