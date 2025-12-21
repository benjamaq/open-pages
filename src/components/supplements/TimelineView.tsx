'use client'

import React, { useMemo } from 'react'

export type Period = {
  id: string
  start_date: string
  end_date: string | null
  dose?: string | null
}

export default function TimelineView({
  periods,
  onEdit,
  months = 6
}: {
  periods: Period[]
  onEdit: (p: Period) => void
  months?: number
}) {
  const today = new Date()
  const startWindow = new Date(today)
  startWindow.setMonth(startWindow.getMonth() - months)
  startWindow.setHours(0,0,0,0)
  const totalDays = Math.max(1, Math.round((today.getTime() - startWindow.getTime()) / (1000 * 60 * 60 * 24)))
	// Find earliest start date across periods
	const earliestStart: Date | null = useMemo(() => {
		if (!periods || periods.length === 0) return null
		let min: Date | null = null
		for (const p of periods) {
			const d = new Date(p.start_date)
			if (!min || d < min) min = d
		}
		return min
	}, [periods])

  const monthLabels = useMemo(() => {
    const labels: string[] = []
    for (let i = months; i >= 0; i--) {
      const d = new Date(today)
      d.setMonth(d.getMonth() - i)
      labels.push(d.toLocaleString(undefined, { month: 'short' }))
    }
    return labels
  }, [months, today])

  const bars = (periods || []).map(p => {
    const start = new Date(p.start_date)
    const end = p.end_date ? new Date(p.end_date) : today
    const clampedStart = start < startWindow ? startWindow : start
    const clampedEnd = end > today ? today : end
    const startOffsetDays = Math.max(0, Math.round((clampedStart.getTime() - startWindow.getTime()) / (1000 * 60 * 60 * 24)))
    const spanDays = Math.max(1, Math.round((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)))
    const left = (startOffsetDays / totalDays) * 100
    const width = (spanDays / totalDays) * 100
    return {
      id: p.id,
      active: !p.end_date,
      left,
      width,
      dose: p.dose || null,
      start_date: p.start_date,
      end_date: p.end_date
    }
  })

  return (
    <div className="relative rounded-lg border border-zinc-200 bg-zinc-50 p-3">
			{/* If earliest period starts before the visible window, show a start label above timeline */}
			{earliestStart && earliestStart < startWindow && (
				<div className="mb-1 text-xs text-zinc-600">
					Started: {earliestStart.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
				</div>
			)}
      {/* Month headers */}
      <div className="mb-2 flex">
        {monthLabels.map((m, idx) => (
          <div key={`${m}-${idx}`} className="flex-1 text-center text-[10px] text-zinc-500">{m}</div>
        ))}
      </div>

      {/* Timeline rail */}
      <div className="relative h-10 rounded bg-zinc-200">
        {bars.map(b => (
          <button
            key={b.id}
            onClick={() => {
              const p = periods.find(pp => pp.id === b.id)!
              onEdit(p)
            }}
            className={`absolute top-1 bottom-1 rounded border-2 ${b.active ? 'bg-green-500 border-green-600' : 'bg-zinc-400 border-zinc-500'} hover:opacity-90`}
            style={{ left: `${b.left}%`, width: `${b.width}%`, minWidth: 2 }}
            title={`${new Date(b.start_date).toLocaleDateString()} – ${b.end_date ? new Date(b.end_date).toLocaleDateString() : 'Present'}${b.dose ? ` (${b.dose})` : ''}`}
          >
            {b.width > 10 && b.dose && (
              <span className="px-1 text-[10px] font-medium text-white">{b.dose}</span>
            )}
          </button>
        ))}

        {/* Today marker at 100% */}
        <div className="absolute inset-y-0 right-0 w-0.5 bg-blue-500">
          <div className="absolute -top-1 -right-[3px] h-2 w-2 rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  )
}


