import React from 'react'

type Segment = 'supplements' | 'wearable' | 'dashboard'

export default function OnboardingProgressBar({ active }: { active: Segment }) {
  const segs: Array<{ key: Segment; label: string }> = [
    { key: 'supplements', label: 'SUPPLEMENTS' },
    { key: 'wearable', label: 'WEARABLE' },
    { key: 'dashboard', label: 'DASHBOARD' },
  ]

  const idx = segs.findIndex(s => s.key === active)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {segs.map((s, i) => (
          <div key={s.key} className={i <= idx ? 'text-slate-700' : 'text-slate-400'}>
            {s.label}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {segs.map((s, i) => {
          const isDoneOrActive = i <= idx
          return (
            <div
              key={s.key}
              className={`h-1.5 rounded-full ${isDoneOrActive ? 'bg-slate-900' : 'bg-slate-200'}`}
            />
          )
        })}
      </div>
    </div>
  )
}

