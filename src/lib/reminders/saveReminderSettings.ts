export function roundTimeTo30Min(raw: string): string {
  const s = String(raw || '').trim()
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return '08:00'
  const hh = Math.max(0, Math.min(23, parseInt(m[1], 10)))
  const mm = Math.max(0, Math.min(59, parseInt(m[2], 10)))
  const roundedMin = mm < 15 ? 0 : mm < 45 ? 30 : 0
  const carry = mm >= 45 ? 1 : 0
  const h2 = (hh + carry) % 24
  const pad2 = (n: number) => String(n).padStart(2, '0')
  return `${pad2(h2)}:${pad2(roundedMin)}`
}

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export async function saveReminderSettings(args: {
  enabled: boolean
  time: string
  timezone: string
  // If true, server should only set reminder_timezone when missing (do not overwrite existing manual tz)
  timezoneAutodetected: boolean
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const enabled = Boolean(args.enabled)
  const time = roundTimeTo30Min(args.time)
  const timezone = String(args.timezone || 'UTC')
  const timezoneAutodetected = Boolean(args.timezoneAutodetected)

  // 1) Save into profiles (source of truth for reminder_enabled/timezone in server email cron)
  const r1 = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reminder_enabled: enabled,
      reminder_time: time,
      reminder_timezone: timezone,
      reminder_timezone_autodetected: timezoneAutodetected,
    })
  })
  if (!r1.ok) {
    const j = await r1.json().catch(() => ({}))
    return { ok: false, error: String(j?.error || 'Failed to save reminder settings') }
  }

  // 2) Also keep notification_preferences in sync (push/email settings use this table)
  try {
    await fetch('/api/settings/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daily_reminder_enabled: enabled,
        reminder_time: time,
        timezone,
      })
    })
  } catch {}

  return { ok: true }
}


