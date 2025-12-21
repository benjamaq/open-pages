import type { ISODate } from '@/types/supplements'

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

export function toISODateSafe(input: string | Date): ISODate | null {
  const d = input instanceof Date ? input : tryParseNatural(input)
  if (!d || isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

export function tryParseNatural(raw: string): Date | null {
  const s = raw.trim().toLowerCase()
  if (s === 'today') return new Date()
  if (s === 'yesterday') {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d
  }
  const lastDay = s.match(/^last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/)
  if (lastDay) {
    const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const target = dayNames.indexOf(lastDay[1])
    const d = new Date()
    const delta = (d.getDay() - target + 7) % 7 || 7
    d.setDate(d.getDate() - delta)
    return d
  }
  const ago = s.match(/^(\d+)\s+(day|days|week|weeks|month|months)\s+ago$/)
  if (ago) {
    const n = parseInt(ago[1], 10)
    const d = new Date()
    if (/day/.test(ago[2])) d.setDate(d.getDate() - n)
    else if (/week/.test(ago[2])) d.setDate(d.getDate() - 7 * n)
    else if (/month/.test(ago[2])) d.setMonth(d.getMonth() - n)
    return d
  }
  const monthDay = s.match(/^([a-z]{3,})\.?\s+(\d{1,2})(?:[,\s]+(\d{2,4}))?$/)
  if (monthDay) {
    const monthIdx = MONTHS.findIndex((m) => monthDay[1].startsWith(m))
    if (monthIdx >= 0) {
      const year = monthDay[3]
        ? (parseInt(monthDay[3], 10) < 100 ? 2000 + parseInt(monthDay[3], 10) : parseInt(monthDay[3], 10))
        : new Date().getFullYear()
      return new Date(year, monthIdx, parseInt(monthDay[2], 10))
    }
  }
  const parsed = new Date(raw)
  return isNaN(parsed.getTime()) ? null : parsed
}


