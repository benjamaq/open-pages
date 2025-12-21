export type ISODate = string

export type Supplement = { 
  id: string
  name: string
  archived?: boolean
}

// 3-tier cockpit types
export type Status = 'TRIAL' | 'GATHERING_EVIDENCE' | 'RULE' | 'CONFOUNDED' | 'HURTING'

export type TrialType = 'ON_OFF' | 'DOSE' | 'ISOLATE'

export type Trial = {
  type: TrialType
  day: number        // 1..totalDays
  totalDays: number  // typically 7 or 14
  startedAt: string  // ISO
  endsAt: string     // ISO
}

export type Signal = {
  n: number            // days/check-ins used
  effectPct: number    // signed %
  confidence: number   // 0..100
}

export type CockpitSupplement = {
  id: string
  name: string
  monthlyCost?: number | null
  status: Status                          // TRIAL | GATHERING_EVIDENCE | RULE | …
  overlay?: 'CONFOUNDED'|'HURTING'|null   // overlay badge
  trial?: Trial | null                    // present only if status=TRIAL
  signal: Signal
}

export type SupplementPeriod = {
  id: string
  supplementId: string
  startDate: ISODate
  endDate: ISODate | null
  dose?: string | null
  notes?: string | null
}


