'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react'

export default function CalendarPicker({
  selected,
  onChange,
  maxDate = new Date(),
  placeholder = 'Click to select date',
  className = ''
}: {
  selected: Date | null
  onChange: (d: Date) => void
  maxDate?: Date
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => {
    return selected ? new Date(selected) : new Date()
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const daysGrid = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1)
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const grid: Array<{ date: Date; inMonth: boolean; disabled: boolean }> = []
    const startWeekday = (start.getDay() + 7) % 7 // 0=Sun
    // Fill prev month blanks
    for (let i = 0; i < startWeekday; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() - (startWeekday - i))
      grid.push({ date: d, inMonth: false, disabled: true })
    }
    // This month
    for (let d = 1; d <= end.getDate(); d++) {
      const date = new Date(month.getFullYear(), month.getMonth(), d)
      const disabled = date > maxDate
      grid.push({ date, inMonth: true, disabled })
    }
    // Fill to complete 6 rows
    while (grid.length % 7 !== 0 || grid.length < 42) {
      const last = grid[grid.length - 1].date
      const next = new Date(last)
      next.setDate(next.getDate() + 1)
      grid.push({ date: next, inMonth: false, disabled: true })
    }
    return grid
  }, [month, maxDate])

  const display = selected ? selected.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {display || <span className="text-gray-400">{placeholder}</span>}
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-[18rem] rounded-xl border border-gray-200 bg-white shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="px-2 py-1 rounded-lg hover:bg-gray-100"
              aria-label="Previous month"
            >
              ‹
            </button>
            <div className="text-sm font-semibold">
              {month.toLocaleString(undefined, { month: 'long' })} {month.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40"
              aria-label="Next month"
              disabled={new Date(month.getFullYear(), month.getMonth() + 1, 1) > maxDate}
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map(({ date, inMonth, disabled }, idx) => {
              const isSelected = selected && sameDay(selected, date)
              const isToday = sameDay(new Date(), date)
              const base =
                'h-9 rounded-lg text-sm flex items-center justify-center select-none ' +
                (inMonth ? '' : 'text-gray-300 ')
              const state = disabled
                ? 'opacity-40 cursor-not-allowed'
                : isSelected
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100 cursor-pointer'
              const ring = isToday && !isSelected ? ' ring-1 ring-gray-300' : ''
              return (
                <div
                  key={idx}
                  className={base + state + ring}
                  onClick={() => {
                    if (disabled) return
                    onChange(new Date(date))
                    setOpen(false)
                  }}
                >
                  {date.getDate()}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}


