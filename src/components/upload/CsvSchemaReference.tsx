'use client'

export default function CsvSchemaReference() {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-900">Generic CSV works too</div>
      <div className="bg-white rounded-md border border-slate-200 p-3 text-xs font-mono overflow-auto">
        date, sleep_quality, energy, hrv, resting_hr<br />
        2025-01-15, 8, 7, 55, 58<br />
        2025-01-16, 7, 6, 52, 61
      </div>
      <div className="text-xs text-slate-700">
        <strong>Required:</strong> date, sleep_quality<br />
        <strong>Optional:</strong> energy, HRV, resting HR, mood
      </div>
      <div className="text-xs text-slate-500">More data = stronger signal. Missing fields are okay.</div>
    </div>
  )
}


