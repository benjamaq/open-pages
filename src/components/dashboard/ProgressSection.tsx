'use client'

export function ProgressSection({ daysCompleted, targetDays }: { daysCompleted: number; targetDays: number }) {
  const pct = Math.max(0, Math.min(100, Math.round((daysCompleted / Math.max(1, targetDays)) * 100)))
  const remain = Math.max(0, targetDays - daysCompleted)
  let msg = ''
  if (daysCompleted <= 2) msg = `${remain} more day${remain !== 1 ? 's' : ''} until your first insights`
  else if (daysCompleted < 5) msg = `You’re almost halfway there`
  else if (daysCompleted === 6) msg = `Just 1 more day until insights!`
  else msg = `Your insights are ready!`
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-semibold text-slate-900 mb-3">YOUR PROGRESS</div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-sm text-slate-700">Day {Math.min(daysCompleted, targetDays)} of {targetDays}</div>
      <div className="text-xs text-slate-500 mt-1">{msg}</div>
    </div>
  )
}




