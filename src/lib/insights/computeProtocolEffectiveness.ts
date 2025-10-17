export interface ProtocolDescriptor {
  id: string;
  name: string;
  icon: string;
}

export interface DailyEntry {
  local_date: string;
  pain: number;
  sleep_quality: number;
  mood: number;
  protocols?: string[];
}

export interface ProtocolEffectiveness {
  protocol_id: string;
  protocol_name: string;
  status: 'increases_pain' | 'decreases_pain' | 'unclear' | 'not_enough_data';
  delta: number;
  avgPainWith: number;
  avgPainWithout: number;
  daysTracked: number;
}

function getValidEntries(entries: DailyEntry[]): DailyEntry[] {
  return entries.filter((e) =>
    e && typeof e.pain === 'number' && typeof e.sleep_quality === 'number' && typeof e.mood === 'number'
  )
}

export function computeProtocolEffectiveness(protocol: ProtocolDescriptor, entries: DailyEntry[]): ProtocolEffectiveness {
  const validEntries = getValidEntries(entries)
  if (validEntries.length < 10) {
    return { protocol_id: protocol.id, protocol_name: protocol.name, status: 'not_enough_data', delta: 0, avgPainWith: 0, avgPainWithout: 0, daysTracked: validEntries.length }
  }

  const withProt = validEntries.filter((e) => (e.protocols || []).includes(protocol.id))
  const withoutProt = validEntries.filter((e) => !(e.protocols || []).includes(protocol.id))

  if (withProt.length < 3 || withoutProt.length < 3) {
    return { protocol_id: protocol.id, protocol_name: protocol.name, status: 'not_enough_data', delta: 0, avgPainWith: 0, avgPainWithout: 0, daysTracked: validEntries.length }
  }

  const avg = (arr: DailyEntry[]) => arr.reduce((s, e) => s + e.pain, 0) / arr.length
  const avgPainWith = avg(withProt)
  const avgPainWithout = avg(withoutProt)
  const deltaRaw = avgPainWith - avgPainWithout
  const deltaAbs = Math.abs(deltaRaw)

  if (deltaAbs < 2) {
    return { protocol_id: protocol.id, protocol_name: protocol.name, status: 'unclear', delta: parseFloat(deltaAbs.toFixed(1)), avgPainWith: parseFloat(avgPainWith.toFixed(1)), avgPainWithout: parseFloat(avgPainWithout.toFixed(1)), daysTracked: validEntries.length }
  }

  const status = deltaRaw >= 2 ? 'increases_pain' : 'decreases_pain'
  return { protocol_id: protocol.id, protocol_name: protocol.name, status, delta: parseFloat(deltaAbs.toFixed(1)), avgPainWith: parseFloat(avgPainWith.toFixed(1)), avgPainWithout: parseFloat(avgPainWithout.toFixed(1)), daysTracked: validEntries.length }
}

export function generateProtocolInsight(protocol: ProtocolDescriptor, eff: ProtocolEffectiveness) {
  const { name, icon } = protocol
  if (eff.status === 'increases_pain') {
    return {
      type: 'WARNING',
      icon,
      topLine: `${name} correlates with higher pain`,
      discovery: `On days you use ${name.toLowerCase()}, pain averages ${eff.avgPainWith.toFixed(0)} out of 10 vs ${eff.avgPainWithout.toFixed(0)} on other days.`,
      action: `Consider pausing ${name.toLowerCase()} for a week and see if pain improves.`,
    } as const
  }
  if (eff.status === 'decreases_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      icon,
      topLine: `${name} seems to help`,
      discovery: `On days you use ${name.toLowerCase()}, pain averages ${eff.avgPainWith.toFixed(0)} out of 10 vs ${eff.avgPainWithout.toFixed(0)} on other days.`,
      action: 'Keep it in your routine for now; we will keep watching.',
    } as const
  }
  return {
    type: 'PATTERN DISCOVERED',
    icon,
    topLine: `${name} impact is unclear`,
    discovery: `We need more variation to tell if ${name.toLowerCase()} is helping.`,
    action: 'Try alternating days for 1–2 weeks.',
  } as const
}


