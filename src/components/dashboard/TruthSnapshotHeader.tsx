'use client'

import React from 'react'

export default function TruthSnapshotHeader({
  trials,
  gathering,
  rules,
  savings
}: {
  trials: number
  gathering: number
  rules: number
  savings: number
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 mt-6">
      <div className="mb-6 p-4 rounded-lg border bg-white">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your Truth Snapshot</h2>
        <p className="text-sm text-gray-700">
          🔬 {trials} Trials · {gathering} Gathering Evidence · {rules} Rules Unlocked · ${Math.round(savings)} Saved
        </p>
        <div className="mt-3 h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-400 to-green-500" />
      </div>
    </div>
  )
}


