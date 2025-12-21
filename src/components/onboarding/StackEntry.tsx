'use client'

import React, { useState } from 'react'

type StackItem = {
  id: string
  name: string
  start_date?: string
}

const QUICK_ADD = ['Magnesium', 'Vitamin D', 'Omega-3', 'Creatine', 'Ashwagandha', 'NMN', 'Cold Plunge', 'Sauna']

export default function StackEntry({
  isOpen,
  onContinue
}: {
  isOpen: boolean
  onContinue: (stack: StackItem[]) => void
}) {
  const [stack, setStack] = useState<StackItem[]>([])
  const [customName, setCustomName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const addItem = (name: string) => {
    setStack((s) => [...s, { id: Math.random().toString(36).slice(2), name }])
  }
  const updateStartDate = (id: string, date: string) => {
    setStack((s) => s.map((it) => (it.id === id ? { ...it, start_date: date } : it)))
  }
  const addCustom = () => {
    if (!customName.trim()) return
    addItem(customName.trim())
    setCustomName('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">What&apos;s in your current stack?</h2>
        <p className="mt-2 text-zinc-600">List supplements, protocols, or habits you&apos;re testing. Most important: WHEN did you start each?</p>
        {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_ADD.map((item) => (
            <button
              key={item}
              onClick={() => addItem(item)}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {stack.map((it) => (
            <div key={it.id} className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium text-zinc-900">{it.name}</div>
              <label className="text-sm text-zinc-700">
                <span className="mr-2">Started when?</span>
                <input
                  type="date"
                  value={it.start_date || ''}
                  onChange={(e) => updateStartDate(it.id, e.target.value)}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                  required
                />
              </label>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Add custom"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2"
          />
          <button onClick={addCustom} className="rounded-md border border-zinc-300 px-3 py-2 hover:bg-zinc-50">
            + Add
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          {saving ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /> Saving…
            </div>
          ) : (
            <button
              onClick={async () => {
                setError('')
                setSaving(true)
                try {
                  // Create each supplement, then create its initial period
                  for (const it of stack) {
                    if (!it.start_date) continue
                    const createRes = await fetch('/api/stack-items', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: it.name,
                        dose: null,
                        item_type: 'supplements',
                        frequency: 'daily'
                      })
                    })
                    const createJson = await createRes.json()
                    if (!createRes.ok) throw new Error(createJson?.error || 'Failed to add supplement')
                    const newItemId = createJson?.data?.id
                    if (newItemId) {
                      const periodRes = await fetch(`/api/supplements/${encodeURIComponent(newItemId)}/periods`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          start_date: it.start_date,
                          end_date: null
                        })
                      })
                      if (!periodRes.ok) {
                        const pj = await periodRes.json().catch(() => ({}))
                        throw new Error(pj?.error || 'Failed to create initial period')
                      }
                    }
                  }
                  onContinue(stack)
                } catch (e: any) {
                  setError(e?.message || 'Failed to save your stack')
                } finally {
                  setSaving(false)
                }
              }}
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


