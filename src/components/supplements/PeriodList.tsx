'use client'

import React from 'react'

export type Period = {
  id: string
  start_date: string
  end_date: string | null
  dose?: string | null
  notes?: string | null
}

export default function PeriodList({
  periods,
  onEdit
}: {
  periods: Period[]
  onEdit: (period: Period) => void
}) {
  const sorted = [...(periods || [])].sort((a, b) => {
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  })

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : 'Present')
  const durationDays = (p: Period) => {
    const start = new Date(p.start_date)
    const end = p.end_date ? new Date(p.end_date) : new Date()
    const ms = end.getTime() - start.getTime()
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
  }

  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-medium text-zinc-700">Usage History</h4>
      {sorted.length === 0 && (
        <p className="text-sm text-zinc-500 italic">No periods recorded yet.</p>
      )}
      <div className="space-y-2">
        {sorted.map((p) => {
          const active = !p.end_date
          return (
            <button
              key={p.id}
              onClick={() => onEdit(p)}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-left hover:border-zinc-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-block h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-zinc-400'}`} />
                  <span className="text-sm font-medium truncate">
                    {formatDate(p.start_date)} – {formatDate(p.end_date)}
                  </span>
                  <span className="text-xs text-zinc-500">({durationDays(p)} days)</span>
                </div>
                {p.dose && <span className="text-xs text-zinc-600 break-words">Dose: {p.dose}</span>}
              </div>
              {p.notes && <div className="mt-1 text-xs italic text-zinc-500">“{p.notes}”</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}


