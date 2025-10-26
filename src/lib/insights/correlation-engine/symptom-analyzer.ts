import type { DailyEntry, FormattedInsight } from './types'

export function analyzeSymptomClusters(entries: DailyEntry[]): FormattedInsight[] {
  const co = new Map<string, Map<string, number>>()
  const counts = new Map<string, number>()
  const total = entries.length || 1

  entries.forEach((e) => {
    const syms = (e.symptoms || []).filter(Boolean)
    if (syms.length < 2) return
    syms.forEach((s) => counts.set(s, (counts.get(s) || 0) + 1))
    for (let i = 0; i < syms.length; i++) {
      for (let j = i + 1; j < syms.length; j++) {
        const [a, b] = [syms[i], syms[j]].sort()
        if (!co.has(a)) co.set(a, new Map())
        co.get(a)!.set(b, (co.get(a)!.get(b) || 0) + 1)
      }
    }
  })

  const out: FormattedInsight[] = []
  co.forEach((pairs, a) => {
    const aCount = counts.get(a) || 0
    pairs.forEach((c, b) => {
      const bCount = counts.get(b) || 0
      const support = c / total
      const confidence = aCount ? c / aCount : 0
      const expected = (aCount / total) * (bCount / total) * total
      const lift = expected > 0 ? c / expected : 0
      if (support < 0.1 || c < 5) return
      if (confidence < 0.6) return
      if (lift < 1.3) return
      const title = 'Symptom pattern detected'
      const message = `When you experience ${a.replace('_', ' ')}, you also tend to have ${b.replace('_', ' ')} (${Math.round(confidence * 100)}% of the time, ${c} days). This co-occurrence is ${lift.toFixed(1)}× more common than expected by chance.`
      const actionable = 'Treating one symptom may help with the other — discuss with your clinician.'
      out.push({
        type: 'symptom_cluster',
        priority: 4,
        title,
        message,
        actionable,
        confidence: c >= 10 ? 'high' : 'medium',
        evidenceLink: undefined,
        insightKey: `cluster_${a}_${b}`,
        data: { support, confidence, lift, occurrences: c, primary: a, secondary: b },
        createdAt: new Date(),
      })
    })
  })

  return out.sort((x, y) => ((y.data?.lift || 0) as number) - ((x.data?.lift || 0) as number)).slice(0, 3)
}


