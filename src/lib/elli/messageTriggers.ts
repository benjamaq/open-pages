/**
 * MESSAGE TRIGGER SYSTEM WITH RATE LIMITING
 * 
 * Determines when to generate Elli messages and whether to use AI or templates
 * Manages API costs and prevents excessive OpenAI calls
 * 
 * RULES:
 * - Max 5 OpenAI calls per day per user
 * - Min 4 hours between AI messages
 * - Always use AI for milestones
 * - Use AI for significant pattern discoveries
 * - Use templates for daily quick comments
 */

import { createClient } from '@/lib/supabase/server';

export type MessageTriggerType = 
  | 'daily_comment'       // After every check-in (template-based)
  | 'milestone'           // Day 3, 7, 14, 30, 60, 90 (AI-powered)
  | 'pattern_discovery'   // When significant pattern detected (AI-powered)
  | 'weekly_summary';     // Every 7 days (AI-powered)

export interface TriggerDecision {
  shouldGenerate: boolean;
  useAI: boolean;
  triggerType: MessageTriggerType;
  reason: string;
}

/**
 * Decide if Elli should generate a message and whether to use AI
 */
export async function decideTrigger(
  userId: string,
  checkInCount: number,
  hasSignificantPattern: boolean = false,
  hasCheckedInToday: boolean = false
): Promise<TriggerDecision> {
  
  // 1. Check if it's a milestone
  const milestones = [1, 3, 7, 14, 30, 60, 90];
  let isMilestone = milestones.includes(checkInCount);
  
  // Edge case: If this is the first ever check-in (count === 1) and the user already
  // has a check-in for today (i.e., this is a second submission in the same day),
  // do not show "first check-in" milestone again. Treat as a daily comment.
  if (checkInCount === 1 && hasCheckedInToday) {
    isMilestone = false;
  }
  
  // 2. Check if it's a weekly summary (every 7 check-ins)
  const isWeeklySummary = checkInCount > 0 && checkInCount % 7 === 0 && !isMilestone;
  
  // 3. Check rate limits
  const canUseAI = await checkRateLimits(userId);
  
  // MILESTONE (highest priority)
  if (isMilestone) {
    if (canUseAI) {
      await logAPICall(userId, 'milestone');
      return {
        shouldGenerate: true,
        useAI: true,
        triggerType: 'milestone',
        reason: `Milestone: Day ${checkInCount}`,
      };
    } else {
      // Use template fallback for milestone if rate limited
      return {
        shouldGenerate: true,
        useAI: false,
        triggerType: 'milestone',
        reason: `Milestone but rate limited - using template`,
      };
    }
  }
  
  // PATTERN DISCOVERY (high priority)
  if (hasSignificantPattern && checkInCount >= 7) {
    if (canUseAI) {
      await logAPICall(userId, 'pattern_discovery');
      return {
        shouldGenerate: true,
        useAI: true,
        triggerType: 'pattern_discovery',
        reason: 'Significant pattern detected',
      };
    } else {
      return {
        shouldGenerate: false,
        useAI: false,
        triggerType: 'pattern_discovery',
        reason: 'Pattern found but rate limited - skipping',
      };
    }
  }
  
  // WEEKLY SUMMARY (medium priority)
  if (isWeeklySummary) {
    if (canUseAI) {
      await logAPICall(userId, 'weekly_summary');
      return {
        shouldGenerate: true,
        useAI: true,
        triggerType: 'weekly_summary',
        reason: `Weekly summary: ${checkInCount} days`,
      };
    } else {
      return {
        shouldGenerate: true,
        useAI: false,
        triggerType: 'weekly_summary',
        reason: 'Weekly summary but rate limited - using template',
      };
    }
  }
  
  // DAILY COMMENT (always show, always template)
  return {
    shouldGenerate: true,
    useAI: false,
    triggerType: 'daily_comment',
    reason: 'Daily check-in comment',
  };
}

/**
 * Check if user is within rate limits for AI calls
 * Returns true if AI can be used, false if rate limited
 */
async function checkRateLimits(userId: string): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    // RULE 1: Max 5 OpenAI calls per day
    const todayCalls = await getOpenAICallsToday(userId);
    if (todayCalls >= 5) {
      console.log(`⚠️ Rate limit: User ${userId} has ${todayCalls}/5 calls today`);
      return false;
    }
    
    // RULE 2: Min 4 hours between AI messages
    const hoursSinceLastCall = await getHoursSinceLastAICall(userId);
    if (hoursSinceLastCall !== null && hoursSinceLastCall < 4) {
      console.log(`⚠️ Rate limit: Last AI call was ${hoursSinceLastCall.toFixed(1)} hours ago (need 4h)`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Error checking rate limits:', error);
    // Err on side of caution - don't use AI if check fails
    return false;
  }
}

/**
 * Get number of OpenAI API calls made today for a user
 */
async function getOpenAICallsToday(userId: string): Promise<number> {
  const supabase = await createClient();
  
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('elli_api_calls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());
  
  if (error) {
    console.error('Error getting API call count:', error);
    return 999; // Assume rate limited if error
  }
  
  return count || 0;
}

/**
 * Get hours since last AI-generated message
 * Returns null if no previous AI calls
 */
async function getHoursSinceLastAICall(userId: string): Promise<number | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('elli_api_calls')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error || !data) {
    return null; // No previous calls
  }
  
  const lastCallTime = new Date(data.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastCallTime.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff;
}

/**
 * Log an OpenAI API call for rate limiting
 */
async function logAPICall(
  userId: string,
  messageType: string
): Promise<void> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('elli_api_calls')
      .insert({
        user_id: userId,
        message_type: messageType,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error logging API call:', error);
    }
  } catch (error) {
    console.error('Error logging API call:', error);
  }
}

/**
 * Check if today is a milestone for a user
 */
export function isMilestoneDay(checkInCount: number): boolean {
  const milestones = [1, 3, 7, 14, 30, 60, 90];
  return milestones.includes(checkInCount);
}

/**
 * Get milestone type name
 */
export function getMilestoneName(checkInCount: number): string | null {
  switch (checkInCount) {
    case 1: return 'First check-in';
    case 3: return '3 days';
    case 7: return '1 week';
    case 14: return '2 weeks';
    case 30: return '1 month';
    case 60: return '2 months';
    case 90: return '3 months';
    default: return null;
  }
}

/**
 * Check if patterns are significant enough to generate a message
 */
export function hasSignificantPattern(patterns: {
  sleepPainCorrelation?: { hasCorrelation: boolean; difference: number | null };
  trends?: Array<{ direction: string; changeAmount: number }>;
}): boolean {
  // Sleep-pain correlation with 2+ point difference is significant
  if (patterns.sleepPainCorrelation?.hasCorrelation && 
      patterns.sleepPainCorrelation.difference !== null &&
      Math.abs(patterns.sleepPainCorrelation.difference) >= 2) {
    return true;
  }
  
  // Trend of 2+ points is significant
  if (patterns.trends) {
    for (const trend of patterns.trends) {
      if (trend.direction !== 'stable' && trend.changeAmount >= 2) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get user's API usage stats (for debugging/monitoring)
 */
export async function getAPIUsageStats(userId: string): Promise<{
  callsToday: number;
  callsThisWeek: number;
  callsThisMonth: number;
  lastCallTime: string | null;
}> {
  const supabase = await createClient();
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [
    { count: callsToday },
    { count: callsThisWeek },
    { count: callsThisMonth },
    { data: lastCall }
  ] = await Promise.all([
    supabase
      .from('elli_api_calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString()),
    
    supabase
      .from('elli_api_calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString()),
    
    supabase
      .from('elli_api_calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', monthStart.toISOString()),
    
    supabase
      .from('elli_api_calls')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);
  
  return {
    callsToday: callsToday || 0,
    callsThisWeek: callsThisWeek || 0,
    callsThisMonth: callsThisMonth || 0,
    lastCallTime: lastCall?.created_at || null,
  };
}

