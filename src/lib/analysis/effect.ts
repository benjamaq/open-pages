type Series = number[]

function mean(arr: Series): number {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function variance(arr: Series, m?: number): number {
  if (arr.length <= 1) return 0
  const mu = m ?? mean(arr)
  const sse = arr.reduce((sum, x) => sum + (x - mu) * (x - mu), 0)
  return sse / (arr.length - 1)
}

function pooledStd(a: Series, b: Series): number {
  if (a.length <= 1 && b.length <= 1) return 1
  const va = variance(a)
  const vb = variance(b)
  return Math.sqrt(((a.length - 1) * va + (b.length - 1) * vb) / Math.max(1, a.length + b.length - 2))
}

export function cohenD(onVals: Series, offVals: Series): number {
  if (!onVals.length || !offVals.length) return 0
  const muOn = mean(onVals)
  const muOff = mean(offVals)
  const sp = pooledStd(onVals, offVals) || 1
  return (muOn - muOff) / sp
}

export function bootstrapConfidence(onVals: Series, offVals: Series, samples = 500): number {
  if (!onVals.length || !offVals.length) return 0
  const ds: number[] = []
  for (let i = 0; i < samples; i++) {
    const resample = (arr: Series) => {
      const out: number[] = []
      for (let j = 0; j < arr.length; j++) out.push(arr[Math.floor(Math.random() * arr.length)])
      return out
    }
    const rsOn = resample(onVals)
    const rsOff = resample(offVals)
    ds.push(cohenD(rsOn, rsOff))
  }
  // Confidence ~ fraction of bootstrap samples with same direction as point estimate
  const dHat = cohenD(onVals, offVals)
  if (dHat === 0) return 0
  const sameDir = ds.filter(d => (dHat > 0 ? d > 0 : d < 0)).length
  return sameDir / ds.length
}

export function prePostEffect(pre: Series, post: Series) {
  if (!pre.length || !post.length) return { delta: 0, direction: 'neutral' as const }
  const muPre = mean(pre)
  const muPost = mean(post)
  const delta = muPost - muPre
  const direction = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral'
  return { delta, direction }
}

export function simpleSlope(arr: Series): number {
  // Least squares slope with x = 0..n-1
  const n = arr.length
  if (n < 2) return 0
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += arr[i]
    sumXY += i * arr[i]
    sumXX += i * i
  }
  const denom = n * sumXX - sumX * sumX
  if (denom === 0) return 0
  const slope = (n * sumXY - sumX * sumY) / denom
  return slope
}

export function trendBreak(before: Series, after: Series) {
  const s1 = simpleSlope(before)
  const s2 = simpleSlope(after)
  return { slopeBefore: s1, slopeAfter: s2, delta: s2 - s1 }
}


