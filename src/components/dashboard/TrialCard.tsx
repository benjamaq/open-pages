'use client'

import React from 'react'

export default function TrialCard({
  title,
  day,
  total,
  progress,
  confidence,
  instruction,
  metric
}: {
  title: string
  day: number
  total: number
  progress: number
  confidence: number
  instruction?: string
  metric?: string
}) {
  const phase =
    day <= 1 ? 'early' : day < total - 1 ? 'mid' : 'final'
  const copy =
    phase === 'early'
      ? 'Day 1 – Tracking baseline.'
      : phase === 'mid'
      ? 'Skip today – control day.'
      : 'Trial ends tomorrow – one more check-in.'
  const cta =
    phase === 'mid' ? 'End / Extend' : phase === 'final' ? 'End Trial' : undefined
  return (
    <div className="rounded-xl border border-purple-300 bg-purple-50 p-4 animate-pulse-slow">
      <div className="text-sm font-semibold text-purple-700">{title}</div>
      <div className="text-xs text-purple-700/80 mb-2">Day {day}/{total} · Conf {Math.round(confidence * 100)}%</div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
      </div>
      {metric && <div className="text-xs font-medium text-purple-800 mb-1">{metric}</div>}
      <div className="text-xs text-purple-800 mb-2">{instruction || copy}</div>
      {cta && (
        <div className="flex items-center gap-2">
          <button className="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-xs hover:bg-purple-700">{cta}</button>
        </div>
      )}
    </div>
  )
}


