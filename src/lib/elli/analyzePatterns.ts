/**
 * COMPREHENSIVE PATTERN ANALYSIS
 * 
 * Analyzes all available data sources to detect meaningful patterns:
 * - Sleep-pain correlation
 * - Supplement effectiveness
 * - Exercise impact
 * - Treatment effectiveness
 * - Gear usage impact
 * - Trends over time
 * - Best/worst days
 */

import type { FullContext, FullContextCheckIn, SupplementLog, ExerciseLog } from './getFullContext';

export interface SleepPainCorrelation {
  hasCorrelation: boolean;
  avgPainHighSleep: number | null;
  avgPainLowSleep: number | null;
  difference: number | null;
  confidence: 'high' | 'medium' | 'low';
  sampleSize: number;
}

export interface SupplementEffectiveness {
  supplementName: string;
  avgMetricWith: number;
  avgMetricWithout: number;
  difference: number;
  metric: 'pain' | 'sleep' | 'mood';
  significant: boolean;
  daysTracked: number;
}

export interface ExerciseImpact {
  exerciseType: string;
  avgPainAfter: number;
  avgMoodAfter: number;
  sessions: number;
  beneficial: boolean;
}

export interface TrendAnalysis {
  direction: 'improving' | 'worsening' | 'stable';
  metric: 'pain' | 'sleep' | 'mood';
  changeAmount: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface DayExtreme {
  date: string;
  pain: number;
  mood: number;
  sleep: number;
  reason?: string;
}

export interface ComprehensivePatterns {
  sleepPainCorrelation: SleepPainCorrelation;
  sleepMoodCorrelation: SleepPainCorrelation; // Reuse same structure
  supplementEffectiveness: SupplementEffectiveness[];
  exerciseImpact: ExerciseImpact[];
  trends: TrendAnalysis[];
  bestDay: DayExtreme | null;
  worstDay: DayExtreme | null;
  insights: string[];
}

/**
 * Analyze all patterns from full context
 */
export function analyzePatterns(fullContext: FullContext): ComprehensivePatterns {
  const { allCheckIns, supplements, exercises } = fullContext;
  // LOGGING: Track pattern analysis and guards
  try {
    // eslint-disable-next-line no-console
    console.log('═══════════════════════════════════');
    // eslint-disable-next-line no-console
    console.log('🔍 analyzePatterns() called');
    // eslint-disable-next-line no-console
    console.log('Check-in count:', allCheckIns.length);
    // eslint-disable-next-line no-console
    console.log('Will compute best/worst:', allCheckIns.length >= 7);
    // eslint-disable-next-line no-console
    console.log('═══════════════════════════════════');
  } catch {}
  
  // Run all analyses
  const sleepPainCorrelation = analyzeSleepPainCorrelation(allCheckIns);
  const sleepMoodCorrelation = analyzeSleepMoodCorrelation(allCheckIns);
  const supplementEffectiveness = analyzeSupplementEffectiveness(allCheckIns, supplements);
  const exerciseImpact = analyzeExerciseImpact(allCheckIns, exercises);
  const trends = analyzeTrends(allCheckIns);
  // NUCLEAR OPTION: Force null best/worst when < 7 days to avoid premature claims
  const forced = allCheckIns.length < 7
    ? { bestDay: null, worstDay: null }
    : findExtremes(allCheckIns);
  const { bestDay, worstDay } = forced;
  
  // Generate insights from detected patterns
  const insights = generateInsights({
    sleepPainCorrelation,
    sleepMoodCorrelation,
    supplementEffectiveness,
    exerciseImpact,
    trends,
    bestDay,
    worstDay,
  }, allCheckIns.length);
  
  return {
    sleepPainCorrelation,
    sleepMoodCorrelation,
    supplementEffectiveness,
    exerciseImpact,
    trends,
    bestDay,
    worstDay,
    insights,
  };
}

/**
 * Analyze sleep-pain correlation
 */
export function analyzeSleepPainCorrelation(checkIns: FullContextCheckIn[]): SleepPainCorrelation {
  if (checkIns.length < 5) {
    return {
      hasCorrelation: false,
      avgPainHighSleep: null,
      avgPainLowSleep: null,
      difference: null,
      confidence: 'low',
      sampleSize: checkIns.length,
    };
  }
  
  const highSleepDays = checkIns.filter(c => c.sleep_quality >= 7);
  const lowSleepDays = checkIns.filter(c => c.sleep_quality < 7);
  
  if (highSleepDays.length === 0 || lowSleepDays.length === 0) {
    return {
      hasCorrelation: false,
      avgPainHighSleep: null,
      avgPainLowSleep: null,
      difference: null,
      confidence: 'low',
      sampleSize: checkIns.length,
    };
  }
  
  const avgPainHighSleep = average(highSleepDays.map(c => c.pain));
  const avgPainLowSleep = average(lowSleepDays.map(c => c.pain));
  const difference = avgPainLowSleep - avgPainHighSleep;
  
  // Determine confidence based on sample size
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (checkIns.length >= 14 && highSleepDays.length >= 3 && lowSleepDays.length >= 3) {
    confidence = 'high';
  } else if (checkIns.length >= 7) {
    confidence = 'medium';
  }
  
  return {
    hasCorrelation: Math.abs(difference) >= 2, // 2+ point difference is significant
    avgPainHighSleep: round(avgPainHighSleep, 1),
    avgPainLowSleep: round(avgPainLowSleep, 1),
    difference: round(difference, 1),
    confidence,
    sampleSize: checkIns.length,
  };
}

/**
 * Analyze sleep-mood correlation
 */
export function analyzeSleepMoodCorrelation(checkIns: FullContextCheckIn[]): SleepPainCorrelation {
  if (checkIns.length < 5) {
    return {
      hasCorrelation: false,
      avgPainHighSleep: null,
      avgPainLowSleep: null,
      difference: null,
      confidence: 'low',
      sampleSize: checkIns.length,
    };
  }
  
  const highSleepDays = checkIns.filter(c => c.sleep_quality >= 7);
  const lowSleepDays = checkIns.filter(c => c.sleep_quality < 7);
  
  if (highSleepDays.length === 0 || lowSleepDays.length === 0) {
    return {
      hasCorrelation: false,
      avgPainHighSleep: null,
      avgPainLowSleep: null,
      difference: null,
      confidence: 'low',
      sampleSize: checkIns.length,
    };
  }
  
  const avgMoodHighSleep = average(highSleepDays.map(c => c.mood));
  const avgMoodLowSleep = average(lowSleepDays.map(c => c.mood));
  const difference = avgMoodHighSleep - avgMoodLowSleep;
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (checkIns.length >= 14) confidence = 'high';
  else if (checkIns.length >= 7) confidence = 'medium';
  
  return {
    hasCorrelation: Math.abs(difference) >= 1.5,
    avgPainHighSleep: round(avgMoodHighSleep, 1), // Using same structure, but for mood
    avgPainLowSleep: round(avgMoodLowSleep, 1),
    difference: round(difference, 1),
    confidence,
    sampleSize: checkIns.length,
  };
}

/**
 * Analyze supplement effectiveness
 */
export function analyzeSupplementEffectiveness(
  checkIns: FullContextCheckIn[],
  supplements: { id: string; name: string }[]
): SupplementEffectiveness[] {
  // TODO: Implement when supplement_logs table exists
  // For now, return empty array
  return [];
}

/**
 * Analyze exercise impact
 */
export function analyzeExerciseImpact(
  checkIns: FullContextCheckIn[],
  exercises: ExerciseLog[]
): ExerciseImpact[] {
  if (exercises.length === 0) return [];
  
  // Group exercises by type
  const exercisesByType = exercises.reduce((acc, ex) => {
    if (!acc[ex.type]) acc[ex.type] = [];
    acc[ex.type].push(ex);
    return acc;
  }, {} as Record<string, ExerciseLog[]>);
  
  // Analyze each exercise type
  const impacts: ExerciseImpact[] = [];
  
  for (const [type, logs] of Object.entries(exercisesByType)) {
    if (logs.length < 3) continue; // Need at least 3 sessions
    
    // Find check-ins on days with this exercise
    const daysWithExercise = logs.map(l => l.date);
    const checkInsWithExercise = checkIns.filter(c => 
      daysWithExercise.includes(c.date)
    );
    
    if (checkInsWithExercise.length === 0) continue;
    
    const avgPain = average(checkInsWithExercise.map(c => c.pain));
    const avgMood = average(checkInsWithExercise.map(c => c.mood));
    
    impacts.push({
      exerciseType: type,
      avgPainAfter: round(avgPain, 1),
      avgMoodAfter: round(avgMood, 1),
      sessions: logs.length,
      beneficial: avgMood >= 6 && avgPain <= 6, // Mood good, pain manageable
    });
  }
  
  return impacts;
}

/**
 * Analyze trends over time
 */
export function analyzeTrends(checkIns: FullContextCheckIn[]): TrendAnalysis[] {
  if (checkIns.length < 5) return [];
  
  const trends: TrendAnalysis[] = [];
  
  // Analyze pain trend
  const painTrend = calculateTrend(checkIns, 'pain');
  if (painTrend) trends.push(painTrend);
  
  // Analyze sleep trend
  const sleepTrend = calculateTrend(checkIns, 'sleep_quality');
  if (sleepTrend) trends.push({ ...sleepTrend, metric: 'sleep' });
  
  // Analyze mood trend
  const moodTrend = calculateTrend(checkIns, 'mood');
  if (moodTrend) trends.push({ ...moodTrend, metric: 'mood' });
  
  return trends;
}

/**
 * Calculate trend for a specific metric
 */
function calculateTrend(
  checkIns: FullContextCheckIn[],
  metric: 'pain' | 'sleep_quality' | 'mood'
): TrendAnalysis | null {
  if (checkIns.length < 5) return null;
  
  const midpoint = Math.floor(checkIns.length / 2);
  const firstHalf = checkIns.slice(0, midpoint);
  const secondHalf = checkIns.slice(midpoint);
  
  const metricKey = metric === 'sleep_quality' ? 'sleep_quality' : metric;
  
  const avgFirst = average(firstHalf.map(c => c[metricKey]));
  const avgSecond = average(secondHalf.map(c => c[metricKey]));
  
  // For pain: lower is better (improving if negative change)
  // For sleep/mood: higher is better (improving if positive change)
  let changeAmount = avgSecond - avgFirst;
  if (metric === 'pain') {
    changeAmount = avgFirst - avgSecond; // Invert for pain
  }
  
  let direction: 'improving' | 'worsening' | 'stable';
  if (Math.abs(changeAmount) < 1) {
    direction = 'stable';
  } else if (changeAmount > 0) {
    direction = 'improving';
  } else {
    direction = 'worsening';
  }
  
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (checkIns.length >= 14) confidence = 'high';
  else if (checkIns.length >= 7) confidence = 'medium';
  
  return {
    direction,
    metric: metric === 'sleep_quality' ? 'sleep' : metric,
    changeAmount: round(Math.abs(changeAmount), 1),
    confidence,
  };
}

/**
 * Find best and worst days
 */
export function findExtremes(checkIns: FullContextCheckIn[]): {
  bestDay: DayExtreme | null;
  worstDay: DayExtreme | null;
} {
  // CRITICAL: Require at least 7 days for meaningful best/worst comparison
  if (checkIns.length < 7) {
    try { console.log(`🚫 findExtremes blocked: Need 7+ days, have ${checkIns.length}`); } catch {}
    return { bestDay: null, worstDay: null };
  }
  
  // Calculate composite score for each day
  const scored = checkIns.map(c => ({
    ...c,
    score: c.mood + c.sleep_quality - c.pain, // Higher is better
  }));
  
  // Sort by score
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  
  return {
    bestDay: {
      date: best.date,
      pain: best.pain,
      mood: best.mood,
      sleep: best.sleep_quality,
    },
    worstDay: {
      date: worst.date,
      pain: worst.pain,
      mood: worst.mood,
      sleep: worst.sleep_quality,
    },
  };
}

/**
 * Generate human-readable insights from patterns
 */
function generateInsights(patterns: Partial<ComprehensivePatterns>, dayCount?: number): string[] {
  const insights: string[] = [];
  
  // Sleep-pain correlation insight
  if (patterns.sleepPainCorrelation?.hasCorrelation && patterns.sleepPainCorrelation.difference) {
    insights.push(
      `Your pain drops to ${patterns.sleepPainCorrelation.avgPainHighSleep}/10 when you sleep 7+ hours, ` +
      `but spikes to ${patterns.sleepPainCorrelation.avgPainLowSleep}/10 on poor sleep nights. ` +
      `That's a ${Math.abs(patterns.sleepPainCorrelation.difference).toFixed(1)} point difference.`
    );
  }
  
  // Sleep-mood correlation insight
  if (patterns.sleepMoodCorrelation?.hasCorrelation && patterns.sleepMoodCorrelation.difference) {
    insights.push(
      `Your mood is ${Math.abs(patterns.sleepMoodCorrelation.difference).toFixed(1)} points higher ` +
      `on days you sleep well.`
    );
  }
  
  // Trend insights
  if (patterns.trends) {
    for (const trend of patterns.trends) {
      if (trend.direction !== 'stable' && trend.confidence !== 'low') {
        const emoji = trend.direction === 'improving' ? '📈' : '📉';
        insights.push(
          `${emoji} ${capitalizeFirst(trend.metric)} is ${trend.direction} by ${trend.changeAmount} points`
        );
      }
    }
  }
  
  // Best/worst day insights
  if (patterns.bestDay && patterns.worstDay) {
    const total = typeof dayCount === 'number' ? dayCount : undefined;
    if (total === undefined || total >= 7) {
      insights.push(
        `Your best day was ${formatDate(patterns.bestDay.date)} ` +
        `(pain ${patterns.bestDay.pain}/10, mood ${patterns.bestDay.mood}/10)`
      );
    } else {
      try { console.log(`⚠️ generateInsights: bestDay exists but only ${total} days - skipping`); } catch {}
    }
  }
  
  // Exercise insights
  if (patterns.exerciseImpact && patterns.exerciseImpact.length > 0) {
    const beneficial = patterns.exerciseImpact.filter(e => e.beneficial);
    if (beneficial.length > 0) {
      insights.push(
        `${beneficial[0].exerciseType} seems helpful - ` +
        `mood averages ${beneficial[0].avgMoodAfter}/10 on those days`
      );
    }
  }
  
  return insights;
}

/**
 * Utility: Calculate average
 */
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Utility: Round to decimal places
 */
function round(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Utility: Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Utility: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

