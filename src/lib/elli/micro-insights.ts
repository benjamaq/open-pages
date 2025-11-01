import type { Entry, MicroInsight } from './types'

// PHASE 3: Pure deterministic logic. No LLM calls.

export function computeMicroInsights(_userId: string, entries: Entry[]): MicroInsight[] {
  const insights: MicroInsight[] = []
  if (!Array.isArray(entries) || entries.length === 0) return insights

  // Helper accessors (assumes entries[0] is today, entries[1] yesterday)
  const today = entries[0]
  const yesterday = entries[1]

  // 5) CELEBRATIONS (Any day)
  try {
    // First time pain < 5
    const firstTimeLowPain = typeof today.pain === 'number' && today.pain < 5 && entries.slice(1).every(e => (e?.pain ?? 10) >= 5)
    if (firstTimeLowPain) {
      insights.push({
        type: 'celebration',
        confidence: 'fact',
        message: '🎉 Pain dropped below 5 for the first time! Let\'s figure out what\'s working...'
      })
    }
    // Triple win (all metrics good)
    if ((today.pain ?? 10) < 5 && (today.mood ?? 0) >= 7 && (today.sleep_quality ?? 0) >= 7) {
      insights.push({
        type: 'celebration',
        confidence: 'fact',
        message: '✨ Triple win today! Pain, mood, and sleep all in the green zone.'
      })
    }
  } catch {}

  // 1) BASELINE (Day 2 only)
  try {
    if (entries.length === 2) {
      insights.push({
        type: 'baseline',
        confidence: 'fact',
        badge: 'Baseline set ✅',
        message: 'Two days tracked—now I can compare your days.'
      })
    }
  } catch {}

  // 2) CHANGE DETECTION (Day 2+)
  try {
    if (entries.length >= 2 && today && yesterday) {
      const changes = [
        { metric: 'pain', delta: (today.pain ?? 0) - (yesterday.pain ?? 0) },
        { metric: 'mood', delta: (today.mood ?? 0) - (yesterday.mood ?? 0) },
        { metric: 'sleep_quality', delta: (today.sleep_quality ?? 0) - (yesterday.sleep_quality ?? 0) },
      ]
      const significant = changes.filter(c => Math.abs(c.delta) >= 2)
      if (significant.length > 0) {
        const largest = significant.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
        const up = largest.delta > 0
        const abs = Math.abs(largest.delta)
        insights.push({
          type: 'change',
          confidence: 'fact',
          message: `Your ${largest.metric.replace('_', ' ')} ${up ? 'increased' : 'decreased'} by ${abs} points today. That contrast helps me spot patterns.`,
          data: { metric: largest.metric, delta: largest.delta }
        })
      }
    }
  } catch {}

  // 3) WEAK SIGNAL DETECTION (Day 3+)
  try {
    if (entries.length >= 3) {
      const commonTags = ['too_much_caffeine', 'high_stress', 'dairy', 'gluten', 'alcohol', 'poor_sleep']
      const norm = (tag: string) => (tag || '').toLowerCase().replace(/\s+/g, '_')
      const withTagPainAvg = (tag: string) => {
        const withTag = entries.filter(e => (e.tags || []).map(norm).includes(tag) && typeof e.pain === 'number')
        const withoutTag = entries.filter(e => !(e.tags || []).map(norm).includes(tag) && typeof e.pain === 'number')
        const avg = (arr: Entry[]) => arr.length ? arr.reduce((s, e) => s + (e.pain || 0), 0) / arr.length : NaN
        return { withTag, withoutTag, avgWith: avg(withTag), avgWithout: avg(withoutTag) }
      }

      let best: { tag: string; delta: number; occurrences: number; avgWith: number; avgWithout: number } | null = null
      for (const tag of commonTags) {
        const { withTag, avgWith, avgWithout } = withTagPainAvg(tag)
        const occurrences = withTag.length
        if (occurrences >= 2 && isFinite(avgWith) && isFinite(avgWithout)) {
          const delta = (avgWith - avgWithout)
          if (delta >= 1.5) {
            if (!best || delta > best.delta) {
              best = { tag, delta, occurrences, avgWith, avgWithout }
            }
          }
        }
      }
      if (best) {
        insights.push({
          type: 'weak_signal',
          confidence: 'low',
          badge: 'Early hint 🔍',
          message: `${best.tag} appeared on ${best.occurrences} of your higher-pain days. Not conclusive yet—let\'s keep watching.`,
          data: { tag: best.tag, occurrences: best.occurrences, metric: 'pain', avgWith: best.avgWith, avgWithout: best.avgWithout }
        })
      }
    }
  } catch {}

  // 4) PROGRESS METER (Day 4+)
  try {
    if (entries.length >= 4) {
      const daysLeft = Math.max(0, 7 - entries.length)
      insights.push({
        type: 'progress',
        confidence: 'fact',
        message: daysLeft === 0
          ? 'Ready to analyze! Checking for patterns now...'
          : `${daysLeft} more day${daysLeft > 1 ? 's' : ''} until pattern detection unlocks 📊`,
        data: { progress: entries.length / 7, daysLeft }
      })
    }
  } catch {}

  // PRIORITIZATION & LIMIT
  const order: Record<string, number> = {
    celebration: 1,
    baseline: 2,
    change: 3,
    weak_signal: 4,
    progress: 5,
  }
  insights.sort((a, b) => (order[a.type] || 99) - (order[b.type] || 99))
  return insights.slice(0, 5)
}



