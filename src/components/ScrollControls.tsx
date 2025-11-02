'use client'

import React from 'react'

export default function ScrollControls({ targetId }: { targetId: string }) {
  const scroll = (delta: number) => {
    const el = document.getElementById(targetId)
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <button
        aria-label="Scroll left"
        className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
        onClick={() => scroll(-600)}
      >
        {'<'}
      </button>
      <button
        aria-label="Scroll right"
        className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30"
        onClick={() => scroll(600)}
      >
        {'>'}
      </button>
    </div>
  )
}


