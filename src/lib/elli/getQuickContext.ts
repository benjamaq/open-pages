/**
 * TIER 1 - QUICK CONTEXT RETRIEVAL
 * 
 * Fast queries for immediate responses (after check-in comments)
 * Only retrieves last 7 check-ins and current state
 * Target: <100ms query time
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ToneProfileType } from './toneProfiles';
import { getFirstName } from '@/lib/name';

export interface QuickContextUser {
  id: string;
  first_name: string;
  tone_profile: ToneProfileType;
  condition_category: string | null;
  condition_specific: string | null;
}

export interface QuickContextCheckIn {
  date: string;
  mood: number;
  sleep_quality: number;
  pain: number;
  tags?: string[];
  journal?: string;
}

export interface QuickContextSupplement {
  id: string;
  name: string;
  dosage?: string;
  timing?: string;
}

export interface QuickContextMessage {
  message_text: string;
  created_at: string;
}

export interface QuickContext {
  user: QuickContextUser;
  recentCheckIns: QuickContextCheckIn[];
  supplements: QuickContextSupplement[];
  recentMessages: QuickContextMessage[];
  daysOfTracking: number;
  todaysCheckIn: QuickContextCheckIn | null;
}

/**
 * Get quick context for immediate responses
 * Fast queries only - last 7 check-ins and current state
 */
export async function getQuickContext(userId: string): Promise<QuickContext> {
  const supabase = await createClient();
  
  try {
    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_id, display_name, tone_profile, condition_category, condition_specific')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    const user: QuickContextUser = {
      id: userId,
      first_name: getFirstName(profile.display_name, 'there'),
      tone_profile: (profile.tone_profile as ToneProfileType) || 'general_wellness',
      condition_category: profile.condition_category,
      condition_specific: profile.condition_specific,
    };

    // 2. Get last 7 check-ins
    const { data: checkIns, error: checkInsError } = await supabase
      .from('daily_entries')
      .select('local_date, mood, sleep_quality, pain, tags, journal')
      .eq('user_id', userId)
      .order('local_date', { ascending: false })
      .limit(7);

    const recentCheckIns: QuickContextCheckIn[] = (checkIns || []).map(c => ({
      date: c.local_date,
      mood: c.mood,
      sleep_quality: c.sleep_quality,
      pain: c.pain,
      tags: c.tags,
      journal: c.journal,
    }));

    // 3. Get active supplements
    const { data: userSupplements } = await supabase
      .from('user_stack')
      .select('id, name, serving_size, time_of_day')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const supplements: QuickContextSupplement[] = (userSupplements || []).map(s => ({
      id: s.id,
      name: s.name,
      dosage: s.serving_size,
      timing: s.time_of_day,
    }));

    // 4. Get last 3 Elli messages (to avoid repetition)
    const { data: messages } = await supabase
      .from('elli_messages')
      .select('message_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    const recentMessages: QuickContextMessage[] = (messages || []).map(m => ({
      message_text: m.message_text,
      created_at: m.created_at,
    }));

    // 5. Get total check-in count for milestone detection
    const { count: totalCheckIns } = await supabase
      .from('daily_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      user,
      recentCheckIns,
      supplements,
      recentMessages,
      daysOfTracking: totalCheckIns || 0,
      todaysCheckIn: recentCheckIns[0] || null,
    };

  } catch (error) {
    console.error('Error getting quick context:', error);
    
    // Return minimal fallback context
    return {
      user: {
        id: userId,
        first_name: 'there',
        tone_profile: 'general_wellness',
        condition_category: null,
        condition_specific: null,
      },
      recentCheckIns: [],
      supplements: [],
      recentMessages: [],
      daysOfTracking: 0,
      todaysCheckIn: null,
    };
  }
}

/**
 * Get just today's check-in (fastest query)
 */
export async function getTodaysCheckIn(userId: string): Promise<QuickContextCheckIn | null> {
  const supabase = await createClient();
  
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('daily_entries')
    .select('local_date, mood, sleep_quality, pain, tags, journal')
    .eq('user_id', userId)
    .eq('local_date', today)
    .single();

  if (!data) return null;

  return {
    date: data.local_date,
    mood: data.mood,
    sleep_quality: data.sleep_quality,
    pain: data.pain,
    tags: data.tags,
    journal: data.journal,
  };
}

