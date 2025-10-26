import { analyzeTagVsMetric } from '../../insights/correlation-engine/tag-analyzer'
import { analyzeMetricVsMetric } from '../../insights/correlation-engine/metric-analyzer'

// Caffeine Carla: pain high with caffeine, low without
export function testCaffeineCarla(): { pass: boolean; details: any } {
  const entries: any[] = []
  for (let i = 0; i < 5; i++) entries.push({ local_date: `2025-10-0${i + 1}`, pain: 8, tags: ['too_much_caffeine'] })
  for (let i = 0; i < 5; i++) entries.push({ local_date: `2025-10-1${i}`, pain: 2, tags: [] })
  for (let i = 0; i < 4; i++) entries.push({ local_date: `2025-10-2${i}`, pain: 7, tags: ['too_much_caffeine'] })
  const res = analyzeTagVsMetric(entries, { tag: 'too_much_caffeine', metric: 'pain', minDelta: 2 })
  return { pass: !!res && res.delta > 0 && (res.cohensD || 0) > 1.0, details: res }
}

// Sleep Sam: poor sleep (<7) higher pain than good sleep (>=7)
export function testSleepSam(): { pass: boolean; details: any } {
  const entries: any[] = []
  // alternate low sleep-high pain and good sleep-low pain
  for (let i = 0; i < 7; i++) {
    entries.push({ local_date: `2025-10-${(i + 1).toString().padStart(2, '0')}`, sleep_quality: 4, pain: 8 })
    entries.push({ local_date: `2025-10-${(i + 8).toString().padStart(2, '0')}`, sleep_quality: 8, pain: 3 })
  }
  const res = analyzeMetricVsMetric(entries, { metric1: 'sleep_quality', metric2: 'pain', splitStrategy: { type: 'threshold', value: 7 } })
  return { pass: !!res && res.delta > 0 && (res.cohensD || 0) > 0.8, details: res }
}

// Dairy Dana: bloating present (1) with dairy tag, absent (0) without
export function testDairyDana(): { pass: boolean; details: any } {
  const entries: any[] = []
  for (let i = 0; i < 7; i++) entries.push({ local_date: `2025-10-0${i + 1}`, bloating: 1, tags: ['dairy'] })
  for (let i = 0; i < 7; i++) entries.push({ local_date: `2025-10-1${i}`, bloating: 0, tags: [] })
  const res = analyzeTagVsMetric(entries, { tag: 'dairy', metric: 'bloating', minDelta: 0.5 })
  return { pass: !!res && res.delta > 0 && (res.cohensD || 0) > 0.5, details: res }
}


