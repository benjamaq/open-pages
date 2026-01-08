'use client'

import { useEffect, useMemo, useState } from 'react'

export function SettingsForm({
  initial,
  email,
  isMember,
}: {
  initial: { reminder_enabled: boolean; reminder_time: string; reminder_timezone: string | null }
  email: string | null
  isMember: boolean
}) {
  const detectedTz = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null } catch { return null }
  }, [])
  const [enabled, setEnabled] = useState<boolean>(Boolean(initial?.reminder_enabled))
  const [time, setTime] = useState<string>(initial?.reminder_time || '06:00')
  const [tz, setTz] = useState<string>(initial?.reminder_timezone || detectedTz || 'UTC')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const times = ['06:00', '07:00', '08:00', '09:00']
  const displayTimes: Array<{ v: string; l: string }> = [
    { v: '06:00', l: '6:00 AM' },
    { v: '07:00', l: '7:00 AM' },
    { v: '08:00', l: '8:00 AM' },
    { v: '09:00', l: '9:00 AM' },
  ]
  const tzOptions = Array.from(new Set([tz, detectedTz, 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney', 'UTC'].filter(Boolean))) as string[]

  async function onSave() {
    setSaving(true)
    setSaved(false)
    try {
      const r = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_enabled: enabled, reminder_time: time, reminder_timezone: tz })
      })
      if (r.ok) setSaved(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  function onDelete() {
    if (!confirm('This will permanently delete all your data. Are you sure?')) return
    // Placeholder; wire to real deletion endpoint when available
    alert('Account deletion is not yet available. Please contact support.')
  }

  return (
    <div className="space-y-6">
      {/* Daily Reminders */}
      <section className="rounded-xl border border-[#E4E1DC] bg-white p-5">
        <div className="text-base font-semibold text-gray-900 mb-2">Daily Reminders</div>
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-gray-800">Send me a daily check‑in reminder</div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-[#C65A2E]' : 'bg-gray-300'}`}
            aria-pressed={enabled}
            aria-label="Toggle daily reminder"
          >
            <span className={`block h-5 w-5 bg-white rounded-full transform transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
          </button>
        </div>
        {enabled && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-700">
              Reminder time
              <select value={time} onChange={e => setTime(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
                {displayTimes.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-700">
              Timezone
              <select value={tz} onChange={e => setTz(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
                {tzOptions.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
            <p className="sm:col-span-2 text-xs text-gray-500 mt-1">
              You&apos;ll get a quick email each morning with your supplements and one‑click check‑in.
            </p>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ backgroundColor: '#3A2F2A', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-gray-600">Saved</span>}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-[#E4E1DC] bg-white p-5">
        <div className="text-base font-semibold text-gray-900 mb-2">Account</div>
        <div className="text-sm text-gray-800">
          <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: '#E4E1DC' }}>
            <span>Email</span>
            <span className="text-gray-600">{email || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: '#E4E1DC' }}>
            <span>Change password</span>
            <a href="/auth/change-password" className="text-sm font-medium hover:opacity-75" style={{ color: '#3A2F2A' }}>Update</a>
          </div>
          {isMember && (
            <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: '#E4E1DC' }}>
              <span>Cancel subscription</span>
              <a href="/billing" className="text-sm font-medium hover:opacity-75" style={{ color: '#3A2F2A' }}>Manage</a>
            </div>
          )}
          <div className="flex items-center justify-between py-2.5">
            <span>Delete account</span>
            <button onClick={onDelete} className="text-sm font-medium text-red-600 hover:opacity-75">Delete account</button>
          </div>
        </div>
      </section>
    </div>
  )
}


