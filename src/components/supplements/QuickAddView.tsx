'use client'

import React, { useState } from 'react'
import CalendarPicker from './CalendarPicker'

export default function QuickAddView({
  onCancel,
  onSubmit
}: {
  onCancel: () => void
  onSubmit: (p: {
    name: string
    startRaw: string
    stillTaking: boolean
    endRaw?: string
    dose?: string | null
    fastRaw?: string | null
  }) => void
}) {
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [active, setActive] = useState(true)
  const [dose, setDose] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [fastAdd, setFastAdd] = useState('')

  function submit() {
    if (fastAdd.trim()) {
      onSubmit({
        name,
        startRaw: '',
        stillTaking: true,
        dose: '',
        fastRaw: fastAdd
      })
      return
    }
    if (!name.trim()) {
      alert('Enter supplement name')
      return
    }
    // Start date is optional in new flow
    let startRaw = start
    if (startDate) startRaw = startDate.toISOString().slice(0, 10)
    onSubmit({
      name,
      startRaw,
      stillTaking: active,
      endRaw: active ? undefined : (endDate ? endDate.toISOString().slice(0, 10) : end),
      dose: dose || undefined
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧬</span>
          <h2 className="text-2xl font-bold text-gray-900">Add Supplement</h2>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fast Add (optional)</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder='e.g., "Magnesium 400mg since Jan 15 (paused Apr 3–May 1)"'
            value={fastAdd}
            onChange={(e) => setFastAdd(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">If you use Fast Add, fields below are ignored</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">or</span></div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supplement name *</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Magnesium"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!fastAdd}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Started when? (optional)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CalendarPicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              maxDate={new Date()}
              className="w-full"
            />
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Or type: Jan 15 / last Monday / 2 weeks ago"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              disabled={!!fastAdd}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Still taking it?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActive(true)}
              disabled={!!fastAdd}
              className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                active ? 'bg-green-500 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setActive(false)}
              disabled={!!fastAdd}
              className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                !active ? 'bg-gray-700 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {!active && !fastAdd && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ended when?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CalendarPicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                maxDate={new Date()}
                className="w-full"
              />
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Or type: Apr 10 / yesterday"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-4"
        >
          {showDetails ? '− Hide' : '+'} Add details (dose, notes)
        </button>

        {showDetails && !fastAdd && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dose (optional)</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="400mg citrate"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <button onClick={onCancel} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
        <button onClick={submit} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/50">Add →</button>
      </div>
      <p className="mt-4 text-xs text-center text-gray-500">You can edit periods anytime</p>
    </div>
  )
}


