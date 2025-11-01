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
  try { console.log('🎯 IS DAY 1?', isDay1) } catch {}
  if (isDay1) {
    const sleepVal = todayEntry.sleep_quality
    const moodVal = todayEntry.mood
    const painVal = todayEntry.pain

    const day1Variations: string[] = [
      `💙 Hey ${userName}!\n\n` +
      `Thanks for your first check-in. I can see you're at:\n\n` +
      `- Sleep: ${sleepVal}/10\n` +
      `- Mood: ${moodVal}/10\n` +
      `- Pain: ${painVal}/10\n\n` +
      `This is our starting point. In 5–7 days of daily check-ins, patterns will start to show.\n\n` +
      `For now: log daily (20s). Add life factors when you can (caffeine, stress, what you're trying). More context = faster answers.\n\n` +
      `You've got this.`,

      `💙 Hey ${userName}!\n\n` +
      `Thanks for checking in. I can see you rated:\n\n` +
      `- Sleep: ${sleepVal}/10\n` +
      `- Mood: ${moodVal}/10\n` +
      `- Pain: ${painVal}/10\n\n` +
      `Over the next 5–7 days, we'll start spotting patterns together.\n\n` +
      `The more you share (stress levels, what you're taking, how you slept), the faster I can connect the dots. Even 20 seconds a day makes a difference.\n\n` +
      `Looking forward to this.`,

      `💙 Hey ${userName}!\n\n` +
      `First check-in done. Here's where you're at:\n\n` +
      `- Sleep: ${sleepVal}/10\n` +
      `- Mood: ${moodVal}/10\n` +
      `- Pain: ${painVal}/10\n\n` +
      `Give me 5–7 days of daily tracking and I'll start finding what's really affecting you.\n\n` +
      `For now, just show up each day (takes 20s). When you can, add context—caffeine, stress, activities. That's where the insights come from.\n\n` +
      `You're off to a good start.`
    ]

    const variation = Math.floor(Math.random() * day1Variations.length)
    const selected = day1Variations[variation]
    try { console.log('📤 RETURNING MESSAGE:', selected.substring(0, 100) + '...') } catch {}
    return selected
  }

  try { console.log('⚠️ NOT DAY 1 - Proceeding to regular message generation') } catch {}

  const micro = computeMicroInsights(userId, recentEntries)
  const real = recentEntries.length >= 7 ? await computeRealInsights(userId, recentEntries) : undefined

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


