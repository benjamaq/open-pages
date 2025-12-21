'use client'

export function WearableQuestion({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Do you use a wearable or health app?</h1>
      <p className="text-slate-600">This is optional. BioStackr works with or without one.</p>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button className="h-12 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800" onClick={onYes}>
          Yes — I use one
        </button>
        <button className="h-12 rounded-full bg-white ring-1 ring-slate-200 text-slate-900 font-semibold hover:bg-slate-50" onClick={onNo}>
          No — I don’t use one
        </button>
      </div>
    </div>
  )
}


