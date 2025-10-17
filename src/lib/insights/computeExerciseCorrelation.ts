export interface DailyEntry {
  local_date: string;
  pain: number;
  sleep_quality: number;
  mood: number;
  exercise_type?: string | null;
}

function getValidEntries(entries: DailyEntry[]): DailyEntry[] {
  return entries.filter((e) =>
    e && typeof e.pain === 'number' && typeof e.sleep_quality === 'number' && typeof e.mood === 'number'
  )
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function computeExerciseCorrelation(entries: DailyEntry[]) {
  const validEntries = getValidEntries(entries)

  if (validEntries.length < 10) return { status: 'not_enough_data' as const }

  const exerciseDays = validEntries.filter((e) => e.exercise_type && e.exercise_type !== 'none')
  const restDays = validEntries.filter((e) => !e.exercise_type || e.exercise_type === 'none')

  if (exerciseDays.length < 3 || restDays.length < 3) return { status: 'not_enough_data' as const }

  const avgPainExercise = average(exerciseDays.map((e) => e.pain))
  const avgPainRest = average(restDays.map((e) => e.pain))
  const delta = avgPainExercise - avgPainRest

  // next-day (delayed) effect
  const nextDayPain = exerciseDays
    .map((e) => {
      const nextDate = new Date(e.local_date)
      nextDate.setDate(nextDate.getDate() + 1)
      const ndStr = nextDate.toISOString().split('T')[0]
      const next = validEntries.find((x) => x.local_date === ndStr)
      return typeof next?.pain === 'number' ? next.pain : undefined
    })
    .filter((v): v is number => typeof v === 'number')

  const avgNextDayPain = nextDayPain.length >= 3 ? average(nextDayPain) : null

  if (Math.abs(delta) >= 2) {
    return {
      status: delta > 0 ? ('increases_pain' as const) : ('decreases_pain' as const),
      sameDayDelta: delta,
      avgPainExercise,
      avgPainRest,
    }
  }

  if (avgNextDayPain !== null && Math.abs(avgNextDayPain - avgPainRest) >= 2) {
    return {
      status: 'delayed_effect' as const,
      nextDayDelta: avgNextDayPain - avgPainRest,
      avgNextDayPain,
      avgPainRest,
    }
  }

  return { status: 'no_clear_pattern' as const }
}

export function computeExerciseTypeCorrelation(exerciseType: string, entries: DailyEntry[]) {
  const validEntries = getValidEntries(entries)
  const typeDays = validEntries.filter((e) => e.exercise_type === exerciseType)
  const otherDays = validEntries.filter((e) => e.exercise_type !== exerciseType)

  if (typeDays.length < 3) return { status: 'not_enough_data' as const }

  const avgPainType = average(typeDays.map((e) => e.pain))
  const avgPainOther = average(otherDays.map((e) => e.pain))
  const delta = avgPainType - avgPainOther

  if (Math.abs(delta) >= 2) {
    return {
      status: delta > 0 ? ('increases_pain' as const) : ('decreases_pain' as const),
      delta,
      avgPainType,
      avgPainOther,
    }
  }

  return { status: 'no_clear_pattern' as const }
}

export function generateExerciseInsight(result: any) {
  if (result.status === 'increases_pain') {
    return {
      type: 'WARNING',
      topLine: 'Exercise days correlate with higher pain',
      discovery: `On exercise days your pain averages ${result.avgPainExercise.toFixed(0)} out of 10 vs ${result.avgPainRest.toFixed(0)} on rest days.`,
      action: 'Consider lowering intensity or switching to gentler activities during flare-ups.',
    } as const
  }
  if (result.status === 'decreases_pain') {
    return {
      type: 'PATTERN DISCOVERED',
      topLine: 'Exercise is linked to lower pain',
      discovery: `On exercise days your pain averages ${result.avgPainExercise.toFixed(0)} out of 10 vs ${result.avgPainRest.toFixed(0)} on rest days.`,
      action: 'Keep doing what works — consistency seems helpful.',
    } as const
  }
  if (result.status === 'delayed_effect') {
    return {
      type: 'PATTERN DISCOVERED',
      topLine: 'Exercise impacts next-day pain',
      discovery: `The day after exercise your pain averages ${result.avgNextDayPain.toFixed(0)} out of 10 vs ${result.avgPainRest.toFixed(0)} on rest days.`,
      action: 'Adjust timing and intensity to manage next-day effects.',
    } as const
  }
  return {
    type: 'PATTERN DISCOVERED',
    topLine: 'No clear exercise pattern yet',
    discovery: 'We need more variation to see how exercise affects your pain.',
    action: 'Track 1–2 weeks with a mix of rest and gentle activity.',
  } as const
}


