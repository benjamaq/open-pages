import { getGreeting } from './utils/greetings'
import type { MessageContext } from './types'

export function buildMessage(context: MessageContext): string {
  const { userName, todayEntry, microInsights, realInsights } = context

  // 1. Greeting
  let message = `${getGreeting()}, ${userName}!\n\n`

  // 2. Today's summary (sleep, mood, pain order for universal feel)
  message += `Thanks for checking in—sleep quality at ${todayEntry.sleep_quality}, mood at ${todayEntry.mood}, pain at ${todayEntry.pain}.\n\n`

  // 3. Add micro-insights in priority order
  const celebration = microInsights.find(i => i.type === 'celebration')
  const baseline = microInsights.find(i => i.type === 'baseline')
  const change = microInsights.find(i => i.type === 'change')
  const weakSignal = microInsights.find(i => i.type === 'weak_signal')
  const progress = microInsights.find(i => i.type === 'progress')

  if (celebration) {
    message += `${celebration.message}\n\n`
  }

  if (baseline) {
    if (baseline.badge) message += `${baseline.badge}\n`
    message += `${baseline.message}\n\n`
  }

  if (change) {
    message += `${change.message}\n\n`
  }

  if (weakSignal) {
    const badge = weakSignal.badge ? `${weakSignal.badge} ` : ''
    message += `${badge}(Confidence: ${weakSignal.confidence})\n${weakSignal.message}\n\n`
  }

  if (progress) {
    message += `${progress.message}\n\n`
  }

  // 4. Add real insights if available (Day 7+)
  if (realInsights && realInsights.length > 0) {
    message += `📊 Pattern detected!\n\n`
    realInsights.slice(0, 3).forEach(insight => {
      message += `**${insight.title}**\n${insight.summary}\n\n`
    })
  }

  // 5. Call-to-action for early days (before Day 7)
  if (microInsights.length > 0 && (!realInsights || realInsights.length === 0)) {
    message += `💡 Add life factors today (stress, food, activities) to help me find patterns faster.`
  }

  return message.trim()
}


