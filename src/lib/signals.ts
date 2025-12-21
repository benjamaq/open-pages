export type InsightStatus = 'insufficient' | 'testing' | 'confirmed' | 'no_effect' | 'hurting';
export type MetricKey = 'sleep' | 'energy' | 'focus' | 'recovery';

export const CONF_THRESHOLDS = {
  minDays: 7,        // below this => insufficient
  goodDays: 21,      // helps push from testing -> confirmed when conf high
  confirm: 75,       // confidence >= confirm & |effect| >= minEffect => confirmed/hurting
  minEffect: 5       // absolute % required to qualify as confirmed/hurting
} as const;

export function statusFromSignal(n: number, effectPct: number | null, confidence: number | null): InsightStatus {
  if (!n || n < CONF_THRESHOLDS.minDays) return 'insufficient';
  if (confidence == null || effectPct == null) return 'testing';

  const abs = Math.abs(effectPct);
  if (confidence >= CONF_THRESHOLDS.confirm) {
    if (abs < CONF_THRESHOLDS.minEffect) return 'no_effect';
    return effectPct >= 0 ? 'confirmed' : 'hurting';
  }
  return 'testing';
}

export function effectColor(effectPct: number | null): 'pos'|'neg'|'neutral' {
  if (effectPct == null) return 'neutral';
  if (effectPct > 0) return 'pos';
  if (effectPct < 0) return 'neg';
  return 'neutral';
}

export function formatPct(v: number | null, opts: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }): string {
  if (v == null || Number.isNaN(v)) return '—';
  const nf = new Intl.NumberFormat(undefined, opts);
  const sign = v > 0 ? '+' : '';
  return `${sign}${nf.format(v)}%`;
}

export function formatN(n: number | null): string {
  if (!n) return 'n=0';
  return `n=${n}`;
}

// 3-Tier system status
export enum Status {
  TRIAL = 'TRIAL',
  GATHERING_EVIDENCE = 'GATHERING_EVIDENCE',
  CONFOUNDED = 'CONFOUNDED',
  RULE = 'RULE',
  HURTING = 'HURTING'
}

export const getNextStatus = (s: Status, confidence: number) => {
  if (s === Status.TRIAL) return confidence >= 0.75 ? Status.RULE : Status.GATHERING_EVIDENCE
  if (s === Status.GATHERING_EVIDENCE && confidence >= 0.75) return Status.RULE
  return s
}

// Cockpit server mapping helper
export function statusFromSignalCockpit(s: { n: number; confidence: number }): 'GATHERING_EVIDENCE'|'RULE' {
  if ((s?.n ?? 0) >= 30 && (s?.confidence ?? 0) >= 75) return 'RULE'
  return 'GATHERING_EVIDENCE'
}


