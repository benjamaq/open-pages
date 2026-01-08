'use client'

import { useMemo } from 'react'

export function ReminderNudgeModal({
  open,
  onClose,
  onEnable,
}: {
  open: boolean
  onClose: () => void
  onEnable: (payload: { time: string; timezone: string | null }) => void
}) {
  const tz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null } catch { return null }
  }, [])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[520px] rounded-xl bg-white p-8 shadow-lg border border-gray-200">
        <h3 className="text-2xl font-semibold text-center mb-2">Enable daily reminders?</h3>
        <p className="text-sm text-gray-700 text-center">Faster check-ins, faster verdicts. One-click morning email to keep your data flowing.</p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            onClick={() => onEnable({ time: '06:00', timezone: tz })}
            className="px-4 h-10 rounded-full text-white text-sm font-semibold hover:opacity-90"
            style={{ backgroundColor: '#3A2F2A' }}
          >
            Enable reminders
          </button>
          <button onClick={onClose} className="px-4 h-10 rounded-full border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}


