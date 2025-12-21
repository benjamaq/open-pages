'use client'

export function CheckinBanner({ time, streakDays }: { time: string; streakDays: number }) {
  const streakMsg = (() => {
    if (streakDays <= 0) return 'First check‑in complete!'
    if (streakDays === 1) return '1 day streak — keep it going!'
    if (streakDays < 7) return `${streakDays} day streak — keep it going!`
    if (streakDays === 7) return '7 day streak — first insights unlocked!'
    return `${streakDays} day streak — you’re on fire!`
  })()
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
      <div className="text-sm text-green-900">
        <span className="mr-2">✓ Checked in today</span>
        <span className="text-green-700">{time}</span>
      </div>
      <div className="text-sm font-medium text-green-800">🔥 {streakMsg}</div>
    </div>
  )
}




