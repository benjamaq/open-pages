import type { SupplementPeriod, ISODate } from '@/types/supplements'

export const toISO = (d: Date): ISODate => d.toISOString().slice(0, 10)

export const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export const sortByStart = (arr: SupplementPeriod[]) =>
  [...arr].sort((a, b) => cmp(a.startDate, b.startDate))

export function rangesOverlap(
  aStart: string,
  aEnd: string | null,
  bStart: string,
  bEnd: string | null
): boolean {
  const aE = aEnd ?? '9999-12-31'
  const bE = bEnd ?? '9999-12-31'
  return !(aE < bStart || bE < aStart)
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function hasAnyOverlap(periods: SupplementPeriod[]): boolean {
  const s = sortByStart(periods)
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i]
    const b = s[i + 1]
    if (rangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
      // allow adjacency exactly a.end + 1d == b.start
      if (!a.endDate || a.endDate >= b.startDate) return true
    }
  }
  return false
}

export function validatePeriods(
  periods: SupplementPeriod[]
): { ok: true } | { ok: false; message: string } {
  const s = sortByStart(periods)
  const activeCount = s.filter((p) => p.endDate === null).length
  if (activeCount > 1) {
    return {
      ok: false,
      message:
        'Only one active period allowed. End the current one before starting a new one.',
    }
  }
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i]
    const b = s[i + 1]
    if (rangesOverlap(a.startDate, a.endDate, b.startDate, b.endDate)) {
      if (!a.endDate || a.endDate >= b.startDate) {
        return {
          ok: false,
          message: `Two periods overlap. Period ending ${a.endDate} conflicts with period starting ${b.startDate}. Adjust dates or end the earlier period first.`,
        }
      }
    }
  }
  return { ok: true }
}


