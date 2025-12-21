'use client'

import React from 'react'
import type { SupplementPeriod } from '@/types/supplements'
import Timeline from './Timeline'

export default function DetailsView({
  supplementName,
  periods,
  onChange,
  onBack,
  onDone
}: {
  supplementName: string
  periods: SupplementPeriod[]
  onChange: (p: SupplementPeriod[]) => void
  onBack: () => void
  onDone: () => void
}) {
  function addPeriod() {
    const today = new Date().toISOString().slice(0, 10)
    onChange([
      ...periods,
      {
        id: crypto.randomUUID(),
        supplementId: periods[0]?.supplementId || 'temp',
        startDate: today,
        endDate: null,
        dose: null,
        notes: null
      }
    ])
  }

  function endPeriod(idx: number) {
    const today = new Date().toISOString().slice(0, 10)
    const next = [...periods]
    next[idx] = { ...next[idx], endDate: today }
    onChange(next)
  }

  function restartPeriod(idx: number) {
    const today = new Date().toISOString().slice(0, 10)
    const base = periods[idx]
    onChange([
      ...periods,
      {
        ...base,
        id: crypto.randomUUID(),
        startDate: today,
        endDate: null
      }
    ])
  }

  function deletePeriod(idx: number) {
    if (confirm('Delete this period?')) {
      onChange(periods.filter((_, i) => i !== idx))
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{supplementName}</h2>
          <p className="text-sm text-gray-500">Period Manager</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">⚙️</button>
          <button className="p-2 text-gray-400 hover:text-gray-600">🗑️</button>
        </div>
      </div>

      <Timeline periods={periods} onChange={onChange} />

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">📝 Active Periods</h3>

        {periods.length === 0 && (
          <p className="text-sm text-gray-500 italic py-4">
            No periods yet. Add your first usage period above.
          </p>
        )}

        <div className="space-y-3">
          {periods.map((p, idx) => (
            <div key={p.id} className="rounded-xl border-2 border-gray-200 p-4 hover:border-gray-300 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="font-medium text-gray-900">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${p.endDate ? 'bg-gray-400' : 'bg-green-500'}`} />
                    {p.startDate} — {p.endDate ?? 'Present'}
                    {p.endDate ? ' (Ended)' : ' (Active)'}
                  </div>
                  {p.dose && <div className="text-sm text-gray-600 mt-1">Dose: {p.dose}</div>}
                  {p.notes && <div className="text-sm text-gray-600 mt-1">Notes: {p.notes}</div>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">Edit dates</button>
                  {p.endDate === null ? (
                    <button onClick={() => endPeriod(idx)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">End period</button>
                  ) : (
                    <button onClick={() => restartPeriod(idx)} className="px-3 py-1.5 rounded-lg border border-green-500 text-green-700 text-sm hover:bg-green-50">Restart today</button>
                  )}
                  <button onClick={() => deletePeriod(idx)} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-sm hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addPeriod}
          className="mt-4 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50"
        >
          + Add another period
        </button>
      </div>

      <div className="flex justify-between mt-8 pt-6 border-t">
        <button onClick={onBack} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50">← Back</button>
        <button onClick={onDone} className="px-8 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800">Done</button>
      </div>
    </div>
  )
}


