'use client'

import { useEffect, useMemo, useState } from 'react'
import { detectTimezone, roundTimeTo30Min, saveReminderSettings } from '@/lib/reminders/saveReminderSettings'
import { PromoRedeemer } from '@/components/billing/PromoRedeemer'

export function SettingsForm({
  initial,
  email,
  isMember,
  promoTrialExpiresAt,
}: {
  initial: { reminder_enabled: boolean; reminder_time: string; reminder_timezone: string | null }
  email: string | null
  isMember: boolean
  promoTrialExpiresAt?: string | null
}) {
  const detectedTz = useMemo(() => {
    try { return detectTimezone() || null } catch { return null }
  }, [])
  const [enabled, setEnabled] = useState<boolean>(Boolean(initial?.reminder_enabled))
  const [time, setTime] = useState<string>(initial?.reminder_time || '06:00')
  const [tz, setTz] = useState<string>(initial?.reminder_timezone || detectedTz || 'UTC')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string>('')
  const [tzTouched, setTzTouched] = useState(false)

  const displayTimes: Array<{ v: string; l: string }> = useMemo(() => {
    // 30-minute increments from 06:00 through 23:30
    const out: Array<{ v: string; l: string }> = []
    const pad2 = (n: number) => String(n).padStart(2, '0')
    for (let h = 6; h <= 23; h++) {
      for (const m of [0, 30]) {
        const v = `${pad2(h)}:${pad2(m)}`
        const hour12 = ((h + 11) % 12) + 1
        const ampm = h >= 12 ? 'PM' : 'AM'
        const l = `${hour12}:${pad2(m)} ${ampm}`
        out.push({ v, l })
      }
    }
    return out
  }, [])
  const tzOptions = Array.from(new Set([tz, detectedTz, 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Australia/Sydney', 'UTC'].filter(Boolean))) as string[]

  async function onSave() {
    setSaving(true)
    setSaved(false)
    setSaveError('')
    try {
      const res = await saveReminderSettings({
        enabled,
        time,
        timezone: tz || detectTimezone(),
        timezoneAutodetected: !tzTouched,
      })
      if (!res.ok) {
        setSaveError(res.error || 'Failed to save — please try again.')
        return
      }
      setSaved(true)
    } finally {
      setSaving(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  async function onDelete() {
    if (!confirm('This will permanently delete your account and all associated data. This cannot be undone. Proceed?')) {
      return
    }
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(`Delete failed: ${j?.error || 'Unknown error'}`)
        return
      }
      // Redirect to landing page after deletion; session cookie will be invalidated server-side
      window.location.href = '/'
    } catch (e: any) {
      console.error('[settings] delete error', e)
      alert('Something went wrong deleting your account. Please try again.')
    }
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
              <select value={roundTimeTo30Min(time)} onChange={e => setTime(roundTimeTo30Min(e.target.value))} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md">
                {displayTimes.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-700">
              Timezone
              <select
                value={tz}
                onChange={e => { setTzTouched(true); setTz(e.target.value) }}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {tzOptions.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
            <p className="sm:col-span-2 text-xs text-gray-500 mt-1">
              You&apos;ll get a quick email each morning with your supplements and one‑click check‑in.
            </p>
          </div>
        )}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center justify-center px-4 h-10 rounded-lg bg-[#111111] text-white text-sm font-semibold hover:bg-black disabled:opacity-70"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-gray-700">Settings saved ✓</span>}
          {!saved && saveError && <span className="text-sm text-red-700">Failed to save — please try again.</span>}
        </div>
      </section>

      {/* Promo Code */}
      <section className="rounded-xl border border-[#E4E1DC] bg-white p-5">
        <div className="text-base font-semibold text-gray-900 mb-2">Promo Code</div>
        {(() => {
          const iso = promoTrialExpiresAt ? String(promoTrialExpiresAt) : ''
          const ms = iso ? Date.parse(iso) : NaN
          const active = Number.isFinite(ms) ? ms > Date.now() : false
          if (!active) return null
          const d = new Date(ms)
          const until = Number.isFinite(d.getTime())
            ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
            : null
          return (
            <div className="rounded-lg border border-[#E4E1DC] bg-[#F6F5F3] p-4 text-sm text-[#111111]">
              <div className="font-medium">Promo code redeemed ✓</div>
              <div className="mt-1 text-[#4B5563]">
                Pro Trial active{until ? ` until ${until}` : ''}.
              </div>
            </div>
          )
        })() || (
          <>
            <div className="text-sm text-gray-700">Redeem a promo code to unlock Pro access.</div>
            <PromoRedeemer defaultOpen showToggle={false} />
          </>
        )}
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


