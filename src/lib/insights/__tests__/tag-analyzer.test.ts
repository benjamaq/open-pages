import { analyzeTagVsMetric } from '../../insights/correlation-engine/tag-analyzer'

describe('analyzeTagVsMetric', () => {
  it('returns null with insufficient data', () => {
    const res = analyzeTagVsMetric([], { tag: 'too_much_caffeine', metric: 'pain', minDelta: 2 })
    expect(res).toBeNull()
  })

  it('detects positive correlation (tag worsens metric)', () => {
    const entries = [] as any[]
    for (let i = 0; i < 7; i++) entries.push({ local_date: `2025-10-${i + 1}`, pain: 8, tags: ['too_much_caffeine'] })
    for (let i = 0; i < 7; i++) entries.push({ local_date: `2025-10-${i + 8}`, pain: 3, tags: [] })
    const res = analyzeTagVsMetric(entries, { tag: 'too_much_caffeine', metric: 'pain', minDelta: 2 })
    expect(res).not.toBeNull()
    expect(res!.delta).toBeGreaterThan(0)
  })
})


