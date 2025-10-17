export interface DailyEntry {
  local_date: string;
  pain: number;
  sleep_quality: number;
  mood: number;
}

export interface SleepPainCorrelation {
  show: boolean;
  goodSleepAvgPain: number;
  poorSleepAvgPain: number;
  delta: number;
}

export function computeSleepPainCorrelation(
  entries: DailyEntry[]
): SleepPainCorrelation {
  const validEntries = entries.filter((e) =>
    e && typeof e.pain === 'number' && typeof e.sleep_quality === 'number'
  )

  if (validEntries.length < 6) {
    return { show: false, goodSleepAvgPain: 0, poorSleepAvgPain: 0, delta: 0 };
  }

  const goodSleep = validEntries.filter((e) => e.sleep_quality >= 7);
  const poorSleep = validEntries.filter((e) => e.sleep_quality < 7);

  if (goodSleep.length < 3 || poorSleep.length < 3) {
    return { show: false, goodSleepAvgPain: 0, poorSleepAvgPain: 0, delta: 0 };
  }

  const goodAvg = goodSleep.reduce((sum, e) => sum + e.pain, 0) / goodSleep.length;
  const poorAvg = poorSleep.reduce((sum, e) => sum + e.pain, 0) / poorSleep.length;
  const delta = Math.abs(poorAvg - goodAvg);

  if (delta < 2) {
    return {
      show: false,
      goodSleepAvgPain: parseFloat(goodAvg.toFixed(1)),
      poorSleepAvgPain: parseFloat(poorAvg.toFixed(1)),
      delta: parseFloat(delta.toFixed(1)),
    };
  }

  return {
    show: true,
    goodSleepAvgPain: parseFloat(goodAvg.toFixed(1)),
    poorSleepAvgPain: parseFloat(poorAvg.toFixed(1)),
    delta: parseFloat(delta.toFixed(1)),
  };
}

export interface SevenDayTrend {
  status: 'improving' | 'stable' | 'worsening';
  delta: number;
}

export function computeSevenDayTrend(entries: DailyEntry[]): SevenDayTrend | null {
  const valid = (entries || []).filter((e) => typeof e.pain === 'number')
  if (valid.length < 6) return null
  const last7 = valid.slice(-7)
  const first3 = last7.slice(0, 3);
  const last3 = last7.slice(-3);

  const firstAvg = first3.reduce((sum, e) => sum + e.pain, 0) / first3.length;
  const lastAvg = last3.reduce((sum, e) => sum + e.pain, 0) / last3.length;
  const delta = lastAvg - firstAvg;

  let status: 'improving' | 'stable' | 'worsening';
  if (delta <= -1) status = 'improving';
  else if (delta >= 1) status = 'worsening';
  else status = 'stable';

  return { status, delta: parseFloat(delta.toFixed(1)) };
}

export interface DaySummary {
  date: string;
  pain: number;
  sleep: number;
  mood: number;
  daysAgo: number;
  label: string;
}

export function computeBestWorst(
  entries: DailyEntry[]
): { best: DaySummary | null; worst: DaySummary | null } {
  const valid = (entries || []).filter((e) => typeof e.pain === 'number')
  if (valid.length === 0) {
    return { best: null, worst: null };
  }
  const best = valid.reduce((prev, curr) => (curr.pain < prev.pain ? curr : prev));
  const worst = valid.reduce((prev, curr) => (curr.pain > prev.pain ? curr : prev));

  const todayISO = new Date().toISOString().split('T')[0];
  function getDaysAgo(dateStr: string): number {
    const entryDate = new Date(dateStr);
    const todayDate = new Date(todayISO);
    const diff = todayDate.getTime() - entryDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
  function label(days: number): string {
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
  }

  const bestDaysAgo = getDaysAgo(best.local_date);
  const worstDaysAgo = getDaysAgo(worst.local_date);

  return {
    best: {
      date: best.local_date,
      pain: best.pain,
      sleep: typeof (best as any).sleep_quality === 'number' ? (best as any).sleep_quality : (undefined as any),
      mood: typeof (best as any).mood === 'number' ? (best as any).mood : (undefined as any),
      daysAgo: bestDaysAgo,
      label: label(bestDaysAgo),
    },
    worst: {
      date: worst.local_date,
      pain: worst.pain,
      sleep: typeof (worst as any).sleep_quality === 'number' ? (worst as any).sleep_quality : (undefined as any),
      mood: typeof (worst as any).mood === 'number' ? (worst as any).mood : (undefined as any),
      daysAgo: worstDaysAgo,
      label: label(worstDaysAgo),
    },
  };
}


