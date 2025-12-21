'use client'

import { useState } from 'react'

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label="Info"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] text-slate-600 hover:bg-slate-100"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span className="absolute left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-pre rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow">
          {text}
        </span>
      )}
    </span>
  )
}


