'use server'

import { createClient } from '@/lib/supabase/server'
import { computeBestWorst, computeSevenDayTrend, computeSleepPainCorrelation, type DailyEntry } from '@/lib/insights/computeInsights'
import { saveElliMessage, saveOrUpdateInsightMessage } from '@/lib/db/elliMessages'
import { computeLifestyleEffectiveness, generateLifestyleInsight } from '@/lib/insights/computeLifestyleEffectiveness'
import { computeSymptomPattern, generateSymptomInsight } from '@/lib/insights/computeSymptomPatterns'
import { computeExerciseCorrelation, computeExerciseTypeCorrelation, generateExerciseInsight } from '@/lib/insights/computeExerciseCorrelation'
import { computeProtocolEffectiveness, generateProtocolInsight } from '@/lib/insights/computeProtocolEffectiveness'
import { computeSupplementEffectiveness, generateSupplementInsight } from '@/lib/insights/computeSupplementEffectiveness'
import { runCorrelationBatch, selectTodaysInsight } from '@/lib/insights/correlation-engine/batch-processor'
import { analyzeMedicationsForUser } from '@/lib/insights/correlation-engine/med-analyzer'
import { analyzeSymptomClusters } from '@/lib/insights/correlation-engine/symptom-analyzer'

export async function computeAndPersistInsights(userId: string) {
  const supabase = await createClient()

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('local_date, pain, sleep_quality, mood, lifestyle_factors, symptoms, exercise_type, exercise_intensity, protocols, skipped_supplements')
    .eq('user_id', userId)
    .order('local_date', { ascending: true })
    .limit(30)

  if (!entries || entries.length === 0) {
    return { created: 0, skipped: 0 }
  }

  // Global minimum data requirements
  const totalDays = entries.length
  const hasAtLeast = (n: number) => totalDays >= n

  const today = new Date().toISOString().split('T')[0]
  let created = 0

  // Do NOT delete today's insights. We want to preserve original created_at
  // and update in place per insight_key using saveOrUpdateInsightMessage.

  // Sleep-Pain Correlation (require at least 10 days)
  const sleepPain = hasAtLeast(10) ? computeSleepPainCorrelation(entries) : { show: false, goodSleepAvgPain: 0, poorSleepAvgPain: 0, delta: 0 }
  if (sleepPain.show) {
    const sleepPainInsight = {
      type: 'PATTERN DISCOVERED',
      topLine: 'Sleep affects your pain',
      discovery: `We discovered that when you have good sleep (7 or more out of 10), your pain the next day is usually around ${sleepPain.goodSleepAvgPain.toFixed(0)} out of 10. But when your sleep is poor (less than 7), your pain jumps to around ${sleepPain.poorSleepAvgPain.toFixed(0)} out of 10.`,
      action: `This means if you prioritize sleep tonight, you'll likely wake up with less pain tomorrow. Get 7+ hours if you can.`,
      icon: '💤',
      insight_key: 'sleep_pain_correlation',
      priority: 1,
    }
    await saveOrUpdateInsightMessage(userId, `${sleepPainInsight.topLine}\n${sleepPainInsight.action}`, sleepPainInsight)
    created++
  }

  // 7-Day Trend (require at least 7 days)
  const trend = hasAtLeast(7) ? computeSevenDayTrend(entries) : null
  if (trend) {
    const { hypothesis, lastWeekPain, thisWeekPain, label } = buildTrendHypothesis(entries)
    const base = {
      insight_key: 'seven_day_trend',
      priority: 2,
    }
    if (trend.status === 'improving') {
      const high = Math.max(lastWeekPain, thisWeekPain)
      const low = Math.min(lastWeekPain, thisWeekPain)
      const trendInsight = {
        type: 'GREAT NEWS',
        topLine: "You're getting better",
        discovery: `Your pain has dropped from ${high.toFixed(0)} out of 10 to ${low.toFixed(0)} out of 10 this week. That's real progress.`,
        action: hypothesis || 'Keep doing whatever you are doing — it seems to be helping.',
        icon: '📈',
        ...base,
      }
      await saveOrUpdateInsightMessage(userId, `${trendInsight.topLine}\n${trendInsight.action}`, trendInsight)
    } else if (trend.status === 'worsening') {
      const low = Math.min(lastWeekPain, thisWeekPain)
      const high = Math.max(lastWeekPain, thisWeekPain)
      const trendInsight = {
        type: 'WARNING',
        topLine: 'Your pain is climbing',
        discovery: `We noticed your pain has increased from ${low.toFixed(0)} out of 10 to ${high.toFixed(0)} out of 10 over the last 7 days. Something changed.`,
        action: hypothesis || 'Your sleep and mood look similar to last week, so it might be activity, stress, or something we are not tracking yet. Check your notes for what was different this week.',
        icon: '🚨',
        ...base,
      }
      await saveOrUpdateInsightMessage(userId, `${trendInsight.topLine}\n${trendInsight.action}`, trendInsight)
    } else {
      const avg = calculateAvgPain(entries).toFixed(0)
      const trendInsight = {
        type: 'PATTERN DISCOVERED',
        topLine: 'Pain is stable',
        discovery: `This week looks similar to last week — your pain held around ${avg} out of 10.`,
        action: 'Keep tracking — stability is useful; we will spot shifts as more data comes in.',
        icon: '📊',
        ...base,
      }
      await saveOrUpdateInsightMessage(userId, `${trendInsight.topLine}\n${trendInsight.action}`, trendInsight)
    }
    created++
  }

  // Best/Worst Day (require at least 7 days)
  const { best } = hasAtLeast(7) ? computeBestWorst(entries) : { best: null }
  if (best) {
    const parts: string[] = []
    parts.push(`Your pain was only ${best.pain} out of 10 — the lowest it's been.`)
    if (typeof best.sleep === 'number') parts.push(`You also slept ${best.sleep} out of 10 that night`)
    if (typeof best.mood === 'number') parts.push(`and your mood was ${best.mood} out of 10.`)
    const discovery = parts.join(' ').replace(/\s+/g, ' ').trim()

    const bestDayInsight = {
      type: 'PATTERN DISCOVERED',
      topLine: `You had a breakthrough ${best.label}`,
      discovery,
      action: 'What did you do differently? Exercise? Less stress? A supplement? Try to recreate that day — it worked for you.',
      icon: '✨',
      insight_key: 'best_day',
      priority: 3,
    }
    await saveOrUpdateInsightMessage(userId, `${bestDayInsight.topLine}\n${bestDayInsight.action}`, bestDayInsight)
    created++
  }

  // Lifestyle Factors (Priority 3 - above supplements) (require at least 5 days)
  try {
    if (!hasAtLeast(5)) throw new Error('not_enough_data')
    const lifestyleFactors = [
      { id: 'alcohol', name: 'Alcohol', icon: '🍷' },
      { id: 'high_carb_meal', name: 'High-carb meals', icon: '🍝' },
      { id: 'high_stress', name: 'High stress', icon: '😰' },
      { id: 'work_deadline', name: 'Work deadlines', icon: '📅' },
      { id: 'sitting_all_day', name: 'Sitting all day', icon: '💺' },
      { id: 'too_much_caffeine', name: 'Too much caffeine', icon: '☕' },
      { id: 'dehydrated', name: 'Dehydration', icon: '💧' },
      { id: 'poor_sleep_last_night', name: 'Poor sleep last night', icon: '😴' },
      { id: 'no_exercise', name: 'No movement', icon: '🛋️' },
      { id: 'ate_out', name: 'Ate out', icon: '🍔' },
    ] as const

    const computed = lifestyleFactors
      .map((factor) => ({ factor, eff: computeLifestyleEffectiveness(factor as any, entries as any) }))
      .filter(({ eff }) => eff.status !== 'not_enough_data' && eff.status !== 'unclear')
      .sort((a, b) => Math.abs(b.eff.delta) - Math.abs(a.eff.delta))
      .slice(0, 3)

    for (const { factor, eff } of computed) {
      const insight = generateLifestyleInsight(factor as any, eff)
      await saveOrUpdateInsightMessage(
        userId,
        `${insight.topLine}\n${insight.action}`,
        {
          insight_key: `lifestyle_${factor.id}`,
          type: insight.type,
          topLine: insight.topLine,
          discovery: insight.discovery,
          action: insight.action,
          icon: '⚙️',
          priority: 3,
          metrics: eff,
        }
      )
      created++
    }
  } catch (e) {
    console.warn('Lifestyle insights computation failed (continuing):', e)
  }

  // Supplements (Priority 4) (require at least 14 days typical, but we gate at 5 to allow testing)
  try {
    if (!hasAtLeast(5)) throw new Error('not_enough_data')
    // Build candidate list from actual skipped_supplements values in entries
    const observed = new Set<string>()
    for (const e of entries as any[]) {
      const arr = (e?.skipped_supplements || []) as string[]
      for (const s of arr) {
        const norm = (s || '').trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '')
        if (norm) observed.add(norm)
      }
    }

    // If none observed yet, fall back to a small common list
    const candidates = observed.size > 0
      ? Array.from(observed)
      : ['magnesium', 'vitamin_d', 'omega_3']

    console.log('🔍 Checking supplements list (count):', candidates, candidates.length)
    console.log('🧪 Checking supplements:', candidates)

    const rawResults = candidates.map((name) => {
      const eff = computeSupplementEffectiveness(name, entries as any)
      const passed = eff.status !== 'not_enough_data' && eff.status !== 'unclear'
      console.log(`🔍 Checking ${name}:`, eff, 'passed:', passed)
      return { name, eff, passed }
    })

    console.log('Supplements: raw results count =', rawResults.length)
    console.log('🧪 All supplement results:', rawResults.map((r) => ({ name: r.name, status: r.eff.status, delta: r.eff.delta })))

    const supplementResults = rawResults
      .filter(({ eff }) => eff.status !== 'not_enough_data' && eff.status !== 'unclear')
      .sort((a, b) => Math.abs(b.eff.delta) - Math.abs(a.eff.delta))
      .slice(0, 3)

    console.log('✅ Supplements passed filter:', supplementResults.length)
    console.log('🧪 Supplements passed filter:', supplementResults.length)

    for (const { name, eff } of supplementResults) {
      console.log('🧪 Saving supplement insight:', name)
      const insight = generateSupplementInsight(name, eff)
      await saveOrUpdateInsightMessage(
        userId,
        `${insight.topLine}\n${insight.action}`,
        {
          insight_key: `supplement_${name}`,
          type: insight.type,
          topLine: insight.topLine,
          discovery: insight.discovery,
          action: insight.action,
          icon: '💊',
          priority: 4,
          metrics: eff,
        }
      )
      created++
    }
  } catch (e) {
    console.warn('Supplement insights computation failed (continuing):', e)
  }

  // Symptoms (Priority 5) (require at least 5 days)
  try {
    if (!hasAtLeast(5)) throw new Error('not_enough_data')
    const symptoms = [
      { id: 'headache', name: 'Headaches', icon: '🤕' },
      { id: 'fatigue', name: 'Fatigue', icon: '😴' },
      { id: 'nausea', name: 'Nausea', icon: '🤢' },
      { id: 'brain_fog', name: 'Brain fog', icon: '🌫️' },
      { id: 'dizziness', name: 'Dizziness', icon: '😵' },
      { id: 'muscle_weakness', name: 'Muscle weakness', icon: '💪' },
      { id: 'anxiety', name: 'Anxiety', icon: '😰' },
      { id: 'digestive_issues', name: 'Digestive issues', icon: '🤢' },
    ] as const

    const results = symptoms
      .map((sym) => ({ sym, pattern: computeSymptomPattern(sym as any, entries as any) }))
      .filter(({ pattern }) => pattern.pattern_type !== 'not_enough_data')
      .sort((a, b) => (b.pattern.frequency || 0) - (a.pattern.frequency || 0))
      .slice(0, 3)

    for (const { sym, pattern } of results) {
      const insight = generateSymptomInsight(sym as any, pattern)
      await saveOrUpdateInsightMessage(
        userId,
        `${insight.topLine}\n${insight.action}`,
        {
          insight_key: `symptom_${sym.id}`,
          type: insight.type,
          topLine: insight.topLine,
          discovery: insight.discovery,
          action: insight.action,
          icon: '🧩',
          priority: 5,
          metrics: pattern,
        }
      )
      created++
    }
  } catch (e) {
    console.warn('Symptom insights computation failed (continuing):', e)
  }

  // Exercise (Priority 6) (require at least 5 days)
  try {
    if (!hasAtLeast(5)) throw new Error('not_enough_data')
    const ex = computeExerciseCorrelation(entries as any)
    if (ex.status !== 'not_enough_data' && ex.status !== 'no_clear_pattern') {
      const exerciseInsight = generateExerciseInsight(ex)
      await saveOrUpdateInsightMessage(
        userId,
        `${exerciseInsight.topLine}\n${exerciseInsight.action}`,
        {
          insight_key: 'exercise_general',
          type: exerciseInsight.type,
          topLine: exerciseInsight.topLine,
          discovery: exerciseInsight.discovery,
          action: exerciseInsight.action,
          icon: '🏃',
          priority: 6,
          metrics: ex,
        }
      )
      created++
    }

    const exerciseTypes = ['walking', 'running', 'gym', 'yoga']
    for (const t of exerciseTypes) {
      const typeCorr = computeExerciseTypeCorrelation(t, entries as any)
      if (typeCorr.status !== 'not_enough_data' && typeCorr.status !== 'no_clear_pattern') {
        const tl = typeCorr.status === 'increases_pain' ? `${t} correlates with higher pain` : `${t} correlates with lower pain`
        const discovery = `On days you do ${t}, pain averages ${(typeCorr.avgPainType || 0).toFixed(0)} vs ${(typeCorr.avgPainOther || 0).toFixed(0)} on other days.`
        const action = typeCorr.status === 'increases_pain' ? 'Dial down intensity or swap to gentler options.' : 'Keep up what helps; monitor for overuse.'
        await saveOrUpdateInsightMessage(
          userId,
          `${tl}\n${action}`,
          {
            insight_key: `exercise_${t}`,
            type: typeCorr.status === 'increases_pain' ? 'WARNING' : 'PATTERN DISCOVERED',
            topLine: tl,
            discovery,
            action,
            icon: '🏃',
            priority: 6,
            metrics: typeCorr,
          }
        )
        created++
      }
    }
  } catch (e) {
    console.warn('Exercise insights computation failed (continuing):', e)
  }

  // Protocols (Priority 7) (require at least 5 days)
  try {
    if (!hasAtLeast(5)) throw new Error('not_enough_data')
    const protocols = [
      { id: 'ice_bath', name: 'Ice baths', icon: '🧊' },
      { id: 'sauna', name: 'Sauna', icon: '🔥' },
      { id: 'meditation', name: 'Meditation', icon: '🧘' },
      { id: 'red_light', name: 'Red light therapy', icon: '💡' },
    ] as const

    const protResults = protocols
      .map((p) => ({ p, eff: computeProtocolEffectiveness(p as any, entries as any) }))
      .filter(({ eff }) => eff.status !== 'not_enough_data' && eff.status !== 'unclear')
      .sort((a, b) => Math.abs(b.eff.delta) - Math.abs(a.eff.delta))
      .slice(0, 2)

    for (const { p, eff } of protResults) {
      const insight = generateProtocolInsight(p as any, eff)
      await saveOrUpdateInsightMessage(
        userId,
        `${insight.topLine}\n${insight.action}`,
        {
          insight_key: `protocol_${p.id}`,
          type: insight.type,
          topLine: insight.topLine,
          discovery: insight.discovery,
          action: insight.action,
          icon: '🧪',
          priority: 7,
          metrics: eff,
        }
      )
      created++
    }
  } catch (e) {
    console.warn('Protocol insights computation failed (continuing):', e)
  }

  // After saving all insights, mark the top one as primary (last 24h window)
  await markPrimaryInsight(userId)

  // New: run high-priority correlation batch and persist top 1 insight
  try {
    const formatted = await runCorrelationBatch(userId, 'high')
    // Include medication effects and symptom clusters (optional additions)
    try {
      const medInsights = await analyzeMedicationsForUser(userId)
      formatted.push(...medInsights)
    } catch {}
    try {
      const symp = analyzeSymptomClusters((entries as any) || [])
      formatted.push(...symp)
    } catch {}
    const top = await selectTodaysInsight(formatted)
    if (top) {
      await saveOrUpdateInsightMessage(userId, `${top.title}\n${top.actionable}`, {
        insight_key: top.insightKey,
        type: top.type === 'tag_correlation' ? 'PATTERN DISCOVERED' : top.type === 'metric_correlation' ? 'PATTERN DISCOVERED' : 'GREAT NEWS',
        topLine: top.title,
        discovery: top.message,
        action: top.actionable,
        icon: '🧠',
        priority: top.priority,
        metrics: top.data,
        evidenceLink: top.evidenceLink,
        algorithmVersion: '2.0.0',
      } as any)
      created++
    }
  } catch (e) {
    console.warn('Correlation batch failed (continuing):', e)
  }

  return { created, skipped: 0 }
}

function calculateAvgPain(entries: DailyEntry[]): number {
  const last7 = entries.slice(-7)
  const sum = last7.reduce((acc, e) => acc + e.pain, 0)
  return sum / (last7.length || 1)
}

function calculateAvg(entries: DailyEntry[], key: keyof DailyEntry): number {
  const vals = entries.map((e) => (e[key] as number) ?? 0)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
}

function buildTrendHypothesis(entries: DailyEntry[]): { hypothesis: string; lastWeekPain: number; thisWeekPain: number; label: string } {
  const thisWeek = entries.slice(-7)
  const lastWeek = entries.slice(-14, -7)
  const lastWeekPain = calculateAvg(lastWeek, 'pain')
  const thisWeekPain = calculateAvg(thisWeek, 'pain')
  const lastWeekSleep = calculateAvg(lastWeek, 'sleep_quality')
  const thisWeekSleep = calculateAvg(thisWeek, 'sleep_quality')
  const sleepDelta = thisWeekSleep - lastWeekSleep
  const lastWeekMood = calculateAvg(lastWeek, 'mood')
  const thisWeekMood = calculateAvg(thisWeek, 'mood')
  const moodDelta = thisWeekMood - lastWeekMood

  let hypothesis = ''
  if (Math.abs(sleepDelta) >= 1) {
    hypothesis = `Looking at your data, we see your sleep ${sleepDelta < 0 ? 'dropped' : 'improved'} this week (average ${thisWeekSleep.toFixed(0)} out of 10 vs ${lastWeekSleep.toFixed(0)} out of 10 last week). ${sleepDelta < 0 ? 'This could be why.' : "That's probably helping."}`
  } else if (Math.abs(moodDelta) >= 1.5) {
    hypothesis = `Your mood ${moodDelta < 0 ? 'dropped' : 'improved'} this week (${thisWeekMood.toFixed(0)} out of 10 vs ${lastWeekMood.toFixed(0)} out of 10). ${moodDelta < 0 ? 'Stress or low mood might be affecting your pain.' : "That may be easing pain."}`
  }
  const label = thisWeekPain > lastWeekPain ? 'worsening' : thisWeekPain < lastWeekPain ? 'improving' : 'stable'
  return { hypothesis, lastWeekPain, thisWeekPain, label }
}

// Minimal governor: pick one best insight from last 24h
async function markPrimaryInsight(userId: string) {
  const supabase = await createClient()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: recent } = await supabase
    .from('elli_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('message_type', 'insight')
    .gte('created_at', yesterday.toISOString())
    .order('created_at', { ascending: false })

  if (!recent || recent.length === 0) return

  const scored = recent.map((ins: any) => {
    const delta = Math.abs(ins?.context?.metrics?.delta || ins?.context?.metrics?.sameDayDelta || 0)
    const priority = ins?.context?.priority ?? 5
    const priorityWeight = (10 - priority) / 10
    const score = delta * 0.7 + priorityWeight * 0.3
    return { ...ins, score }
  })
  scored.sort((a: any, b: any) => b.score - a.score)

  if (scored.length > 0) {
    // Clear any previous primary in the same window to keep only one
    await (supabase as any)
      .from('elli_messages')
      .update({ is_primary: false })
      .eq('user_id', userId)
      .eq('message_type', 'insight')
      .gte('created_at', yesterday.toISOString())

    await (supabase as any)
      .from('elli_messages')
      .update({ is_primary: true })
      .eq('id', scored[0].id)
  }
}


