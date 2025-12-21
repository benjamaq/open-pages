'use client'

import { useEffect, useMemo, useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isAfter, addMonths, subMonths, getDay } from 'date-fns'

type CheckIn = { date: string; mood: number | null; energy: number | null; focus: number | null }
type DayStatus = 'complete' | 'partial' | 'missed' | 'future'

export function ConsistencyCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const monthStr = format(currentMonth, 'yyyy-MM')
        const res = await fetch(`/api/insights/checkins?month=${encodeURIComponent(monthStr)}`, { cache: 'no-store', credentials: 'include' })
        const json = await res.json()
        if (mounted) setCheckIns(Array.isArray(json) ? json : [])
      } catch {
        if (mounted) setCheckIns([])
      }
    })()
    return () => { mounted = false }
  }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = (getDay(monthStart) + 6) % 7

  const getDayStatus = (date: Date): DayStatus => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (isAfter(date, today)) return 'future'
    const match = checkIns.find(c => isSameDay(new Date(c.date), date))
    if (!match) return 'missed'
    const filled = [match.mood, match.energy, match.focus].filter(v => v != null).length
    return filled === 3 ? 'complete' : 'partial'
  }

  const statusStyles: Record<DayStatus, string> = {
    complete: 'bg-indigo-500 text-white',
    partial: 'bg-indigo-200 text-indigo-700',
    missed: 'bg-red-100 text-red-500',
    future: 'text-gray-300 bg-transparent'
  }

  const { currentStreak, longestStreak, consistency } = useMemo(() => {
    const sortedPastDays = days.filter(d => !isAfter(d, new Date())).sort((a, b) => b.getTime() - a.getTime())
    let currentStreak = 0
    for (const day of sortedPastDays) {
      const s = getDayStatus(day)
      if (s === 'complete' || s === 'partial') currentStreak++
      else break
    }
    let longestStreak = 0
    let temp = 0
    for (const day of [...sortedPastDays].reverse()) {
      const s = getDayStatus(day)
      if (s === 'complete' || s === 'partial') {
        temp++
        longestStreak = Math.max(longestStreak, temp)
      } else {
        temp = 0
      }
    }
    const pastDays = sortedPastDays.length
    const completeDays = sortedPastDays.filter(d => getDayStatus(d) === 'complete').length
    const consistency = pastDays > 0 ? Math.round((completeDays / pastDays) * 100) : 0
    return { currentStreak, longestStreak, consistency }
  }, [days, checkIns])

  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">📅 Your Consistency</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">←</button>
          <span className="font-medium min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">→</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
        {days.map(day => {
          const status = getDayStatus(day)
          return (
            <div key={day.toISOString()} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${statusStyles[status]}`}>
              {format(day, 'd')}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" /> Complete</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-200" /> Partial</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100" /> Future</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-500">🔥 {currentStreak}</div>
          <div className="text-xs text-gray-500 mt-1">Current streak</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-amber-500">🏆 {longestStreak}</div>
          <div className="text-xs text-gray-500 mt-1">Longest streak</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">📊 {consistency}%</div>
          <div className="text-xs text-gray-500 mt-1">This month</div>
        </div>
      </div>
    </section>
  )
}


