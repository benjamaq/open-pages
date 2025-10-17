export interface DailyEntry {
  local_date: string;
  pain: number;
  sleep_quality: number;
  mood: number;
  symptoms?: string[];
}

export interface SymptomDescriptor {
  id: string;
  name: string;
  icon: string;
}

export interface SymptomPattern {
  symptom_id: string;
  symptom_name: string;
  pattern_type: 'appears_high_pain' | 'appears_low_pain' | 'independent' | 'not_enough_data';
  frequency?: number; // percent of valid days
  avgPainWhenPresent?: number;
  avgPainOverall?: number;
}

function getValidEntries(entries: DailyEntry[]): DailyEntry[] {
  return entries.filter((e) =>
    e &&
    typeof e.pain === 'number' &&
    typeof e.sleep_quality === 'number' &&
    typeof e.mood === 'number'
  );
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeSymptomPattern(
  symptom: SymptomDescriptor,
  entries: DailyEntry[]
): SymptomPattern {
  const validEntries = getValidEntries(entries);

  if (validEntries.length < 10) {
    return { symptom_id: symptom.id, symptom_name: symptom.name, pattern_type: 'not_enough_data' };
  }

  const daysWithSymptom = validEntries.filter((e) => (e.symptoms || []).includes(symptom.id));

  if (daysWithSymptom.length < 3) {
    return { symptom_id: symptom.id, symptom_name: symptom.name, pattern_type: 'not_enough_data' };
  }

  const frequency = (daysWithSymptom.length / validEntries.length) * 100;
  const avgPainWhenPresent = average(daysWithSymptom.map((e) => e.pain));
  const avgPainOverall = average(validEntries.map((e) => e.pain));

  const delta = avgPainWhenPresent - avgPainOverall;

  if (delta >= 2) {
    return {
      symptom_id: symptom.id,
      symptom_name: symptom.name,
      pattern_type: 'appears_high_pain',
      frequency,
      avgPainWhenPresent,
      avgPainOverall,
    };
  }

  if (delta <= -2) {
    return {
      symptom_id: symptom.id,
      symptom_name: symptom.name,
      pattern_type: 'appears_low_pain',
      frequency,
      avgPainWhenPresent,
      avgPainOverall,
    };
  }

  return {
    symptom_id: symptom.id,
    symptom_name: symptom.name,
    pattern_type: 'independent',
    frequency,
    avgPainWhenPresent,
    avgPainOverall,
  };
}

export function generateSymptomInsight(symptom: SymptomDescriptor, pattern: SymptomPattern) {
  const icon = symptom.icon || '🧩';
  if (pattern.pattern_type === 'appears_high_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      icon,
      topLine: `${symptom.name} appears on high-pain days`,
      discovery: `We noticed ${symptom.name.toLowerCase()} appears ${Math.round((pattern.frequency || 0)).toFixed(0)}% of the time, mostly when your pain is high (average ${(pattern.avgPainWhenPresent || 0).toFixed(0)} out of 10).`,
      action: `This suggests ${symptom.name.toLowerCase()} is part of your main pain picture. Track a bit longer to confirm.`,
    } as const;
  }
  if (pattern.pattern_type === 'appears_low_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      icon,
      topLine: `${symptom.name} shows up on lower-pain days`,
      discovery: `${symptom.name} appears ${Math.round((pattern.frequency || 0)).toFixed(0)}% of the time, more often when pain is lower (present days average ${(pattern.avgPainWhenPresent || 0).toFixed(0)} out of 10 vs overall ${(pattern.avgPainOverall || 0).toFixed(0)}).`,
      action: `This might indicate a separate issue. Consider discussing with your clinician.`,
    } as const;
  }
  if (pattern.pattern_type === 'independent') {
    return {
      type: 'PATTERN DISCOVERED',
      icon,
      topLine: `${symptom.name} happens independently`,
      discovery: `${symptom.name} appears ${Math.round((pattern.frequency || 0)).toFixed(0)}% of the time, regardless of your pain level.`,
      action: `This could be separate from your core pain. Track triggers and timing.`,
    } as const;
  }
  return {
    type: 'PATTERN DISCOVERED',
    icon,
    topLine: `${symptom.name} needs more data`,
    discovery: `We don't have enough data to tell how ${symptom.name.toLowerCase()} relates to pain yet.`,
    action: 'Keep tracking symptoms for another week.',
  } as const;
}


