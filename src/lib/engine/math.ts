export const MOOD_VAL = { low: -1, ok: 0, sharp: 1 } as const

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return xs.reduce((s, v) => s + (v - m) * (v - m), 0) / (xs.length - 1)
}

export function stddev(xs: number[]): number {
  return Math.sqrt(variance(xs))
}

// Cohen's d (pooled standard deviation)
export function cohensD(treated: number[], control: number[]): number {
  const mt = mean(treated)
  const mc = mean(control)
  const st = stddev(treated)
  const sc = stddev(control)
  const pooled = Math.sqrt(((treated.length - 1) * st * st + (control.length - 1) * sc * sc) / Math.max(1, treated.length + control.length - 2))
  if (!isFinite(pooled) || pooled === 0) return 0
  return (mt - mc) / pooled
}

export function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function deltaToEffectPct(deltaMoodUnits: number) {
  // map mood delta in [-2..2] to percentage
  return Math.round(clamp((deltaMoodUnits / 2) * 100, -100, 100))
}

// Simple weekly block generator for bootstrap
export function weeklyBlocks(len: number): number[][] {
  const blocks: number[][] = []
  let i = 0
  while (i < len) {
    const block: number[] = []
    for (let k = 0; k < 7 && i < len; k++, i++) block.push(i)
    blocks.push(block)
  }
  return blocks.length ? blocks : [[0]]
}

export function bootstrapSignConfidence(treated: number[], control: number[], blocks: number[][], iters = 800) {
  if (treated.length < 2 || control.length < 2) return 0
  const observed = mean(treated) - mean(control)
  const obsSign = Math.sign(observed) || 1
  let same = 0
  for (let i = 0; i < iters; i++) {
    const t: number[] = []
    const c: number[] = []
    for (const block of blocks) {
      const pick = blocks[Math.floor(Math.random() * blocks.length)]
      for (const idx of pick) {
        if (idx < treated.length) t.push(treated[idx])
        if (idx < control.length) c.push(control[idx])
      }
    }
    const d = mean(t) - mean(c)
    if ((Math.sign(d) || 1) === obsSign) same++
  }
  return Math.round((same / iters) * 100)
}


