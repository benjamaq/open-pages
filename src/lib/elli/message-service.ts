import { computeMicroInsights } from './micro-insights'
import { computeRealInsights } from './real-insights'
import { buildMessage } from './message-templates'
import { humanizeMessage } from './humanizer'
import type { GenerateMessageParams } from './types'

export async function generateElliMessage(params: GenerateMessageParams): Promise<string> {
  const { userId, userName, todayEntry, recentEntries, useHumanizer = true, condition } = params

  try {
    console.log('🔥🔥🔥 MESSAGE-SERVICE CALLED 🔥🔥🔥')
    console.log('Recent entries count:', Array.isArray(recentEntries) ? recentEntries.length : 0)
    console.log('Recent entries:', recentEntries)
    console.log('Today entry:', todayEntry)
  } catch {}

  // Day 1: purpose-built short welcome message
  // Some callers may include today's entry in recentEntries; treat 0 or 1 as Day 1
  const isDay1 = !Array.isArray(recentEntries) || recentEntries.length <= 1
  try { console.log('🎯 DAY 1 DETECTED?', isDay1) } catch {}
  if (isDay1) {
    // Primary metric mapping
    const map: any = {
      sleep: { label: 'Sleep', name: 'sleep', secondaryLabel: 'Pain', value: todayEntry.sleep_quality, secondaryValue: todayEntry.pain, emoji: '🌙' },
      pain: { label: 'Pain', name: 'pain', secondaryLabel: 'Sleep', value: todayEntry.pain, secondaryValue: todayEntry.sleep_quality, emoji: '💪' },
      migraines: { label: 'Migraine', name: 'migraine intensity', secondaryLabel: 'Sleep', value: todayEntry.pain, secondaryValue: todayEntry.sleep_quality, emoji: '🧠' },
      energy: { label: 'Energy', name: 'energy', secondaryLabel: 'Sleep', value: todayEntry.sleep_quality, secondaryValue: todayEntry.pain, emoji: '⚡' },
      other: { label: 'Overall', name: 'symptoms', secondaryLabel: 'Pain', value: todayEntry.sleep_quality, secondaryValue: todayEntry.pain, emoji: '✨' },
    }
    const primary = (typeof condition === 'string' && map[condition]) ? (condition as string) : 'other'
    const m = map[primary]
    const moodVal = todayEntry.mood

    // Empathy lines by condition
    const empathy: Record<string, (v:number)=>string> = {
      sleep: (v)=> v <= 5 ? `sleep is at ${v}/10 — that's tough, and I know how frustrating that is.` : `sleep is at ${v}/10 — there's room to improve.`,
      pain: (v)=> v >= 7 ? `pain is at ${v}/10 — I can see you're dealing with a lot right now.` : `pain is at ${v}/10 — we'll work on bringing that down.`,
      migraines: (v)=> v >= 7 ? `migraine intensity is at ${v}/10 — that's tough to deal with.` : `migraine intensity is at ${v}/10 — let's dig into why.`,
      energy: (v)=> v <= 4 ? `energy is at ${v}/10 — that's draining to manage.` : `energy is at ${v}/10 — we can push that higher.`,
      other: (v)=> `you're at ${v}/10 — let's figure this out.`,
    }
    // Suggestions by condition
    const suggestions: Record<string, string[]> = {
      sleep: [ 'adjust your meditation practice', 'set a consistent bedtime routine', 'keep your room cooler (65–68°F)' ],
      pain: [ '10 minutes of gentle movement', 'try heat/ice at specific times', 'review pain-med timing' ],
      migraines: [ 'hydrate consistently', 'keep meal timing steady', 'reduce late-night screens' ],
      energy: [ 'stick to a consistent sleep schedule', 'get 10+ min morning sunlight', 'balance activity and rest' ],
      other: [ 'small tweaks consistently', 'note timing windows', 'focus on one change at a time' ],
    }
    const line = `${m.label} ${m.value}/10 • Mood ${moodVal}/10 • ${m.secondaryLabel} ${m.secondaryValue}/10`
    const empathetic = empathy[primary](m.value)
    const secondaryNote = (m.secondaryValue >= 7 || m.secondaryValue <= 3)
      ? ` ${m.secondaryLabel} at ${m.secondaryValue}/10 might be playing a role — that's common.`
      : ''
    const sugg = suggestions[primary]
    const suggLine = `In the meantime, try ${sugg[0]}, ${sugg[1]}, or ${sugg[2]}.`
    const msg = `Hey ${userName}! Thanks for checking in.\n\n${line}\n\nI can see ${empathetic}${secondaryNote}\n\nOver the next week, I'll start spotting patterns to see what's going on. ${suggLine}\n\nKeep tracking. The more I know about you, the more we can find what helps.`
    return msg
  }

  try { console.log('⚠️ NOT DAY 1 - Proceeding to regular message generation') } catch {}

  const micro = computeMicroInsights(userId, recentEntries)
  const real = recentEntries.length >= 7 ? await computeRealInsights(userId, recentEntries) : undefined

  // Personalized daily summaries for Days 2–6
  if (!real && Array.isArray(recentEntries) && recentEntries.length > 1 && recentEntries.length < 7) {
    const primary = (condition && ['sleep','pain','migraines','energy','other'].includes(condition as string)) ? (condition as string) : 'other'
    const map: any = {
      sleep: { label: 'Sleep', name: 'sleep', verb: 'affecting', value: todayEntry.sleep_quality, secondaryLabel: 'Pain', secondaryValue: todayEntry.pain, emoji: '🌙' },
      pain: { label: 'Pain', name: 'pain', verb: 'helping', value: todayEntry.pain, secondaryLabel: 'Sleep', secondaryValue: todayEntry.sleep_quality, emoji: '💪' },
      migraines: { label: 'Migraine', name: 'migraine intensity', verb: 'triggering', value: todayEntry.pain, secondaryLabel: 'Sleep', secondaryValue: todayEntry.sleep_quality, emoji: '🧠' },
      energy: { label: 'Energy', name: 'energy', verb: 'affecting', value: todayEntry.sleep_quality, secondaryLabel: 'Sleep', secondaryValue: todayEntry.pain, emoji: '⚡' },
      other: { label: 'Overall', name: 'symptoms', verb: 'affecting', value: todayEntry.sleep_quality, secondaryLabel: 'Pain', secondaryValue: todayEntry.pain, emoji: '✨' },
    }
    const m = map[primary]
    const moodVal = todayEntry.mood
    const prevMood = recentEntries[recentEntries.length - 1]?.mood ?? moodVal
    const moodComment = moodVal > prevMood ? `Your mood is up to ${moodVal}/10 — that's progress!` : moodVal < prevMood ? `Your mood is at ${moodVal}/10 today.` : `Your mood is holding steady at ${moodVal}/10.`
    const line = `${m.label} ${m.value}/10 • Mood ${moodVal}/10 • ${m.secondaryLabel} ${m.secondaryValue}/10`
    const secondaryNote = (m.secondaryValue >= 7 || m.secondaryValue <= 3)
      ? ` ${m.secondaryLabel} at ${m.secondaryValue}/10 might be contributing.`
      : ''
    const suggestions: Record<string, string[]> = {
      sleep: [ 'adjust your meditation', 'set a consistent bedtime', 'keep your room cooler (65–68°F)' ],
      pain: [ '10 minutes gentle movement', 'try heat/ice timing', 'review med timing' ],
      migraines: [ 'hydrate', 'steady meal timing', 'cut late-night screens' ],
      energy: [ 'consistent sleep schedule', 'morning sunlight', 'balance activity/rest' ],
      other: [ 'small consistent tweaks', 'watch timing windows' ],
    }
    const sugg = suggestions[primary]
    const suggLine = `Try ${sugg.slice(0,3).join(', ')}.`
    const msg = `Hey ${userName}! Thanks for checking in.\n\n${line}\n\n${moodComment}${secondaryNote}\n\nI'll need a few more days to spot patterns. ${suggLine}`
    return msg
  }

  const structured = buildMessage({ userName, todayEntry, microInsights: micro, realInsights: real })

  const finalMessage = useHumanizer ? await humanizeMessage(structured, condition) : structured

  try {
    console.log('📝 [message-service] Elli message generated', {
      userId,
      dayCount: recentEntries.length,
      microCount: micro.length,
      hasReal: !!real?.length,
      length: finalMessage.length,
    })
    console.log('📝 [message-service] Preview:', finalMessage.substring(0, 120) + '...')
  } catch {}

  return finalMessage
}


