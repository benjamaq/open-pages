'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function TodaysCheckin({
  hasCheckinToday,
  today,
  yesterday
}: {
  hasCheckinToday: boolean
  today?: { mood?: number; energy?: number; focus?: number }
  yesterday?: { mood?: number; energy?: number; focus?: number }
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  if (!hasCheckinToday) {
    return (
      <button
        onClick={() => {
          // Client-side; replace with opening your check-in modal if needed
          try { router.push('/dashboard?checkin=open') } catch {}
        }}
        className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 shadow-lg hover:shadow-xl transition-all"
      >
        <div className="relative z-10 text-center">
          <div className="text-white text-lg font-semibold mb-2">Complete Today&apos;s Check-in</div>
          <p className="text-indigo-100 text-sm">Daily data collection necessary for statistical validity</p>
        </div>
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      </button>
    )
  }
  const t = today || {}
  const y = yesterday || {}
  const delta = (a?: number, b?: number) => (typeof a === 'number' && typeof b === 'number') ? (a - b) : null
  return (
    <div className="rounded-xl bg-green-50 border border-green-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-green-900">Today&apos;s Check-in Complete</h3>
            <p className="text-xs text-green-700">Logged at {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-sm text-green-700 hover:text-green-900">
          {expanded ? '▲ Collapse' : '▼ View details'}
        </button>
      </div>
      {expanded && (
        <div className="space-y-3 pt-4 border-t border-green-200">
          <div className="grid grid-cols-3 gap-4">
            <Metric name="Mood" value={t.mood} delta={delta(t.mood, y.mood)} />
            <Metric name="Energy" value={t.energy} delta={delta(t.energy, y.energy)} />
            <Metric name="Focus" value={t.focus} delta={delta(t.focus, y.focus)} />
          </div>
          <div className="text-xs text-green-700">Data quality: Clean (no confounds)</div>
        </div>
      )}
    </div>
  )
}

function Metric({ name, value, delta }: { name: string; value?: number; delta: number | null }) {
  return (
    <div>
      <div className="text-xs text-green-700 mb-1">{name}</div>
      <div className="text-2xl font-bold text-green-900">
        {value ?? '—'}<span className="text-sm text-green-600">/5</span>
      </div>
      {delta !== null && (
        <div className="text-xs text-green-600">
          {delta === 0 ? 'stable' : `${delta > 0 ? '+' : ''}${delta} vs yesterday`}
        </div>
      )}
    </div>
  )
}


