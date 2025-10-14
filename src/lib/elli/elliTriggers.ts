/**
 * Elli Triggers
 * Determines when to show Elli messages and what type
 */

export interface ElliTrigger {
  shouldShow: boolean;
  messageType: 'welcome' | 'milestone' | 'daily' | null;
}

/**
 * Determine if Elli should show a message based on check-in count
 */
export async function shouldShowElliMessage(
  checkInCount: number
): Promise<ElliTrigger> {
  
  // First check-in - welcome message
  if (checkInCount === 1) {
    return { shouldShow: true, messageType: 'welcome' };
  }
  
  // Milestones - special celebration messages
  const milestones = [3, 7, 14, 30, 60, 90];
  if (milestones.includes(checkInCount)) {
    return { shouldShow: true, messageType: 'milestone' };
  }
  
  // Daily update - regular check-ins
  // Show on every check-in to keep Elli present
  return { shouldShow: true, messageType: 'daily' };
}

/**
 * Determine if a pattern is significant enough to mention
 */
export function isSignificantPattern(
  metric: 'sleep' | 'pain' | 'mood',
  difference: number
): boolean {
  // Pain/mood changes of 2+ points are significant
  if (metric === 'pain' || metric === 'mood') {
    return Math.abs(difference) >= 2;
  }
  
  // Sleep changes of 1.5+ hours are significant
  if (metric === 'sleep') {
    return Math.abs(difference) >= 1.5;
  }
  
  return false;
}

/**
 * Calculate if sleep-pain correlation exists
 */
export function analyzeSleepPainCorrelation(checkIns: any[]): {
  hasCorrelation: boolean;
  avgPainHighSleep: number | null;
  avgPainLowSleep: number | null;
  difference: number | null;
} {
  if (checkIns.length < 5) {
    return {
      hasCorrelation: false,
      avgPainHighSleep: null,
      avgPainLowSleep: null,
      difference: null,
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
    };
  }
  
  const avgPainHighSleep = 
    highSleepDays.reduce((sum, c) => sum + c.pain, 0) / highSleepDays.length;
  const avgPainLowSleep = 
    lowSleepDays.reduce((sum, c) => sum + c.pain, 0) / lowSleepDays.length;
  
  const difference = avgPainLowSleep - avgPainHighSleep;
  
  return {
    hasCorrelation: difference >= 2, // 2+ point difference is significant
    avgPainHighSleep,
    avgPainLowSleep,
    difference,
  };
}

/**
 * Detect if user is on an improving or worsening trend
 */
export function detectTrend(checkIns: any[]): 'improving' | 'worsening' | 'stable' {
  if (checkIns.length < 5) return 'stable';
  
  // Compare first half vs second half
  const midpoint = Math.floor(checkIns.length / 2);
  const firstHalf = checkIns.slice(0, midpoint);
  const secondHalf = checkIns.slice(midpoint);
  
  const avgPainFirst = firstHalf.reduce((sum, c) => sum + c.pain, 0) / firstHalf.length;
  const avgPainSecond = secondHalf.reduce((sum, c) => sum + c.pain, 0) / secondHalf.length;
  
  const difference = avgPainFirst - avgPainSecond;
  
  if (difference >= 1.5) return 'improving'; // Pain went down
  if (difference <= -1.5) return 'worsening'; // Pain went up
  return 'stable';
}

