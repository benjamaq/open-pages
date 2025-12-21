'use client'

import React, { useState } from 'react'
import SupplementCard from './SupplementCard'

export default function RulesPanel({
  supplements
}: {
  supplements: Array<any>
}) {
  const [open, setOpen] = useState(true)
  const visible = supplements.slice(0, 5)
  if (typeof window !== 'undefined') {
    console.log('🟩 RulesPanel rendering:', visible.map(s => s.name))
  }
  return (
    <section className="max-w-7xl mx-auto px-4 mt-6">
      <div className className="rounded-xl border border-green-300 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-green-800">Rules (Proven)</div>
          <button
            className="text-green-800 text-sm"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
          >
            {open ? 'Hide' : 'Show'}
          </button>
        </div>
        {open && (
          <>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visible.map(s => (
                <div key={s.id}>
                  <SupplementCard supplement={s} />
                </div>
              ))}
            </div>
            {supplements.length > 5 && (
              <div className="mt-3 flex justify-end">
                <button className="rounded-lg border border-green-300 bg-white text-green-800 px-3 py-1.5 text-xs hover:bg-green-100">
                  View All Rules
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}


