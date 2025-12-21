'use client'

import React, { useRef, useState } from 'react'

type Source = 'whoop' | 'oura' | 'apple'

export default function DataUpload({
  isOpen,
  onContinue
}: {
  isOpen: boolean
  onContinue: () => void
}) {
  const [source, setSource] = useState<Source | null>(null)
  const [parsing, setParsing] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  if (!isOpen) return null

  const handlePick = (s: Source) => setSource(s)
  const handleFile = async (file?: File | null) => {
    if (!file) return
    setParsing(true)
    try {
      // Placeholder parse — real parsing in lib/csvParser.ts (Phase 2)
      await new Promise((r) => setTimeout(r, 1200))
    } finally {
      setParsing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-zinc-900">Upload Your Data (Optional)</h2>
        <p className="mt-2 text-zinc-600">
          Have 3–12 months of data from Whoop, Oura, or Apple Health? Upload it for instant Day 1 insights.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePick('whoop')}
            className="rounded-md border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50"
          >
            📊 Upload Whoop CSV
          </button>
          <button
            onClick={() => handlePick('oura')}
            className="rounded-md border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50"
          >
            💍 Upload Oura CSV
          </button>
          <button
            onClick={() => handlePick('apple')}
            className="rounded-md border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50"
          >
            🍎 Upload Apple Health CSV
          </button>
          <button
            onClick={onContinue}
            className="rounded-md border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50"
          >
            Skip for now
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={!source}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Choose CSV…
          </button>
          {parsing && <span className="text-sm text-zinc-600">Analyzing your data…</span>}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onContinue}
            className="inline-flex items-center rounded-md border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  )
}


