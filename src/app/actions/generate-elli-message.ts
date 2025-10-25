'use server';

import { createClient } from '@/lib/supabase/server';
import { generateElliMessage, type ElliContext } from '@/lib/elli/generateElliMessage';
import type { ToneProfileType } from '@/lib/elli/toneProfiles';
import { saveElliMessage, getUserCheckInCount, getRecentCheckIns } from '@/lib/db/elliMessages';
import { getUserCondition } from '@/lib/db/userCondition';

/**
 * Generate and save an Elli message for a user
 * Called after check-ins, at milestones, etc.
 */
export async function generateAndSaveElliMessage(
  userId: string,
  messageType: 'post_checkin' | 'dashboard' | 'milestone',
  checkInData: {
    pain: number;
    mood: number;
    sleep: number;
  },
  options?: { tzOffsetMinutes?: number }
) {
  try {
    console.log('🔵 generateAndSaveElliMessage:start', { userId, messageType, checkInData });
    const supabase = await createClient();
    
    // Get user's display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, condition_primary, condition_details, tone_profile')
      .eq('user_id', userId)
      .single();
    
    // Always prefer first name for a warmer tone
    const { getFirstName } = await import('@/lib/name');
    const userName = getFirstName(profile?.display_name, 'there');
    
    // Get user's condition
    const condition = profile?.condition_primary ? {
      primary: profile.condition_primary,
      details: profile.condition_details || undefined
    } : undefined;
    
    // Get check-in count for milestone detection
    const checkInCount = await getUserCheckInCount(userId);
    
    // Get recent check-ins for pattern detection
    const recentCheckIns = await getRecentCheckIns(userId, 7);
    
    // Fetch today's factors (symptoms + lifestyle + exercise/protocols)
    const todayISO = new Date().toISOString().split('T')[0];
    const { data: todayEntry } = await supabase
      .from('daily_entries')
      .select('symptoms, lifestyle_factors, exercise_type, protocols')
      .eq('user_id', userId)
      .eq('local_date', todayISO)
      .maybeSingle();

    // Fetch primary insight to reference elegantly at the end
    const { data: primaryInsight } = await supabase
      .from('elli_messages')
      .select('context')
      .eq('user_id', userId)
      .eq('message_type', 'insight')
      .eq('is_primary', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Coerce null/undefined values to safe defaults so templates never show "null/10"
    const isFiniteNum = (n: any) => typeof n === 'number' && Number.isFinite(n);
    const safePain = isFiniteNum(checkInData?.pain) ? checkInData.pain : 0;
    const safeMood = isFiniteNum(checkInData?.mood) ? checkInData.mood : 5;
    const safeSleep = isFiniteNum(checkInData?.sleep) ? checkInData.sleep : 5;

    // Determine time of day for greeting, preferring client tz offset, then user's saved IANA timezone, then server time
    let hour: number;
    const hasClientOffset = options && typeof options.tzOffsetMinutes === 'number' && Number.isFinite(options.tzOffsetMinutes);
    if (hasClientOffset) {
      const ms = Date.now() - (options!.tzOffsetMinutes as number) * 60 * 1000;
      hour = new Date(ms).getHours();
    } else {
      // Try user's saved timezone from notification_preferences
      try {
        const profileId = (profile as any)?.id as string | undefined;
        if (profileId) {
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('timezone')
            .eq('profile_id', profileId)
            .maybeSingle();
          const tz = (prefs as any)?.timezone as string | undefined;
          if (tz) {
            const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false });
            const parts = fmt.formatToParts(new Date());
            const hStr = parts.find(p => p.type === 'hour')?.value || '0';
            hour = parseInt(hStr, 10);
          } else {
            hour = new Date().getHours();
          }
        } else {
          hour = new Date().getHours();
        }
      } catch {
        hour = new Date().getHours();
      }
    }
    const timeOfDay: 'morning' | 'afternoon' | 'evening' = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    // Build context for Elli
    const context: ElliContext = {
      userName,
      condition,
      checkIn: { pain: safePain, mood: safeMood, sleep: safeSleep },
      timeOfDay,
      daysOfTracking: checkInCount,
      previousCheckIns: recentCheckIns,
      toneProfile: (profile?.tone_profile as ToneProfileType) || 'general_wellness',
    readinessToday: Math.round(((safeMood * 0.2) + (safeSleep * 0.4) + ((10 - safePain) * 0.4)) * 10),
      readinessYesterday: (() => {
      const yesterday = recentCheckIns[1];
      if (!yesterday) return null;
      const mood = yesterday.mood ?? 5;
      const sleep = yesterday.sleep_quality ?? 5;
      const pain = yesterday.pain ?? 0;
      return Math.round(((mood * 0.2) + (sleep * 0.4) + ((10 - pain) * 0.4)) * 10);
      })(),
      factors: {
        symptoms: (todayEntry?.symptoms as string[] | null) || undefined,
        lifestyle_factors: (todayEntry?.lifestyle_factors as string[] | null) || undefined,
      },
      primaryInsight: primaryInsight?.context ?? null,
      // Explicit availability flags to prevent over-claiming on new accounts
      dataAvailability: {
        uniqueDays: Array.isArray(recentCheckIns) ? new Set(recentCheckIns.map((r:any)=>r.local_date)).size : 0,
        hasYesterday: Array.isArray(recentCheckIns) && recentCheckIns.some((r:any)=>{
          const y = new Date(); y.setDate(y.getDate() - 1);
          return r.local_date === y.toISOString().slice(0,10)
        }),
        hasLastWeek: Array.isArray(recentCheckIns) ? new Set(recentCheckIns.map((r:any)=>r.local_date)).size >= 7 : false,
      },
    };

    // Novelty detection: if we created new insights today, add flags
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const { data: recentInsights } = await supabase
        .from('elli_messages')
        .select('id, created_at, context')
        .eq('user_id', userId)
        .eq('message_type', 'insight')
        .order('created_at', { ascending: false })
        .limit(5);
      const createdToday = (recentInsights as any[] | null)?.filter((i) => (i.created_at || '').startsWith(todayISO)) || [];
      const hasNewSleep = createdToday.some((i:any) => i.context?.insight_key === 'sleep_pain_correlation');
      const hasNewTrendWarn = createdToday.some((i:any) => i.context?.insight_key === 'seven_day_trend' && i.context?.type === 'Warning');
      const hasNewGood = createdToday.some((i:any) => i.context?.insight_key === 'seven_day_trend' && i.context?.type === 'Great news');
      const hasAny = createdToday.length > 0;
      context.flags = {
        newSleepPattern: hasNewSleep,
        newTrendWarning: hasNewTrendWarn,
        newGoodNews: hasNewGood,
        hasAnyNewPatterns: hasAny,
      };
    } catch {}
    
    // Generate the message (with OpenAI or templates)
    let message = await generateElliMessage(messageType, context);
    console.log('🔵 generateAndSaveElliMessage:message_length', typeof message === 'string' ? message.length : 0);
    
    // Save to database
    await saveElliMessage(userId, messageType, message, {
      checkIn: checkInData,
      daysOfTracking: checkInCount,
      condition: condition?.primary,
    });
    console.log('🔵 generateAndSaveElliMessage:saved');
    
    return {
      success: true,
      message,
      daysOfTracking: checkInCount,
    };
    
  } catch (error) {
    console.error('Error generating Elli message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

