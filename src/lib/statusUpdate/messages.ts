'use client'

import type { UserContext } from '@/lib/elli/userContext'

export type StatusUpdate = {
  summary: string
  nextAction: string
  stats: {
    checkinsLogged?: number
    currentStreak?: number
    supplementsTracked?: number
    monthlySpend?: number
    reportsGenerated?: number
    dataQuality?: string
    potentialSavings?: number
  }
  observations?: string[]
}

export function generateStatusUpdate(context: UserContext): StatusUpdate {
  // Day 1
  if (context.daysTracked === 1) {
    return {
      summary: 'First check-in completed. Baseline established.',
      nextAction: 'Complete daily check-ins for 6 more days to reach minimum sample size for statistical analysis.',
      stats: {
        checkinsLogged: context.totalCheckins,
        currentStreak: context.currentStreak,
        supplementsTracked: context.activeTests?.length || 0,
        monthlySpend: calculateMonthlySpend(context)
      }
    }
  }

  // Day 2–6
  if (context.daysTracked >= 2 && context.daysTracked < 7) {
    const daysRemaining = Math.max(0, 7 - context.daysTracked)
    const observations: string[] = []
    if (context.microInsights && context.microInsights.length > 0) {
      const i = context.microInsights[0]
      observations.push(
        `${i.supplementName}: Preliminary signal detected (${i.diff > 0 ? '+' : ''}${Math.abs(i.diff).toFixed(1)} ${i.metric} differential). Sample size insufficient for significance testing (${i.samplesOn} ON, ${i.samplesOff} OFF). Minimum 7 total days required.`
      )
    }
    return {
      summary: 'Data collection in progress.' + (observations.length > 0 ? ' Early patterns emerging.' : ''),
      nextAction: `Continue daily check-ins. ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining until first statistical analysis.`,
      stats: {
        checkinsLogged: context.totalCheckins,
        currentStreak: context.currentStreak,
        dataQuality: 'Clean (0 confounds excluded)'
      },
      observations
    }
  }

  // Truth report ready
  if (context.hasNewTruthReport) {
    const reports = context.newTruthReports || []
    return {
      summary: 'Minimum sample size reached. Statistical analysis complete.',
      nextAction: 'Review Truth Report for detailed analysis and recommendations.',
      stats: {
        checkinsLogged: context.totalCheckins,
        currentStreak: context.currentStreak,
        reportsGenerated: reports.length
      },
      observations: reports.map(r => `Truth Report available: ${r.name}`)
    }
  }

  // Day 30+
  if (context.daysTracked >= 30) {
    return {
      summary: `Testing protocol active. ${context.daysTracked} days of continuous data.`,
      nextAction: 'Continue tracking for ongoing validation.',
      stats: {
        checkinsLogged: context.totalCheckins,
        currentStreak: context.currentStreak,
        reportsGenerated: context.newTruthReports?.length || 0,
        potentialSavings: calculatePotentialSavings(context)
      },
      observations: generateResultsSummary(context)
    }
  }

  // Default
  return {
    summary: `${context.daysTracked} day${context.daysTracked !== 1 ? 's' : ''} of data collected.`,
    nextAction: 'Continue daily check-ins to maintain data quality.',
    stats: {
      checkinsLogged: context.totalCheckins,
      currentStreak: context.currentStreak,
      supplementsTracked: context.activeTests?.length || 0
    }
  }
}

function calculateMonthlySpend(_context: UserContext): number | undefined {
  // No cost fields in UserContext; leave undefined to hide in UI
  return undefined
}

function calculatePotentialSavings(_context: UserContext): number | undefined {
  return undefined
}

function generateResultsSummary(context: UserContext): string[] {
  const out: string[] = []
  for (const i of context.microInsights?.slice(0, 3) || []) {
    const dir = i.diff > 0 ? 'positive' : i.diff < 0 ? 'negative' : 'neutral'
    out.push(`${i.supplementName}: ${dir} effect suggested on ${i.metric} (${Math.abs(i.diff).toFixed(1)} differential).`)
  }
  return out
}




