'use client'

import React, { useEffect, useState } from 'react'

export type Period = {
  id?: string
  start_date: string
  end_date: string | null
  dose?: string | null
  notes?: string | null
}

export default function PeriodModal({
  open,
  period,
  onClose,
  onSave,
  onDelete
}: {
  open: boolean
  period?: Period | null
  onClose: () => void
  onSave: (data: Period) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void
}) {
  const [startDate, setStartDate] = useState<string>('')
  const [stillTaking, setStillTaking] = useState<boolean>(true)
  const [endDate, setEndDate] = useState<string>('')
  const [dose, setDose] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (period) {
      setStartDate(period.start_date || '')
      setStillTaking(!period.end_date)
      setEndDate(period.end_date || '')
      setDose(period.dose || '')
      setNotes(period.notes || '')
    } else {
      setStartDate('')
      setStillTaking(true)
      setEndDate('')
      setDose('')
      setNotes('')
    }
    setError('')
  }, [open, period])

  if (!open) return null

  const validate = () => {
    if (!startDate) {
      setError('Start date is required')
      return false
    }
    const today = new Date()
    today.setHours(0,0,0,0)
    const sd = new Date(startDate)
    sd.setHours(0,0,0,0)
    if (sd.getTime() > today.getTime()) {
      setError('Start date cannot be in the future')
      return false
    }
    if (!stillTaking && endDate) {
      const ed = new Date(endDate)
      ed.setHours(0,0,0,0)
      if (ed.getTime() > today.getTime()) {
        setError('End date cannot be in the future')
        return false
      }
      if (ed < sd) {
        setError('End date must be after start date')
        return false
      }
    }
    setError('')
    return true
  }

  const handleSave = async () => {
    if (!validate()) return
    await onSave({
      id: period?.id,
      start_date: startDate,
      end_date: stillTaking ? null : (endDate || null),
      dose: dose || null,
      notes: notes || null
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-zinc-900">{period ? 'Edit Period' : 'Add Period'}</h3>
        {error && <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="still"
              type="checkbox"
              checked={stillTaking}
              onChange={(e) => setStillTaking(e.target.checked)}
              className="accent-zinc-900"
            />
            <label htmlFor="still" className="text-sm text-zinc-800">I&apos;m still taking this</label>
          </div>

          {!stillTaking && (
            <div>
              <label className="block text-sm font-medium text-zinc-900 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
                max={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border border-zinc-300 px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Dose (optional)</label>
            <input
              type="text"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g., 400mg, 2 capsules"
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-zinc-300 px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {period?.id && onDelete && (
            <button
              onClick={() => period?.id && onDelete(period.id!)}
              className="rounded-md border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={onClose} className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-800 hover:bg-zinc-50">Cancel</button>
            <button onClick={handleSave} className="rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}


