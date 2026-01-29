'use client'

import { Plus } from 'lucide-react'

type Props = {
  onOpen: () => void
  variant?: 'header' | 'fab'
}

export default function AddSupplementButton({ onOpen, variant = 'header' }: Props) {
  if (variant === 'fab') {
    return (
      <button
        aria-label="Add supplement"
        title="Add a new supplement"
        onClick={onOpen}
        className="fixed bottom-4 right-4 md:hidden z-50 w-12 h-12 rounded-full
                   bg-neutral-900 text-white shadow-2xl hover:scale-105 active:scale-95
                   transition-transform"
      >
        <Plus className="w-5 h-5 mx-auto" />
      </button>
    )
  }

  return (
    <button
      onClick={onOpen}
      title="Add a new supplement or peptide"
      className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl
                 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
    >
      <Plus className="w-4 h-4" />
      <span>Add supplement</span>
    </button>
  )
}


