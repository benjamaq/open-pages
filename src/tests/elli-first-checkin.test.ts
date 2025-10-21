import { describe, it, expect } from 'vitest'
import { getPostCheckInTemplate } from '@/lib/elli/elliTemplates'

describe('Elli first check-in template', () => {
  it('includes name, pain, mood, sleep; references a factor; under 150 words; includes 5-7 days; ends with sign-off', () => {
    const msg = getPostCheckInTemplate({
      userName: 'Sarah',
      checkIn: { pain: 7, mood: 4, sleep: 5 },
      previousCheckIns: [],
      daysOfTracking: 0,
      factors: {
        symptoms: ['brain_fog'],
        lifestyle_factors: ['high_stress']
      }
    } as any)

    expect(msg).toContain('Sarah')
    expect(msg).toMatch(/pain\s+at\s+7\/10/i)
    expect(msg).toMatch(/mood\s+at\s+4\/10/i)
    expect(msg).toMatch(/sleep\s+at\s+5\/10/i)
    expect(/brain|stress|caffeine|fog|sleep|pain/i.test(msg)).toBe(true)
    const wordCount = msg.trim().split(/\s+/).length
    expect(wordCount).toBeLessThanOrEqual(150)
    expect(msg).toMatch(/5[–-]7\s*days/i)
    expect(msg).toMatch(/Keep tracking/i)
    expect(msg).not.toMatch(/congratulations|milestone|journey/i)
  })
})


