'use client'

type Props = {
  id: string
  name: string
  day: number
  targetDays: number
  effectPct?: number | null
  confidence?: number | null
  onOpen: (id: string) => void
}

export default function ExperimentMiniCard({
  id,
  name,
  day,
  targetDays,
  effectPct,
  confidence,
  onOpen
}: Props) {
  return (
    <button
      onClick={() => onOpen(id)}
      className="w-full text-left rounded-xl border bg-white p-4 hover:bg-neutral-50 transition"
      data-testid="exp-mini"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{name || '7-day test'}</div>
        <div className="text-xs text-neutral-500">Day {day}/{targetDays}</div>
      </div>
      <div className="mt-2 text-xs text-neutral-700">
        {typeof effectPct === 'number' ? `Δ ${effectPct > 0 ? '+' : ''}${effectPct}%` : 'Δ —'}
        {typeof confidence === 'number' ? ` · Conf ${confidence}%` : ''}
      </div>
    </button>
  )
}


