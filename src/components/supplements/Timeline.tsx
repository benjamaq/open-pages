'use client'

import React, { useMemo, useRef, useState } from 'react'
import type { SupplementPeriod } from '@/types/supplements'
import { toISO } from '@/utils/periods'

type Props = {
  periods: SupplementPeriod[]
  onChange: (p: SupplementPeriod[]) => void
}

const DAY_MS = 24 * 60 * 60 * 1000

export default function Timeline({ periods, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const bounds = useMemo(() => {
    if (periods.length === 0) {
      const today = new Date()
      const start = new Date(today)
      start.setMonth(start.getMonth() - 3)
      return { min: start, max: today }
    }
    const dates = periods.flatMap((p) => [p.startDate, p.endDate ?? toISO(new Date())])
    const min = new Date(dates.reduce((a, b) => (a < b ? a : b)))
    const max = new Date(dates.reduce((a, b) => (a > b ? a : b)))
    min.setDate(min.getDate() - 7)
    max.setDate(max.getDate() + 7)
    return { min, max }
  }, [periods])

  const totalDays = Math.max(1, Math.round((+bounds.max - +bounds.min) / DAY_MS))
  const dayToPx = (width: number) => (width - 32) / totalDays

  function dateToX(dateISO: string, width: number) {
    const d = new Date(dateISO + 'T00:00:00')
    const offset = Math.round((+d - +bounds.min) / DAY_MS)
    return 16 + offset * dayToPx(width)
  }

  function xToDate(x: number, width: number): string {
    const clamped = Math.max(16, Math.min(width - 16, x))
    const days = Math.round((clamped - 16) / dayToPx(width))
    const d = new Date(bounds.min)
    d.setDate(bounds.min.getDate() + days)
    return toISO(d)
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">📊 Usage Timeline</div>
        <div className="text-xs text-gray-500">{bounds.min.toLocaleDateString()} — {bounds.max.toLocaleDateString()}</div>
      </div>
      {/* Month labels */}
      <MonthLabels min={bounds.min} max={bounds.max} />
      <div ref={containerRef} className="relative h-24 w-full bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="absolute inset-x-4 top-1/2 h-px bg-gray-300" />
        <TodayMarker bounds={bounds} dateToX={dateToX} />
        <Bars />
      </div>
      {periods.length === 0 && <p className="mt-3 text-sm text-gray-500 text-center">Add your first period to see the timeline</p>}
    </div>
  )

  function MonthLabels({ min, max }: { min: Date; max: Date }) {
    if (!containerRef.current) {
      return <div className="h-5 mb-1" />
    }
    const months: { label: string; x: number }[] = []
    const width = containerRef.current.clientWidth
    const d = new Date(min)
    d.setDate(1)
    while (d <= max) {
      const iso = toISO(d)
      months.push({
        label: d.toLocaleString(undefined, { month: 'short' }),
        x: dateToX(iso, width)
      })
      d.setMonth(d.getMonth() + 1)
    }
    return (
      <div className="relative h-5 mb-1">
        {months.map((m, i) => (
          <div key={i} className="absolute -translate-x-1/2 text-[10px] text-gray-500" style={{ left: m.x }}>
            {m.label}
          </div>
        ))}
      </div>
    )
  }

  function TodayMarker({ bounds, dateToX }: { bounds: { min: Date; max: Date }, dateToX: (iso: string, width: number) => number }) {
    if (!containerRef.current) return null
    const today = new Date()
    if (today < bounds.min || today > bounds.max) return null
    const width = containerRef.current.clientWidth
    const todayX = dateToX(toISO(today), width)
    return (
      <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: todayX }}>
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>
    )
  }

  function Bars() {
    const [drag, setDrag] = useState<{ id: string; edge: 'start' | 'end' } | null>(null)

    function onMouseDown(e: React.MouseEvent, id: string, edge: 'start' | 'end') {
      e.preventDefault()
      setDrag({ id, edge })
    }
    function onMouseUp() {
      setDrag(null)
    }
    function onMouseMove(e: React.MouseEvent) {
      if (!drag || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const iso = xToDate(x, rect.width)
      const idx = periods.findIndex((p) => p.id === drag.id)
      if (idx < 0) return
      const next = [...periods]
      const p = { ...next[idx] }
      if (drag.edge === 'start') p.startDate = iso
      else p.endDate = iso
      next[idx] = p
      onChange(next)
    }
    return (
      <div className="absolute inset-0" onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        {periods.map((p) => {
          if (!containerRef.current) return null
          const width = containerRef.current.clientWidth
          const x1 = dateToX(p.startDate, width)
          const x2 = dateToX(p.endDate ?? toISO(new Date()), width)
          const left = Math.min(x1, x2)
          const barWidth = Math.max(6, Math.abs(x2 - x1))
          const isActive = !p.endDate
          return (
            <div key={p.id} className="absolute top-6 h-12" style={{ left, width: barWidth }}>
              <div className={`h-full w-full rounded-md relative ${isActive ? 'bg-green-500 border-2 border-green-600' : 'bg-gray-400 border-2 border-gray-500'}`}>
                <div className="absolute left-0 top-0 h-full w-3 bg-opacity-80 bg-gray-800 cursor-ew-resize hover:bg-opacity-100" onMouseDown={(e) => onMouseDown(e, p.id, 'start')} />
                <div className="absolute right-0 top-0 h-full w-3 bg-opacity-80 bg-gray-800 cursor-ew-resize hover:bg-opacity-100" onMouseDown={(e) => onMouseDown(e, p.id, 'end')} />
                {barWidth > 80 && p.dose && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">{p.dose}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
}


