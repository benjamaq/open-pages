export interface DailyEntry {
  local_date: string
  pain: number
  skipped_supplements?: string[] | null
}

export type SupplementStatus = 'increases_pain' | 'decreases_pain' | 'unclear' | 'not_enough_data'

export interface SupplementEffectiveness {
  status: SupplementStatus
  delta: number
  avgPainTaken: number
  avgPainNotTaken: number
  takenDays: number
  notTakenDays: number
  daysTracked: number
}

function getValidEntries(entries: DailyEntry[]): DailyEntry[] {
  return (entries || []).filter((e) => e && typeof e.pain === 'number')
}

export function computeSupplementEffectiveness(
  supplementName: string,
  entries: DailyEntry[]
): SupplementEffectiveness {
  const valid = getValidEntries(entries)
  const name = normalizeSupplementName(supplementName)

  const taken: number[] = []
  const notTaken: number[] = []

  for (const e of valid) {
    const skipped = (e.skipped_supplements || []).map((s) => normalizeSupplementName(s || ''))
    const wasSkipped = skipped.includes(name)
    if (wasSkipped) notTaken.push(e.pain)
    else taken.push(e.pain)
  }

  const MIN_TOTAL = 14
  const MIN_TAKEN = 7
  const MIN_NOT = 7
  const MIN_IMPACT = 2

  const total = taken.length + notTaken.length
  if (total < MIN_TOTAL || taken.length < MIN_TAKEN || notTaken.length < MIN_NOT) {
    return {
      status: 'not_enough_data',
      delta: 0,
      avgPainTaken: 0,
      avgPainNotTaken: 0,
      takenDays: taken.length,
      notTakenDays: notTaken.length,
      daysTracked: total,
    }
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const takenAvg = avg(taken)
  const notTakenAvg = avg(notTaken)
  const delta = notTakenAvg - takenAvg // positive => taking helps (lower pain when taken)

  if (Math.abs(delta) < MIN_IMPACT) {
    return {
      status: 'unclear',
      delta: round1(Math.abs(delta)),
      avgPainTaken: round1(takenAvg),
      avgPainNotTaken: round1(notTakenAvg),
      takenDays: taken.length,
      notTakenDays: notTaken.length,
      daysTracked: total,
    }
  }

  const status: SupplementStatus = delta > 0 ? 'decreases_pain' : 'increases_pain'
  return {
    status,
    delta: round1(Math.abs(delta)),
    avgPainTaken: round1(takenAvg),
    avgPainNotTaken: round1(notTakenAvg),
    takenDays: taken.length,
    notTakenDays: notTaken.length,
    daysTracked: total,
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function normalizeSupplementName(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

export function generateSupplementInsight(supplementName: string, eff: SupplementEffectiveness) {
  const name = supplementName
  if (eff.status === 'decreases_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      icon: '💊',
      topLine: `${name} seems to help`,
      discovery: `On days you take ${name}, pain averages ${eff.avgPainTaken.toFixed(1)} out of 10. On days you skip it, pain is ${eff.avgPainNotTaken.toFixed(1)} out of 10.`,
      action: `That's a ${eff.delta.toFixed(1)}-point improvement. Keep it consistent and keep watching.`,
    } as const
  }
  if (eff.status === 'increases_pain') {
    return {
      type: 'WARNING',
      icon: '💊',
      topLine: `${name} might be making pain worse`,
      discovery: `On days you take ${name}, pain averages ${eff.avgPainTaken.toFixed(1)} out of 10 vs ${eff.avgPainNotTaken.toFixed(1)} on skip days.`,
      action: `That's a ${eff.delta.toFixed(1)}-point difference. Consider pausing for a week and rechecking.`,
    } as const
  }
  return {
    type: 'PATTERN DISCOVERED',
    icon: '💊',
    topLine: `${name} impact is unclear`,
    discovery: `We need more variation to be confident about ${name}.`,
    action: 'Try alternating days for 1–2 weeks to test it.',
  } as const
}


