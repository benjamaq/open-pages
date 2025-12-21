'use client'

import React from 'react'

export default function Welcome({
  isOpen,
  onContinue,
  userName = 'there'
}: {
  isOpen: boolean
  onContinue: () => void
  userName?: string
}) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <span>🔬</span>
            <span>Elli</span>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">Hey {userName}, I&apos;m Elli.</h2>
        <p className="mt-2 text-zinc-600">
          I help biohackers figure out which supplements and protocols actually work — not what works in studies,
          but what works for you.
        </p>
        <p className="mt-2 text-zinc-600">Let&apos;s start by analyzing what you&apos;re already doing.</p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onContinue}
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800"
          >
            Let&apos;s Go →
          </button>
        </div>
      </div>
    </div>
  )
}


