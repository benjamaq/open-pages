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
    const primaryMetrics: any = {
      sleep: { displayName: 'sleep', sliderLabel: 'Sleep', verb: 'affecting', goal: 'sleep better', emoji: '🌙', value: todayEntry.sleep_quality, secondaryLabel: 'Energy', secondaryValue: todayEntry.pain },
      pain: { displayName: 'pain', sliderLabel: 'Pain', verb: 'helping', goal: 'manage your pain', emoji: '💪', value: todayEntry.pain, secondaryLabel: 'Sleep', secondaryValue: todayEntry.sleep_quality },
      migraines: { displayName: 'migraine intensity', sliderLabel: 'Migraine', verb: 'triggering', goal: 'reduce your migraines', emoji: '🧠', value: todayEntry.pain, secondaryLabel: 'Sleep', secondaryValue: todayEntry.sleep_quality },
      energy: { displayName: 'energy', sliderLabel: 'Energy', verb: 'affecting', goal: 'boost your energy', emoji: '⚡', value: todayEntry.sleep_quality, secondaryLabel: 'Sleep', secondaryValue: todayEntry.pain },
      other: { displayName: 'symptoms', sliderLabel: 'Overall', verb: 'affecting', goal: 'feel better', emoji: '✨', value: todayEntry.sleep_quality, secondaryLabel: 'Pain', secondaryValue: todayEntry.pain },
    }
    const primary = (typeof condition === 'string' && primaryMetrics[condition]) ? condition as string : 'other'
    const metric = primaryMetrics[primary]
    const moodVal = todayEntry.mood
    const moodAssessment = moodVal >= 7 ? 'is solid' : moodVal >= 4 ? 'could be better' : 'needs attention'
    const tipMap: Record<string, string> = {
      sleep: 'Try keeping your bedroom cool (65–68°F helps most people)',
      pain: 'Gentle movement often helps — even just 10 minutes',
      migraines: 'Stay hydrated and watch for patterns in meal timing',
      energy: 'A consistent sleep schedule can make a big difference',
      other: 'Small consistent changes often have the biggest impact',
    }
    const line = `${metric.sliderLabel} ${metric.value}/10 • Mood ${moodVal}/10 • ${metric.secondaryLabel} ${metric.secondaryValue}/10`
    const msg = `Hey ${userName}! Thanks for checking in today.\n\n${line}\n\nI can see ${metric.displayName} is at ${metric.value}/10 — there's room to improve there. Your mood at ${moodVal}/10 ${moodAssessment}.\n\nOver the next week, I'll start spotting patterns. Keep checking in daily and we'll figure out what's ${metric.verb} your ${metric.displayName}.\n\n${metric.emoji} In the meantime: ${tipMap[primary]}`
    try { console.log('📤 RETURNING MESSAGE (Day1 personalized):', msg.substring(0, 120) + '...') } catch {}
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
    const msg = `Hey ${userName}! Thanks for checking in.\n\n${line}\n\n${moodComment}\n\nKeep tracking — I'll need a few more days to spot patterns, but we're getting closer to understanding what's ${m.verb} your ${m.name}.\n\n[View insights →]`
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


