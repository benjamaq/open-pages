export type ConfidenceRingProps = {
  size?: number
  confidence: number
  effectPct?: number | null
  status?: 'testing' | 'confirmed' | 'no_effect' | 'insufficient'
  ariaLabel?: string
}

export function ConfidenceRing({
  size = 40,
  confidence,
  effectPct,
  status = 'testing',
  ariaLabel
}: ConfidenceRingProps) {
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, Math.round(confidence)))
  const dash = (pct / 100) * c

  const color =
    status === 'confirmed' ? 'stroke-emerald-500'
    : status === 'testing' ? 'stroke-amber-500'
    : status === 'no_effect' ? 'stroke-zinc-400'
    : 'stroke-zinc-300'

  return (
    <div className="relative inline-flex items-center" aria-label={ariaLabel}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} className="stroke-zinc-200" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r} strokeWidth={stroke} fill="none"
          className={`${color} transition-all duration-500 ease-out`}
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-medium text-zinc-700">
        {pct}%
      </span>
      {status === 'confirmed' && (
        <span className="absolute inset-0 rounded-full ring-2 ring-emerald-200/40 animate-pulse-slow" />
      )}
    </div>
  )
}


