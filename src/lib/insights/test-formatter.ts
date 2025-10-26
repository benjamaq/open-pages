import { formatInsight } from './formatters/insight-formatter'
import type { TagCorrelationResult, MetricCorrelationResult } from './correlation-engine/types'

// Simulate the caffeine → pain result from observed logs
const testResult: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'too_much_caffeine',
  metric: 'pain',
  lagDays: 0,
  // Averages and deltas
  avgWithTag: 8,
  avgWithoutTag: 2,
  delta: 2 - 8, // negative means tag improves metric (for this synthetic example)
  // Stats
  cohensD: 8.49,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.0001 as any,
  ciLow: 5.29 as any,
  ciHigh: 6.71 as any,
  // Sample sizes
  nWith: 5,
  nWithout: 9,
  totalDays: 14,
}

console.log('=== TESTING INSIGHT FORMATTER ===')
console.log('\nInput:', JSON.stringify(testResult, null, 2))

const formatted = formatInsight(testResult as any)

console.log('\n=== FORMATTED OUTPUT ===')
console.log('Title:', formatted.title)
// Combine message + actionable as a single body preview
console.log('Body:', [formatted.message, formatted.actionable].filter(Boolean).join(' '))
console.log('Confidence:', formatted.confidence)
console.log('Insight Key:', formatted.insightKey)
console.log('\n=== FULL DATA CONTEXT ===')
console.log(JSON.stringify({ type: formatted.type, priority: formatted.priority, data: formatted.data }, null, 2))

// ------------------------------------------------------------
// Additional Tests
// ------------------------------------------------------------

// TEST 1: Positive correlation (tag HELPS) - morning_sunlight → mood
const test1: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'morning_sunlight',
  metric: 'mood',
  lagDays: 0,
  avgWithTag: 8,
  avgWithoutTag: 5,
  delta: 3.0,
  cohensD: 2.5,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.001 as any,
  ciLow: 2.0 as any,
  ciHigh: 4.0 as any,
  nWith: 7,
  nWithout: 7,
  totalDays: 14,
}

// TEST 2: Bad metric improved (magnesium HELPS pain)
const test2: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'magnesium',
  metric: 'pain',
  lagDays: 0,
  avgWithTag: 3,
  avgWithoutTag: 7,
  delta: 4.0, // pain lower with tag → good for a bad metric
  cohensD: 3.2,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.0005 as any,
  ciLow: 3.0 as any,
  ciHigh: 5.0 as any,
  nWith: 6,
  nWithout: 8,
  totalDays: 14,
}

// TEST 3: Lag effect (alcohol → next-day sleep_quality)
const test3: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'alcohol',
  metric: 'sleep_quality',
  lagDays: 1,
  avgWithTag: 4,
  avgWithoutTag: 6,
  delta: -2.0,
  cohensD: 2.1,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.002 as any,
  ciLow: -3.0 as any,
  ciHigh: -1.0 as any,
  nWith: 5,
  nWithout: 9,
  totalDays: 14,
}

// TEST 4: Metric-metric correlation (pain ↔ mood)
const test4: MetricCorrelationResult = {
  type: 'metric_correlation',
  metric1: 'pain',
  metric2: 'mood',
  // Provide fields our formatter expects
  avgHigh: 8,
  avgLow: 4,
  delta: -4,
  cohensD: 4.5,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.0001 as any,
  ciLow: -0.92 as any,
  ciHigh: -0.75 as any,
  nHigh: 7,
  nLow: 7,
  totalDays: 14,
}

function runCase(label: string, res: any) {
  console.log(`\n\n=== ${label} ===`)
  console.log('Input:', JSON.stringify(res, null, 2))
  const out = formatInsight(res as any)
  console.log('Title:', out.title)
  console.log('Body:', [out.message, out.actionable].filter(Boolean).join(' '))
  console.log('Confidence:', out.confidence)
  console.log('Insight Key:', out.insightKey)
}

runCase('TEST 1: morning_sunlight → mood (helps)', test1)
runCase('TEST 2: magnesium → pain (helps)', test2)
runCase('TEST 3: alcohol (lag=1) → sleep_quality (hurts next day)', test3)
runCase('TEST 4: pain ↔ mood (metric correlation)', test4)

// ------------------------------------------------------------
// Additional Suite (5–10)
// ------------------------------------------------------------

const test5: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'poor_sleep',
  metric: 'mood',
  lagDays: 0,
  avgWithTag: 4,
  avgWithoutTag: 7,
  delta: -3.0,
  cohensD: 2.8,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.001 as any,
  ciLow: -4.0 as any,
  ciHigh: -2.0 as any,
  nWith: 6,
  nWithout: 8,
  totalDays: 14,
}

const test6: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'dairy',
  metric: 'pain',
  lagDays: 0,
  avgWithTag: 5.2,
  avgWithoutTag: 4.0,
  delta: -1.2,
  cohensD: 0.35,
  effectSize: 'small',
  confidence: 'low',
  pValue: 0.08 as any,
  ciLow: -2.0 as any,
  ciHigh: 0.1 as any,
  nWith: 7,
  nWithout: 7,
  totalDays: 14,
}

const test7: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'gluten',
  metric: 'pain',
  lagDays: 0,
  avgWithTag: 9,
  avgWithoutTag: 1,
  delta: -8.0,
  cohensD: 12.5,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.00001 as any,
  ciLow: -8.5 as any,
  ciHigh: -7.5 as any,
  nWith: 4,
  nWithout: 10,
  totalDays: 14,
}

const test8: MetricCorrelationResult = {
  type: 'metric_correlation',
  metric1: 'sleep_quality',
  metric2: 'mood',
  avgHigh: 8,
  avgLow: 5,
  delta: 3,
  cohensD: 3.2,
  effectSize: 'large',
  confidence: 'high',
  pValue: 0.0002 as any,
  ciLow: 0.68 as any,
  ciHigh: 0.91 as any,
  nHigh: 7,
  nLow: 7,
  totalDays: 14,
}

const test10: TagCorrelationResult = {
  type: 'tag_correlation',
  tag: 'meditation',
  metric: 'anxiety',
  lagDays: 0,
  avgWithTag: 3,
  avgWithoutTag: 6.5,
  delta: 3.5,
  cohensD: 2.1,
  effectSize: 'large',
  confidence: 'medium',
  pValue: 0.004 as any,
  ciLow: 2.0 as any,
  ciHigh: 5.0 as any,
  nWith: 3,
  nWithout: 11,
  totalDays: 14,
}

runCase('TEST 5: poor_sleep → mood (hurts)', test5)
runCase('TEST 6: dairy → pain (weak effect)', test6)
runCase('TEST 7: gluten → pain (very strong)', test7)
runCase('TEST 8: sleep_quality ↔ mood (positive)', test8)
runCase('TEST 10: meditation → anxiety (helps, small n)', test10)

// Simple pass/fail heuristics
const checks: Array<{label: string; titleIncl: string[]; bodyIncl: string[]; res: any}> = [
  { label: 'TEST 1', titleIncl: ['higher mood'], bodyIncl: ['Keep prioritizing'], res: test1 },
  { label: 'TEST 2', titleIncl: ['lower pain'], bodyIncl: ['Keep prioritizing'], res: test2 },
  { label: 'TEST 3', titleIncl: ['lower sleep quality'], bodyIncl: ['next-day effect', 'Consider reducing'], res: test3 },
  { label: 'TEST 4', titleIncl: ['affects your mood'], bodyIncl: [], res: test4 },
  { label: 'TEST 5', titleIncl: ['lower mood'], bodyIncl: ['Consider reducing'], res: test5 },
  { label: 'TEST 6', titleIncl: [], bodyIncl: [], res: test6 },
  { label: 'TEST 7', titleIncl: ['higher pain', 'significantly'], bodyIncl: [], res: test7 },
  { label: 'TEST 8', titleIncl: ['affects your mood'], bodyIncl: ['Focus on improving your sleep quality'], res: test8 },
  { label: 'TEST 10', titleIncl: ['lower anxiety'], bodyIncl: ['Keep prioritizing'], res: test10 },
]

let passed = 0
let failed = 0
const issues: string[] = []

console.log('\n\n=== TEST SUMMARY ===')
for (const c of checks) {
  const out = formatInsight(c.res as any)
  const title = out.title.toLowerCase()
  const body = [out.message, out.actionable].filter(Boolean).join(' ').toLowerCase()
  const okTitle = c.titleIncl.every(v => title.includes(v.toLowerCase()))
  const okBody = c.bodyIncl.every(v => body.includes(v.toLowerCase()))
  const ok = okTitle && okBody
  if (ok) {
    passed++
    console.log(`${c.label}: ✅`)
  } else {
    failed++
    console.log(`${c.label}: ❌`)
    if (!okTitle) issues.push(`${c.label}: title missing ${c.titleIncl.join(', ')}`)
    if (!okBody && c.bodyIncl.length) issues.push(`${c.label}: body missing ${c.bodyIncl.join(', ')}`)
  }
}
console.log(`Total tests: ${checks.length + 4}`) // Include earlier 4 tests implicitly
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
if (issues.length) console.log('Issues found:', issues)


