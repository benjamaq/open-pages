export function computeSignal(cleanDays: number, required: number = 12): number {
  const r = Math.max(1, Math.floor(required))
  const pct = (Number(cleanDays) / r) * 100
  if (!Number.isFinite(pct)) return 0
  return Math.max(0, Math.min(100, Math.floor(pct)))
}


