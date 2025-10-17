'use server';

import { createClient } from '@/lib/supabase/server';
import { generateElliMessage, type ElliContext } from '@/lib/elli/generateElliMessage';
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
  }
) {
  try {
    console.log('🔵 generateAndSaveElliMessage:start', { userId, messageType, checkInData });
    const supabase = await createClient();
    
    // Get user's display name
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, condition_primary, condition_details')
      .eq('user_id', userId)
      .single();
    
    const userName = profile?.display_name || 'User';
    
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

    // Determine time of day for greeting
    const hour = new Date().getHours();
    const timeOfDay: 'morning' | 'afternoon' | 'evening' = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    // Build context for Elli
    const context: ElliContext = {
      userName,
      condition,
      checkIn: { pain: safePain, mood: safeMood, sleep: safeSleep },
      timeOfDay,
      daysOfTracking: checkInCount,
      previousCheckIns: recentCheckIns,
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
    
    // Determine if today's factors connect to any CONFIRMED insights (seen 3+ times)
    let linked: { key: string; topLine: string } | null = null;
    try {
      const { data: pastInsights } = await supabase
        .from('elli_messages')
        .select('context, created_at')
        .eq('user_id', userId)
        .eq('message_type', 'insight')
        .order('created_at', { ascending: false })
        .limit(200);
      const counts: Record<string, number> = {};
      (pastInsights || []).forEach((i:any) => {
        const k = i?.context?.insight_key; if (!k) return; counts[k] = (counts[k]||0)+1;
      });
      const confirmedKeys = new Set(Object.keys(counts).filter(k => counts[k] >= 3));
      const todaysSymptoms: string[] = (context.factors?.symptoms as string[] | undefined) || [];
      const todaysLifestyle: string[] = (context.factors?.lifestyle_factors as string[] | undefined) || [];
      const exerciseType: string | undefined = (todayEntry as any)?.exercise_type || undefined;
      const protocols: string[] = (todayEntry as any)?.protocols || [];
      const tryMatch = (ins: any): string | null => {
        const key: string = ins?.context?.insight_key || '';
        if (!confirmedKeys.has(key)) return null;
        if (key.startsWith('lifestyle_')) {
          const slug = key.replace('lifestyle_', '');
          if (todaysLifestyle.includes(slug)) return key;
        } else if (key.startsWith('symptom_')) {
          const slug = key.replace('symptom_', '');
          if (todaysSymptoms.includes(slug)) return key;
        } else if (key.startsWith('exercise_')) {
          const slug = key.replace('exercise_', '');
          if (exerciseType && exerciseType === slug) return key;
        } else if (key.startsWith('protocol_')) {
          const slug = key.replace('protocol_', '');
          if (Array.isArray(protocols) && protocols.includes(slug)) return key;
        }
        return null;
      };
      const match = (pastInsights || []).find((i:any) => tryMatch(i));
      if (match) {
        linked = { key: match.context.insight_key, topLine: match.context.topLine };
      }
    } catch {}

    // Generate the message (with OpenAI or templates)
    let message = await generateElliMessage(messageType, context);
    if (linked) {
      const linkUrl = `/patterns#insight-${linked.key}`;
      message = `${message}\n\n💡 This connects to a pattern we've confirmed:\n${linked.topLine}\n→ View insight: ${linkUrl}`;
    }
    console.log('🔵 generateAndSaveElliMessage:message_length', typeof message === 'string' ? message.length : 0);
    
    // Save to database
    await saveElliMessage(userId, messageType, message, {
      checkIn: checkInData,
      daysOfTracking: checkInCount,
      condition: condition?.primary,
      linked_insight_key: linked?.key,
      linked_insight_topLine: linked?.topLine,
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

