'use client'

import React, { useState } from 'react'
import CalendarPicker from './CalendarPicker'
import { validatePeriods } from '@/utils/periods'

type UiPeriod = {
  id: string
  startDate: Date
  endDate: Date | null
}

type SaveCallbacks = {
  // Create supplement with first period
  onCreate: (payload: {
    name: string
    startDate: string
    endDate: string | null
    dose?: string | null
  }) => Promise<{ supplementId: string }>
  // (Optional) replace periods; if not provided, component will POST additional periods itself
  onReplacePeriods?: (supplementId: string, periods: { id: string; supplementId: string; startDate: string; endDate: string | null }[]) => Promise<void>
}

export default function AddSupplementModal({
  open,
  onClose,
  save
}: {
  open: boolean
  onClose: () => void
  save: SaveCallbacks
}) {
  console.log('✅ DETAILED ADD MODAL LOADED')
  const [name, setName] = useState('')
  const [dose, setDose] = useState('')
  const [showDose, setShowDose] = useState(false)
  const [periods, setPeriods] = useState<UiPeriod[]>([
    { id: crypto.randomUUID(), startDate: new Date(), endDate: null }
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const uiToServer = (supplementId: string) =>
    periods.map(p => ({
      id: p.id,
      supplementId,
      startDate: toISO(p.startDate),
      endDate: p.endDate ? toISO(p.endDate) : null
    }))

  function addPeriod() {
    setPeriods(prev => [...prev, { id: crypto.randomUUID(), startDate: new Date(), endDate: null }])
  }
  function updatePeriod(id: string, key: 'start' | 'end', value: Date | null) {
    setPeriods(prev => prev.map(p => p.id === id ? { ...p, startDate: key === 'start' ? (value as Date) : p.startDate, endDate: key === 'end' ? value : p.endDate } : p))
    setError(null)
  }
  function deletePeriod(id: string) {
    if (periods.length === 1) {
      setError('Need at least one period')
      return
    }
    setPeriods(prev => prev.filter(p => p.id !== id))
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Enter supplement name')
      return
    }
    // Validate overlaps and single active
    const synthetic = periods.map<{
      id: string; supplementId: string; startDate: string; endDate: string | null; dose?: string | null; notes?: string | null
    }>(p => ({
      id: p.id,
      supplementId: 'temp',
      startDate: toISO(p.startDate),
      endDate: p.endDate ? toISO(p.endDate) : null,
      dose: dose || undefined,
      notes: null
    }))
    const v = validatePeriods(synthetic as any)
    if (!v.ok) {
      setError(v.message)
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const first = synthetic[0]
      if (save && typeof save.onCreate === 'function') {
        // Use provided callback path
        const create = await save.onCreate({
          name: name.trim(),
          startDate: first.startDate,
          endDate: first.endDate,
          dose: dose || undefined
        })
        const supplementId = create.supplementId
        const rest = synthetic.slice(1)
        if (rest.length > 0) {
          if (save.onReplacePeriods) {
            await save.onReplacePeriods(supplementId, rest.map(p => ({ ...p, supplementId })))
          } else {
            for (const p of rest) {
              await fetch(`/api/supplements/${encodeURIComponent(supplementId)}/periods`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  startDate: p.startDate,
                  endDate: p.endDate,
                  dose: dose || null
                })
              })
            }
          }
        }
      } else {
        // Fallback: direct API calls so Save works even if no callbacks wired
        const res = await fetch('/api/supplements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() })
        })
        const created = await res.json().catch(() => ({}))
        if (!res.ok || !created?.id) {
          throw new Error((created && created.error) || 'Failed to create supplement')
        }
        const supplementId = created.id as string
        for (const p of synthetic) {
          await fetch(`/api/supplements/${encodeURIComponent(supplementId)}/periods`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: p.startDate,
              endDate: p.endDate,
              dose: p.dose || null
            })
          })
        }
      }
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-8 py-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Add Supplement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Supplement name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Magnesium"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Mini timeline */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Usage Timeline</h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <MiniTimeline periods={periods} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Usage Periods</h3>
            <div className="space-y-3">
              {periods.map((p, idx) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Started</label>
                      <CalendarPicker
                        selected={p.startDate}
                        onChange={(d) => updatePeriod(p.id, 'start', d)}
                        maxDate={p.endDate || new Date()}
                        className="w-full"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stopped</label>
                      <CalendarPicker
                        selected={p.endDate}
                        onChange={(d) => updatePeriod(p.id, 'end', d)}
                        maxDate={new Date()}
                        className="w-full"
                      />
                      {!p.endDate && <div className="mt-1 text-xs text-gray-500">Leave empty for Ongoing</div>}
                    </div>
                    <button
                      onClick={() => deletePeriod(p.id)}
                      disabled={periods.length <= 1}
                      className="mt-5 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title={periods.length > 1 ? 'Delete period' : 'Need at least one period'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addPeriod}
              className="mt-4 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-medium hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              + Add another period
            </button>
          </div>

          <div>
            <button onClick={() => setShowDose(!showDose)} className="text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2">
              {showDose ? '− Hide' : '+'} Optional: Add dose
            </button>
            {showDose && (
              <input
                type="text"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="e.g., 400mg citrate, 2 capsules"
                className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-8 py-6 flex justify-between">
          <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function toISO(d: Date) {
  const dd = new Date(d)
  return dd.toISOString().slice(0, 10)
}

function MiniTimeline({ periods }: { periods: UiPeriod[] }) {
  if (periods.length === 0) return null
  const today = new Date()
  const sixMonthsAgo = new Date(today)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const allDates = periods.flatMap(p => [p.startDate, p.endDate || today])
  const earliest = new Date(Math.min(...allDates.map(d => d.getTime())))
  const rangeStart = earliest < sixMonthsAgo ? earliest : sixMonthsAgo
  const totalDays = Math.max(1, Math.ceil((today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)))
  const months: Date[] = []
  const cur = new Date(rangeStart)
  cur.setDate(1)
  while (cur <= today) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
        {months.map((m, i) => <span key={i}>{m.toLocaleDateString(undefined, { month: 'short' })}</span>)}
      </div>
      <div className="relative h-10 bg-gray-100 rounded-lg">
        {periods.map((p, i) => {
          const start = p.startDate
          const end = p.endDate || today
          const startDays = Math.max(0, Math.ceil((start.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)))
          const dur = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          const left = (startDays / totalDays) * 100
          const width = (dur / totalDays) * 100
          return (
            <div
              key={i}
              className="absolute top-1 bottom-1 rounded bg-green-600"
              style={{ left: `${Math.min(100, left)}%`, width: `${Math.max(0, Math.min(100 - left, width))}%` }}
            />
          )
        })}
        <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-red-500">
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
      </div>
      <div className="text-xs text-gray-500 text-right mt-1">Today ↑</div>
    </div>
  )
}


