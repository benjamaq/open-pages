export interface LifestyleFactor {
  id: string;
  name: string;
  icon: string;
}

export interface DailyEntry {
  local_date: string;
  pain: number;
  sleep_quality: number;
  mood: number;
  lifestyle_factors?: string[];
}

export interface LifestyleEffectiveness {
  factor_id: string;
  factor_name: string;
  status: 'increases_pain' | 'decreases_pain' | 'unclear' | 'not_enough_data';
  delta: number;
  avgPainWith: number;
  avgPainWithout: number;
  daysTracked: number;
}

function getValidEntries(entries: DailyEntry[]): DailyEntry[] {
  return entries.filter((e) =>
    e &&
    typeof e.pain === 'number' &&
    typeof e.sleep_quality === 'number' &&
    typeof e.mood === 'number'
  );
}

export function computeLifestyleEffectiveness(
  factor: LifestyleFactor,
  entries: DailyEntry[]
): LifestyleEffectiveness {
  const validEntries = getValidEntries(entries);

  if (validEntries.length < 10) {
    return {
      factor_id: factor.id,
      factor_name: factor.name,
      status: 'not_enough_data',
      delta: 0,
      avgPainWith: 0,
      avgPainWithout: 0,
      daysTracked: validEntries.length,
    };
  }

  const daysWithFactor = validEntries.filter((e) =>
    (e.lifestyle_factors || []).includes(factor.id)
  );
  const daysWithoutFactor = validEntries.filter((e) =>
    !(e.lifestyle_factors || []).includes(factor.id)
  );

  if (daysWithFactor.length < 3 || daysWithoutFactor.length < 3) {
    return {
      factor_id: factor.id,
      factor_name: factor.name,
      status: 'not_enough_data',
      delta: 0,
      avgPainWith: 0,
      avgPainWithout: 0,
      daysTracked: validEntries.length,
    };
  }

  const avg = (arr: DailyEntry[]) => arr.reduce((s, e) => s + e.pain, 0) / arr.length;

  const avgPainWith = avg(daysWithFactor);
  const avgPainWithout = avg(daysWithoutFactor);
  const deltaRaw = avgPainWith - avgPainWithout;
  const deltaAbs = Math.abs(deltaRaw);

  if (deltaAbs < 2) {
    return {
      factor_id: factor.id,
      factor_name: factor.name,
      status: 'unclear',
      delta: parseFloat(deltaAbs.toFixed(1)),
      avgPainWith: parseFloat(avgPainWith.toFixed(1)),
      avgPainWithout: parseFloat(avgPainWithout.toFixed(1)),
      daysTracked: validEntries.length,
    };
  }

  const status = deltaRaw >= 2 ? 'increases_pain' : 'decreases_pain';

  return {
    factor_id: factor.id,
    factor_name: factor.name,
    status,
    delta: parseFloat(deltaAbs.toFixed(1)),
    avgPainWith: parseFloat(avgPainWith.toFixed(1)),
    avgPainWithout: parseFloat(avgPainWithout.toFixed(1)),
    daysTracked: validEntries.length,
  };
}

export function generateLifestyleInsight(
  factor: LifestyleFactor,
  effectiveness: LifestyleEffectiveness
) {
  const { name, icon } = factor;
  const { status, delta, avgPainWith, avgPainWithout } = effectiveness;

  if (status === 'increases_pain') {
    return {
      type: 'WARNING',
      icon,
      topLine: `${name} increases your pain`,
      discovery: `We discovered that on days when you experience ${name.toLowerCase()}, your pain averages ${avgPainWith.toFixed(0)} out of 10. On days without it, pain is ${avgPainWithout.toFixed(0)} out of 10.`,
      action: `That's a ${delta.toFixed(0)}-point difference. Consider reducing frequency or finding alternatives.`,
    } as const;
  }

  if (status === 'decreases_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      icon,
      topLine: `${name} helps your pain`,
      discovery: `We discovered that on days when you experience ${name.toLowerCase()}, your pain averages ${avgPainWith.toFixed(0)} out of 10. On days without it, pain is ${avgPainWithout.toFixed(0)} out of 10.`,
      action: `That's a ${delta.toFixed(0)}-point improvement. Keep doing what you're doing!`,
    } as const;
  }

  return {
    type: 'PATTERN DISCOVERED',
    icon,
    topLine: `${name} impact is unclear`,
    discovery: `We don't have enough variation to be confident yet.`,
    action: 'Track for ~2 weeks with some days on and some days off.',
  } as const;
}


