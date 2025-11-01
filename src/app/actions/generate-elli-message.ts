'use server';

import { createClient } from '@/lib/supabase/server';
import { generateElliMessage } from '@/lib/elli/message-service';
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
      const offset = options!.tzOffsetMinutes as number; // minutes ahead of UTC (positive east of UTC)
      // Derive client local hour from server time and client offset
      const ms = Date.now() - offset * 60 * 1000;
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
    const timeOfDay: 'morning' | 'afternoon' | 'evening' = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    console.log('[TIMEZONE DEBUG]', {
      serverTime: new Date().toISOString(),
      usedHour: hour,
      hasClientOffset,
      clientOffsetMinutes: hasClientOffset ? (options!.tzOffsetMinutes as number) : undefined,
      timeOfDay
    });

    // Map to message-service params
    const toEntry = (r: any) => ({
      local_date: r?.local_date,
      pain: typeof r?.pain === 'number' ? r.pain : 0,
      mood: typeof r?.mood === 'number' ? r.mood : 5,
      sleep_quality: typeof r?.sleep_quality === 'number' ? r.sleep_quality : 5,
      tags: Array.isArray(r?.tags) ? r.tags as string[] : undefined,
    })

    const recentEntries = Array.isArray(recentCheckIns) ? recentCheckIns.map(toEntry) : []
    const todayStructuredEntry = {
      pain: safePain,
      mood: safeMood,
      sleep_quality: safeSleep,
      tags: (todayEntry?.lifestyle_factors as string[] | null) || undefined,
    }

    // Generate the message via new service (optional humanizer retained by default)
    const message = await generateElliMessage({
      userId,
      userName,
      todayEntry: todayStructuredEntry,
      recentEntries,
      useHumanizer: true,
      condition: (condition as any)?.primary || undefined,
    });
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

