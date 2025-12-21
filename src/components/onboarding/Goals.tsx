'use client'

import React, { useState } from 'react'

const GOALS = [
  { id: 'sleep', label: 'Sleep', icon: '🌙' },
  { id: 'energy', label: 'Energy', icon: '⚡' },
  { id: 'focus', label: 'Focus', icon: '🧠' },
  { id: 'recovery', label: 'Recovery', icon: '💪' },
  { id: 'mood', label: 'Mood', icon: '😌' }
]

export default function Goals({
  isOpen,
  onContinue
}: {
  isOpen: boolean
  onContinue: (goals: string[]) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  if (!isOpen) return null
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 2 ? [...s, id] : s
    )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">What are you optimizing?</h2>
        <p className="mt-2 text-zinc-600">Pick your top 1–2 targets. We&apos;ll focus analysis there first.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const active = selected.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  active ? 'bg-zinc-900 text-white' : 'border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className="mr-1">{g.icon}</span>
                {g.label}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onContinue(selected)}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
            disabled={selected.length === 0}
          >
            Start Analysis →
          </button>
        </div>
      </div>
    </div>
  )
}


