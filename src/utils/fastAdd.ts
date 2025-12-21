import type { ISODate } from '@/types/supplements'
import { toISODateSafe } from './dates'
import { toISO, addDaysISO } from './periods'

export type FastAddParse = {
  name: string
  dose?: string | null
  baseStart: ISODate
  pauses: Array<{ end: ISODate; restart: ISODate }>
}

const SINCE_RE = /\bsince\s+(.+?)(?:\s*\(|$)/i
const PAUSE_RE = /paused\s+([^)–-]+?)\s*[–-]\s*([^)]+?)(?:;|$)/gi

export function parseFastAdd(input: string): FastAddParse | null {
  let s = input.trim()
  const sinceMatch = s.match(SINCE_RE)
  if (!sinceMatch) return null
  const head = s.slice(0, sinceMatch.index).trim()
  const baseStartStr = sinceMatch[1].trim()
  const baseStartISO = toISODateSafe(baseStartStr)
  if (!baseStartISO) return null

  const headParts = head.split(/\s+/)
  let name = head
  let dose: string | null = null
  const doseIdx = headParts.findIndex((t) => /(mg|mcg|iu|caps?|g)$/i.test(t))
  if (doseIdx >= 0) {
    name = headParts.slice(0, doseIdx).join(' ')
    dose = headParts.slice(doseIdx).join(' ')
  }
  const pauses: Array<{ end: ISODate; restart: ISODate }> = []
  let m: RegExpExecArray | null
  while ((m = PAUSE_RE.exec(s)) !== null) {
    const endISO = toISODateSafe(m[1].trim())
    const restartISO = toISODateSafe(m[2].trim())
    if (endISO && restartISO) pauses.push({ end: endISO, restart: restartISO })
  }
  return { name: name || head, dose, baseStart: baseStartISO, pauses }
}


