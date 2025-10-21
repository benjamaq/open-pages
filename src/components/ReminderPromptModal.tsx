'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'

interface ReminderPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onEnable: (time: string) => Promise<void>
}

export default function ReminderPromptModal({ isOpen, onClose, onEnable }: ReminderPromptModalProps) {
  const [reminderTime, setReminderTime] = useState('09:00')
  const [isEnabling, setIsEnabling] = useState(false)

  if (!isOpen) return null

  const handleEnable = async () => {
    setIsEnabling(true)
    try {
      await onEnable(reminderTime)
      onClose()
    } catch (error) {
      console.error('Failed to enable reminders:', error)
    } finally {
      setIsEnabling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">Get a quick daily reminder?</h2>
        <p className="text-sm text-gray-600 mb-4">We can nudge you once a day to check in. Pick a time that suits you.</p>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">Reminder time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full"
          />
          <p className="text-xs text-gray-500 mt-2">Local time: you'll get a notification around {reminderTime} each day.</p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Not now
          </button>
          <button
            onClick={handleEnable}
            disabled={isEnabling}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {isEnabling ? 'Enabling…' : 'Enable reminders'}
          </button>
        </div>
      </div>
    </div>
  )
}


